import type {MealType} from '@prisma/client';
import {PROTOCOL_MEAL_TIMES} from '@/lib/config/protocol-meal-times';
import {mapProtocolMealToSliderRecipe} from '@/lib/patient-portal/protocol-meal-slider-map';
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

export type PlanMenuPayload = {
    sections: PlanMenuSectionPayload[];
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

export async function loadProtocolPlanMenuForUser(
    userId: string
): Promise<PlanMenuPayload> {
    const patient = await prisma.patient.findUnique({
        where: {userId},
        select: {id: true}
    });

    if (!patient) {
        return {sections: []};
    }

    const protocol = await prisma.protocol.findFirst({
        where: {
            patientId: patient.id,
            status: 'ACTIVE'
        },
        orderBy: {createdAt: 'desc'},
        select: {
            weeksPlan: {
                orderBy: {weekNumber: 'asc'},
                select: {
                    days: {
                        orderBy: {dayIndex: 'asc'},
                        select: {
                            meals: {
                                select: protocolMealRecipeSelect
                            }
                        }
                    }
                }
            }
        }
    });

    if (!protocol) {
        return {sections: []};
    }

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

    return {sections};
}
