'use server';

import {MealType} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {GenerateProtocolPlanInput} from '@/lib/validations/protocol-generation.schema';
import {DayMeals, MealSlot} from '@/lib/interface/meal-interface';

// --------------------
// Types
// --------------------

type RecipeIngredientUnit =
    | 'GRAM'
    | 'PIECE'
    | 'CUP'
    | 'TBSP'
    | 'TSP'
    | 'ML'
    | 'OZ';

type RecipeSummary = {
    id: string;
    title: string;
    imageUrl: string | null;
    mealType: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: Array<{
        id: string;
        name: string;
        quantity: number;
        grams: number;
        unit: RecipeIngredientUnit;
        caloriesPer100g: number;
        proteinPer100g: number;
        carbsPer100g: number;
        fatPer100g: number;
        isDiscrete: boolean;
        maxPortionGrams: number | null;
    }>;
};

type MacroMealTarget = NonNullable<
    GenerateProtocolPlanInput['macroMealDistribution']
>[string];

const DAYS = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
] as const;

const MEAL_ORDER: MealType[] = [
    'SMOOTHIE',
    'BREAKFAST',
    'SNACK1',
    'SNACK2',
    'LUNCH',
    'DINNER',
    'DRINKS'
];

// --------------------
// Helpers
// --------------------

function round1(value: number) {
    return Number(value.toFixed(1));
}

function round2(value: number) {
    return Number(value.toFixed(2));
}

function normalizeAllergenName(value: string) {
    return value.trim().toLowerCase();
}

function normalizeRecipeIngredientUnit(
    unit?: RecipeIngredientUnit | string | null
): RecipeIngredientUnit {
    const normalized = unit?.toString().trim().toUpperCase();
    if (normalized === 'GRAM') return 'GRAM';
    if (normalized === 'PIECE') return 'PIECE';
    if (normalized === 'CUP') return 'CUP';
    if (normalized === 'TBSP') return 'TBSP';
    if (normalized === 'TSP') return 'TSP';
    if (normalized === 'ML') return 'ML';
    if (normalized === 'OZ') return 'OZ';
    return 'GRAM';
}

function getActiveMealKeys(
    mealDistribution?: Record<string, number>
): MealType[] {
    if (!mealDistribution) return ['BREAKFAST', 'LUNCH', 'DINNER'];

    return Object.entries(mealDistribution)
        .filter(([, v]) => v > 0)
        .map(([k]) => k as MealType);
}

function buildMealCalorieSplit(
    mealKeys: MealType[],
    mealDistribution?: Record<string, number>
) {
    const split: Record<MealType, number> = {
        SMOOTHIE: 0,
        BREAKFAST: 0,
        SNACK1: 0,
        SNACK2: 0,
        LUNCH: 0,
        DINNER: 0,
        DRINKS: 0
    };

    if (mealDistribution) {
        for (const key of mealKeys) {
            split[key] = (mealDistribution[key] ?? 0) / 100;
        }
        return split;
    }

    const equal = 1 / mealKeys.length;
    for (const key of mealKeys) {
        split[key] = equal;
    }

    return split;
}

function isRecipeAllowed(
    recipe: {
        ingredients: Array<{
            ingredient: {
                name: string;
                food?: {
                    name?: string;
                } | null;
            };
        }>;
        extraIngredients: Array<{name: string}>;
    },
    restrictedFoods: Set<string>
) {
    console.log('Paciente tiene restricciones:', Array.from(restrictedFoods));
    if (restrictedFoods.size === 0) return true;

    const ingredientNames = recipe.ingredients.map(item =>
        normalizeAllergenName(item.ingredient.name)
    );
    const ingredientFoodNames = recipe.ingredients
        .map(item => item.ingredient.food?.name)
        .filter((name): name is string => Boolean(name))
        .map(name => normalizeAllergenName(name));
    const extraIngredientNames = recipe.extraIngredients.map(item =>
        normalizeAllergenName(item.name)
    );

    for (const restrictedFood of restrictedFoods) {
        if (
            ingredientNames.some(
                name =>
                    name.includes(restrictedFood) ||
                    restrictedFood.includes(name)
            ) ||
            ingredientFoodNames.some(
                name =>
                    name.includes(restrictedFood) ||
                    restrictedFood.includes(name)
            ) ||
            extraIngredientNames.some(
                name =>
                    name.includes(restrictedFood) ||
                    restrictedFood.includes(name)
            )
        ) {
            return false;
        }
    }

    return true;
}

// --------------------
// Realism validation
// --------------------
function evaluateMealRealism(
    ingredients: RecipeSummary['ingredients'],
    scale: number
): {isRealistic: boolean; warnings: string[]} {
    const warnings: string[] = [];
    for (const item of ingredients) {
        const scaledGrams = item.grams * scale;

        // maxPortionGrams (si existe)
        if (item.maxPortionGrams && scaledGrams > item.maxPortionGrams) {
            warnings.push(
                `${item.name} excede porción recomendada (${Math.round(scaledGrams)}g)`
            );
        }

        // unidades discretas
        if (item.unit === 'PIECE') {
            const scaledQty = item.quantity * scale;

            if (scaledQty > 4) {
                warnings.push(
                    `${item.name}: ${Math.round(scaledQty)} piezas puede ser excesivo`
                );
            }
        }
    }

    return {
        isRealistic: warnings.length === 0,
        warnings
    };
}

// --------------------
// Nutrition
// --------------------
function computeRecipeNutrition(recipe: {
    title: string;
    ingredients: Array<{
        quantity?: number | null;
        unit?: RecipeIngredientUnit | null;
        grams: number;
        ingredient: {
            name: string;
            food: {
                caloriesPer100g: number | null;
                proteinPer100g: number | null;
                carbsPer100g: number | null;
                fatPer100g: number | null;
            } | null;
        };
    }>;
}) {
    console.log(
        '[computeRecipeNutrition] Calculando nutrición para receta',
        recipe.title
    );
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const item of recipe.ingredients) {
        const unit = normalizeRecipeIngredientUnit(item.unit);
        const quantity =
            typeof item.quantity === 'number' && item.quantity > 0
                ? item.quantity
                : unit === 'GRAM'
                  ? item.grams
                  : 1;

        const gramsForNutrition =
            typeof item.grams === 'number' && item.grams > 0
                ? item.grams
                : unit === 'GRAM'
                  ? quantity
                  : 100;
        const ratio = gramsForNutrition / 100;
        const food = item.ingredient.food;

        if (!food) continue;

        protein += (food.proteinPer100g ?? 0) * ratio;
        carbs += (food.carbsPer100g ?? 0) * ratio;
        fat += (food.fatPer100g ?? 0) * ratio;

        const hasCalories = typeof food.caloriesPer100g === 'number';
        calories += hasCalories
            ? (food.caloriesPer100g ?? 0) * ratio
            : ((food.proteinPer100g ?? 0) * 4 +
                  (food.carbsPer100g ?? 0) * 4 +
                  (food.fatPer100g ?? 0) * 9) *
              ratio;
    }

    return {
        calories: Math.round(calories),
        protein: round1(protein),
        carbs: round1(carbs),
        fat: round1(fat)
    };
}

// --------------------
// Meal builder
// --------------------

function buildMealCatalog(recipes: RecipeSummary[]) {
    const catalog: Record<string, RecipeSummary[]> = {
        smoothie: [],
        breakfast: [],
        snack1: [],
        snack2: [],
        lunch: [],
        dinner: [],
        drinks: []
    };

    for (const recipe of recipes) {
        if (recipe.mealType === 'SMOOTHIE') catalog.smoothie.push(recipe);
        if (recipe.mealType === 'BREAKFAST') catalog.breakfast.push(recipe);
        if (recipe.mealType === 'SNACK1') catalog.snack1.push(recipe);
        if (recipe.mealType === 'SNACK2') catalog.snack2.push(recipe);
        if (recipe.mealType === 'LUNCH') catalog.lunch.push(recipe);
        if (recipe.mealType === 'DINNER') catalog.dinner.push(recipe);
        if (recipe.mealType === 'DRINKS') catalog.drinks.push(recipe);
    }

    return catalog;
}

function getMacroMealTarget(
    macroMealDistribution: GenerateProtocolPlanInput['macroMealDistribution'],
    mealKey: MealType
) {
    if (!macroMealDistribution) return undefined;

    return (
        macroMealDistribution[mealKey] ??
        macroMealDistribution[mealKey.toLowerCase()] ??
        macroMealDistribution[mealKey.toUpperCase()]
    );
}

function getIngredientMacroKcal(
    ingredient: RecipeSummary['ingredients'][number],
    scaledGrams: number
) {
    const ratio = scaledGrams / 100;

    return {
        proteinKcal: (ingredient.proteinPer100g ?? 0) * ratio * 4,
        carbsKcal: (ingredient.carbsPer100g ?? 0) * ratio * 4,
        fatKcal: (ingredient.fatPer100g ?? 0) * ratio * 9
    };
}

function getMacroTargetWarnings(
    ingredientName: string,
    ingredientMacroKcal: {
        proteinKcal: number;
        carbsKcal: number;
        fatKcal: number;
    },
    macroTarget?: MacroMealTarget
) {
    const warnings: string[] = [];
    let shouldExclude = false;

    if (!macroTarget) {
        return {shouldExclude, warnings};
    }

    const checks = [
        {
            label: 'proteina',
            ingredientKcal: ingredientMacroKcal.proteinKcal,
            targetKcal: macroTarget.proteinKcal
        },
        {
            label: 'carbs',
            ingredientKcal: ingredientMacroKcal.carbsKcal,
            targetKcal: macroTarget.carbsKcal
        },
        {
            label: 'grasa',
            ingredientKcal: ingredientMacroKcal.fatKcal,
            targetKcal: macroTarget.fatKcal
        }
    ];

    for (const check of checks) {
        if (check.ingredientKcal <= 0) {
            continue;
        }

        if (check.targetKcal === 0) {
            shouldExclude = true;
            warnings.push(
                `${ingredientName} removido: aporta ${round1(check.ingredientKcal)} kcal de ${check.label} y el objetivo para esa comida es 0 kcal.`
            );
            continue;
        }

        if (check.ingredientKcal > check.targetKcal) {
            warnings.push(
                `${ingredientName} aporta ${round1(check.ingredientKcal)} kcal de ${check.label}, por encima del objetivo de ${round1(check.targetKcal)} kcal. Revisa si debes retirarlo o cambiarlo.`
            );
        }
    }

    return {shouldExclude, warnings};
}

function computePortionNutrition(portion: {
    targetGrams: number;
    baseCalories?: number;
    baseProtein?: number;
    baseCarbs?: number;
    baseFat?: number;
}) {
    const ratio = portion.targetGrams / 100;

    return {
        calories: (portion.baseCalories ?? 0) * ratio,
        protein: (portion.baseProtein ?? 0) * ratio,
        carbs: (portion.baseCarbs ?? 0) * ratio,
        fat: (portion.baseFat ?? 0) * ratio
    };
}

function buildMeal(
    recipe: RecipeSummary,
    targetCalories: number,
    macroTarget?: MacroMealTarget
): MealSlot {
    const scale = Number((targetCalories / recipe.calories).toFixed(2));

    const realism = evaluateMealRealism(recipe.ingredients, scale);
    const warnings = [...realism.warnings];

    const ingredientPortions = recipe.ingredients.flatMap(item => {
        const targetQuantity =
            item.unit === 'PIECE'
                ? Math.max(1, Math.round(item.quantity * scale))
                : Math.round(item.quantity * scale);
        const targetGrams = Math.round(item.grams * scale);
        const ingredientMacroKcal = getIngredientMacroKcal(item, targetGrams);
        const macroWarnings = getMacroTargetWarnings(
            item.name,
            ingredientMacroKcal,
            macroTarget
        );

        warnings.push(...macroWarnings.warnings);

        if (macroWarnings.shouldExclude) {
            return [];
        }

        return [
            {
                ingredientId: item.id,
                ingredientName: item.name,
                baseQuantity: item.quantity,
                targetQuantity,
                baseGrams: item.grams,
                targetGrams,
                unit: normalizeRecipeIngredientUnit(item.unit),
                baseCalories: item.caloriesPer100g,
                baseProtein: item.proteinPer100g,
                baseCarbs: item.carbsPer100g,
                baseFat: item.fatPer100g
            }
        ];
    });

    const portionTotals = ingredientPortions.reduce(
        (sum, portion) => {
            const nutrition = computePortionNutrition(portion);

            return {
                calories: sum.calories + nutrition.calories,
                protein: sum.protein + nutrition.protein,
                carbs: sum.carbs + nutrition.carbs,
                fat: sum.fat + nutrition.fat
            };
        },
        {calories: 0, protein: 0, carbs: 0, fat: 0}
    );

    const slot: MealSlot = {
        id: recipe.id,
        recipeName: recipe.title,
        imageUrl: recipe.imageUrl ?? undefined,
        calories: Math.round(portionTotals.calories),
        protein: round1(portionTotals.protein),
        carbs: round1(portionTotals.carbs),
        fat: round1(portionTotals.fat),
        portionMultiplier: scale,
        isRealistic: realism.isRealistic && warnings.length === 0,
        warnings,
        ingredientPortions
    };

    return slot;
}

// --------------------
// MAIN
// --------------------

export async function generateProtocolPlanForPatient(
    patientId: string,
    input: GenerateProtocolPlanInput
) {
    if (!input.planCalories || input.planCalories <= 0) {
        return {success: false, message: 'Calorías diarias inválidas'};
    }

    console.log(
        '[protocolGeneration] macroMealDistribution:',
        input.macroMealDistribution
    );

    const patient = await prisma.patient.findUnique({
        where: {id: patientId},
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true
                }
            },
            vitals: {
                orderBy: {
                    recordedAt: 'desc'
                },
                take: 1,
                select: {
                    weightKg: true
                }
            },
            allergies: {
                include: {
                    allergen: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            foodDislikes: {
                include: {
                    food: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            conditions: {
                include: {
                    condition: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    });
    if (!patient) return {success: false, message: 'Paciente no encontrado'};

    const allergyNames = new Set(
        patient.allergies.map(item => normalizeAllergenName(item.allergen.name))
    );
    const patientFoodDislikes: Array<{food: {name: string}}> =
        (
            patient as {
                foodDislikes?: Array<{food: {name: string}}>;
            }
        ).foodDislikes ?? [];
    const dislikedFoodNames = new Set<string>(
        patientFoodDislikes.map(item => normalizeAllergenName(item.food.name))
    );
    const restrictedFoodNames = new Set<string>([
        ...allergyNames,
        ...dislikedFoodNames
    ]);

    const recipesFromDb = await prisma.recipe.findMany({
        include: {
            ingredients: {
                include: {
                    ingredient: {
                        include: {
                            food: {
                                select: {
                                    name: true,
                                    caloriesPer100g: true,
                                    proteinPer100g: true,
                                    carbsPer100g: true,
                                    fatPer100g: true,
                                    isDiscrete: true,
                                    maxPortionGrams: true
                                }
                            }
                        }
                    }
                }
            },
            extraIngredients: true
        }
    });

    const allowedRecipes: RecipeSummary[] = recipesFromDb
        .filter(recipe => isRecipeAllowed(recipe, restrictedFoodNames))
        .map(recipe => {
            const nutrition = computeRecipeNutrition(recipe);

            return {
                id: recipe.id,
                title: recipe.title,
                imageUrl: recipe.imageUrl,
                mealType: recipe.mealType,
                calories: nutrition.calories,
                protein: nutrition.protein,
                carbs: nutrition.carbs,
                fat: nutrition.fat,
                ingredients: recipe.ingredients.map(item => {
                    const recipeIngredient = item as {
                        id: string;
                        grams: number;
                        quantity?: number | null;
                        unit?: RecipeIngredientUnit | null;
                        ingredient: {name: string};
                    };

                    return {
                        id: recipeIngredient.id,
                        name: recipeIngredient.ingredient.name,
                        quantity: recipeIngredient.quantity ?? 1,
                        grams: recipeIngredient.grams,
                        unit: normalizeRecipeIngredientUnit(
                            recipeIngredient.unit
                        ),
                        caloriesPer100g:
                            item.ingredient.food?.caloriesPer100g ?? 0,
                        proteinPer100g:
                            item.ingredient.food?.proteinPer100g ?? 0,
                        carbsPer100g: item.ingredient.food?.carbsPer100g ?? 0,
                        fatPer100g: item.ingredient.food?.fatPer100g ?? 0,
                        isDiscrete: item.ingredient.food?.isDiscrete ?? false,
                        maxPortionGrams:
                            item.ingredient.food?.maxPortionGrams ?? null
                    };
                })
            };
        })
        .filter(recipe => recipe.calories > 0 || recipe.mealType === 'DRINKS');

    const catalog = buildMealCatalog(allowedRecipes);

    const activeMealOrder = getActiveMealKeys(input.mealDistribution);

    const mealsWithoutOptions = activeMealOrder.filter(
        meal => catalog[meal].length === 0
    );

    if (mealsWithoutOptions.length > 0) {
        console.warn('[protocol.generate] Faltan recetas por tipo de comida', {
            mealsWithoutOptions
        });
        return {
            success: false,
            message:
                'No hay recetas disponibles para: ' +
                mealsWithoutOptions.join(', ')
        };
    }

    const split = buildMealCalorieSplit(
        activeMealOrder,
        input.mealDistribution
    );

    const dailyCalories = input.planCalories;

    const weekPlan: DayMeals[] = [];

    for (const [dayIndex, day] of DAYS.entries()) {
        const dayMeals: Partial<DayMeals> & {day: string} = {day};

        for (const mealKey of activeMealOrder) {
            const key = mealKey.toLowerCase() as keyof Omit<DayMeals, 'day'>;
            const recipesForMeal = catalog[key];
            const recipe =
                recipesForMeal[dayIndex % recipesForMeal.length] ||
                recipesForMeal[0];
            const macroMealTarget = getMacroMealTarget(
                input.macroMealDistribution,
                mealKey
            );
            const targetCalories =
                macroMealTarget?.totalKcal ?? dailyCalories * split[mealKey];

            const slotResult = buildMeal(
                recipe,
                round2(targetCalories),
                macroMealTarget
            );

            dayMeals[key] = slotResult;
        }

        weekPlan.push(dayMeals as DayMeals);
    }
    return {
        success: true,
        data: {
            weekPlan
        }
    };
}
