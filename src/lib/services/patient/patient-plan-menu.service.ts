import type {MealType} from '@prisma/client';
import {
    PROTOCOL_MEAL_LABELS,
    PROTOCOL_MEAL_TIMES
} from '@/lib/config/protocol-meal-times';
import type {EquivalenciasColumn} from '@/lib/patient-portal/equivalencias';
import type {PlanShoppingListItem} from '@/lib/patient-portal/shopping-list.types';
import {
    mapProtocolMealToSliderRecipe,
    PROTOCOL_MEAL_DISPLAY_ORDER
} from '@/lib/patient-portal/protocol-meal-slider-map';
import {
    loadEquivalenciasColumns,
    type AssignedMenuPortion
} from '@/lib/services/food/equivalencias.service';
import {
    loadPlanShoppingListByProtocolId
} from '@/lib/services/patient/patient-shopping-list.service';
import {prisma} from '@/lib/prisma';

export const PLAN_MENU_SECTIONS = [
    'DESAYUNO',
    'COLACIÓN',
    'COMIDA',
    'CENA',
    'BEBIDA'
] as const;

export type PlanMenuSection = (typeof PLAN_MENU_SECTIONS)[number];

export type PlanMenuRecipePayload = {
    id: string;
    title: string;
    imageUrl: string | null;
    ingredients: string[];
    instructions: string[];
};

export type PlanMenuSectionPayload = {
    section: PlanMenuSection;
    recipes: PlanMenuRecipePayload[];
};

export const PLAN_WEEK_DAY_NAMES = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
] as const;

const PLAN_WEEK_TABLE_MEAL_LABELS: Partial<Record<MealType, string>> = {
    SMOOTHIE: 'Licuado',
    BREAKFAST: 'Desayuno',
    SNACK: 'Colación',
    SNACK1: 'Colación 1',
    SNACK2: 'Colación 2',
    LUNCH: 'Comida',
    DINNER: 'Cena',
    DRINKS: 'Bebidas'
};

const PLAN_WEEK_TABLE_MEAL_ORDER: MealType[] = [
    ...PROTOCOL_MEAL_DISPLAY_ORDER,
    'SNACK'
];

export type PlanWeekScheduleRow = {
    mealType: MealType;
    mealTypeLabel: string;
    /** Recipe title per weekday index 0–6 (Mon–Sun); empty string when unset */
    mealsByDay: string[];
};

export type PlanWeekSchedule = {
    weekNumber: number;
    dayLabels: string[];
    rows: PlanWeekScheduleRow[];
};

export type PlanMenuPayload = {
    sections: PlanMenuSectionPayload[];
    weekSchedules: PlanWeekSchedule[];
    shoppingList: PlanShoppingListItem[];
    equivalencias: EquivalenciasColumn[];
};

const PROTOCOL_MEAL_TO_PDF_SECTION: Partial<Record<MealType, PlanMenuSection>> =
    {
        BREAKFAST: 'DESAYUNO',
        SMOOTHIE: 'DESAYUNO',
        SNACK: 'COLACIÓN',
        SNACK1: 'COLACIÓN',
        SNACK2: 'COLACIÓN',
        LUNCH: 'COMIDA',
        DINNER: 'CENA',
        DRINKS: 'BEBIDA'
    };

const protocolMealRecipeSelect = {
    id: true,
    mealType: true,
    extraIngredients: true,
    recipe: {
        select: {
            id: true,
            title: true,
            imageUrl: true,
            ingredients: {
                select: {
                    grams: true,
                    quantity: true,
                    unit: true,
                    ingredient: {
                        select: {
                            name: true,
                            food: {
                                select: {
                                    name: true,
                                    caloriesPer100g: true,
                                    proteinPer100g: true,
                                    carbsPer100g: true,
                                    fatPer100g: true,
                                    density: true
                                }
                            }
                        }
                    }
                }
            },
            extraIngredients: {
                select: {name: true}
            },
            steps: {
                select: {
                    stepNumber: true,
                    instruction: true
                }
            }
        }
    },
    portions: {
        select: {
            actualCalories: true,
            actualProtein: true,
            actualCarbs: true,
            actualFat: true,
            ingredients: {
                select: {
                    ingredientName: true,
                    unit: true,
                    baseQuantity: true,
                    targetQuantity: true,
                    baseGrams: true,
                    targetGrams: true
                }
            }
        }
    }
} as const;

function formatPlanIngredient(ingredient: {
    name: string;
    amount: string;
    unit: string;
}): string {
    const quantity = [ingredient.amount, ingredient.unit]
        .filter(Boolean)
        .join(' ')
        .trim();

    return quantity ? `${quantity} ${ingredient.name}` : ingredient.name;
}

function catalogNameForIngredient(
    ingredientName: string,
    recipeIngredients: Array<{
        ingredient: {name: string; food?: {name?: string | null} | null};
    }>
): string {
    const key = ingredientName.trim().toLowerCase();
    const match = recipeIngredients.find(
        row => row.ingredient.name.trim().toLowerCase() === key
    );

    return match?.ingredient.food?.name?.trim() || ingredientName.trim();
}

function collectAssignedMenuPortions(
    protocol: ProtocolWeeksForMenu
): AssignedMenuPortion[] {
    const byKey = new Map<string, AssignedMenuPortion>();

    const remember = (name: string, grams: number) => {
        const trimmed = name.trim();
        if (!trimmed || !Number.isFinite(grams) || grams <= 0) {
            return;
        }

        const key = trimmed.toLowerCase();
        const previous = byKey.get(key);
        if (!previous || grams > previous.grams) {
            byKey.set(key, {name: trimmed, grams});
        }
    };

    for (const week of protocol.weeksPlan) {
        for (const day of week.days) {
            for (const meal of day.meals) {
                const recipeIngredients = meal.recipe?.ingredients ?? [];
                const portionRows = meal.portions?.ingredients ?? [];

                if (portionRows.length > 0) {
                    for (const row of portionRows) {
                        remember(
                            catalogNameForIngredient(
                                row.ingredientName,
                                recipeIngredients
                            ),
                            row.targetGrams
                        );
                    }
                    continue;
                }

                for (const row of recipeIngredients) {
                    remember(
                        row.ingredient.food?.name?.trim() ||
                            row.ingredient.name,
                        row.grams
                    );
                }
            }
        }
    }

    return [...byKey.values()];
}

type ProtocolWeeksForMenu = {
    weeksPlan: Array<{
        weekNumber: number;
        days: Array<{
            dayIndex: number;
            meals: Array<Parameters<typeof mapProtocolMealToSliderRecipe>[0]>;
        }>;
    }>;
};

function buildWeekSchedulesFromProtocol(
    protocol: ProtocolWeeksForMenu
): PlanWeekSchedule[] {
    return protocol.weeksPlan.flatMap(week => {
        const mealsByType = new Map<MealType, string[]>();

        for (const mealType of PLAN_WEEK_TABLE_MEAL_ORDER) {
            mealsByType.set(
                mealType,
                Array.from({length: PLAN_WEEK_DAY_NAMES.length}, () => '')
            );
        }

        for (const day of week.days) {
            if (day.dayIndex < 0 || day.dayIndex >= PLAN_WEEK_DAY_NAMES.length) {
                continue;
            }

            for (const meal of day.meals) {
                if (!meal.recipe) {
                    continue;
                }

                const titles = mealsByType.get(meal.mealType);
                if (!titles) {
                    continue;
                }

                const title = meal.recipe.title.trim();
                if (!title || titles[day.dayIndex]) {
                    continue;
                }

                titles[day.dayIndex] = title;
            }
        }

        const rows = PLAN_WEEK_TABLE_MEAL_ORDER.flatMap(mealType => {
            const mealsByDay = mealsByType.get(mealType);
            if (!mealsByDay || mealsByDay.every(title => title.length === 0)) {
                return [];
            }

            return [
                {
                    mealType,
                    mealTypeLabel:
                        PLAN_WEEK_TABLE_MEAL_LABELS[mealType] ??
                        PROTOCOL_MEAL_LABELS[mealType] ??
                        mealType,
                    mealsByDay
                }
            ];
        });

        if (rows.length === 0) {
            return [];
        }

        return [
            {
                weekNumber: week.weekNumber,
                dayLabels: [...PLAN_WEEK_DAY_NAMES],
                rows
            }
        ];
    });
}

function buildPlanMenuFromProtocol(
    protocol: ProtocolWeeksForMenu
): PlanMenuPayload {
    const recipesBySection = new Map<
        PlanMenuSection,
        Map<string, PlanMenuRecipePayload>
    >();

    for (const week of protocol.weeksPlan) {
        for (const day of week.days) {
            for (const meal of day.meals) {
                if (!meal.recipe) {
                    continue;
                }

                const section = PROTOCOL_MEAL_TO_PDF_SECTION[meal.mealType];
                if (!section) {
                    continue;
                }

                const mapped = mapProtocolMealToSliderRecipe(
                    meal,
                    PROTOCOL_MEAL_TIMES[meal.mealType] ?? 'Cualquier hora'
                );

                if (!mapped) {
                    continue;
                }

                if (!recipesBySection.has(section)) {
                    recipesBySection.set(section, new Map());
                }

                const sectionRecipes = recipesBySection.get(section)!;
                if (sectionRecipes.has(meal.recipe.id)) {
                    continue;
                }

                sectionRecipes.set(meal.recipe.id, {
                    id: meal.recipe.id,
                    title: mapped.name,
                    imageUrl: meal.recipe.imageUrl,
                    ingredients: mapped.ingredients.map(formatPlanIngredient),
                    instructions: mapped.instructions
                });
            }
        }
    }

    const sections = PLAN_MENU_SECTIONS.flatMap(section => {
        const recipes = recipesBySection.get(section);
        if (!recipes || recipes.size === 0) {
            return [];
        }

        return [
            {
                section,
                recipes: Array.from(recipes.values())
            }
        ];
    });

    return {
        sections,
        weekSchedules: buildWeekSchedulesFromProtocol(protocol),
        shoppingList: [],
        equivalencias: []
    };
}

const protocolWeeksMenuSelect = {
    weeksPlan: {
        orderBy: {weekNumber: 'asc' as const},
        select: {
            weekNumber: true,
            days: {
                orderBy: {dayIndex: 'asc' as const},
                select: {
                    dayIndex: true,
                    meals: {
                        select: protocolMealRecipeSelect
                    }
                }
            }
        }
    }
};

const EMPTY_PLAN_MENU: PlanMenuPayload = {
    sections: [],
    weekSchedules: [],
    shoppingList: [],
    equivalencias: []
};

export async function loadProtocolPlanMenuByProtocolId(
    protocolId: string
): Promise<PlanMenuPayload> {
    const [protocol, shoppingList] = await Promise.all([
        prisma.protocol.findUnique({
            where: {id: protocolId},
            select: protocolWeeksMenuSelect
        }),
        loadPlanShoppingListByProtocolId(protocolId)
    ]);

    const assignedPortions = protocol
        ? collectAssignedMenuPortions(
              protocol as unknown as ProtocolWeeksForMenu
          )
        : [];
    const equivalencias = await loadEquivalenciasColumns(assignedPortions);

    if (!protocol) {
        return {...EMPTY_PLAN_MENU, equivalencias};
    }

    const menu = buildPlanMenuFromProtocol(
        protocol as unknown as ProtocolWeeksForMenu
    );

    return {
        ...menu,
        shoppingList,
        equivalencias
    };
}

export async function loadProtocolPlanMenuForUser(
    userId: string
): Promise<PlanMenuPayload> {
    const patient = await prisma.patient.findUnique({
        where: {userId},
        select: {id: true}
    });

    if (!patient) {
        return EMPTY_PLAN_MENU;
    }

    const protocol = await prisma.protocol.findFirst({
        where: {
            patientId: patient.id,
            status: 'ACTIVE'
        },
        orderBy: {createdAt: 'desc'},
        select: {
            id: true,
            ...protocolWeeksMenuSelect
        }
    });

    if (!protocol) {
        const equivalencias = await loadEquivalenciasColumns();
        return {...EMPTY_PLAN_MENU, equivalencias};
    }

    const typedProtocol = protocol as unknown as ProtocolWeeksForMenu;
    const [menu, shoppingList, equivalencias] = await Promise.all([
        Promise.resolve(buildPlanMenuFromProtocol(typedProtocol)),
        loadPlanShoppingListByProtocolId(protocol.id),
        loadEquivalenciasColumns(collectAssignedMenuPortions(typedProtocol))
    ]);

    return {
        ...menu,
        shoppingList,
        equivalencias
    };
}
