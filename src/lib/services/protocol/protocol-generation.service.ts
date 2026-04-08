'use server';

import {MealType} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {
    GenerateProtocolPlanInput,
    ProtocolGoal
} from '@/lib/validations/protocol-generation.schema';
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
        ingredients: Array<{ingredient: {name: string}}>;
        extraIngredients: Array<{name: string}>;
    },
    patientAllergies: Set<string>
) {
    console.log('Paciente tiene alergias:', Array.from(patientAllergies));
    if (patientAllergies.size === 0) return true;

    const ingredientNames = recipe.ingredients.map(item =>
        normalizeAllergenName(item.ingredient.name)
    );
    const extraIngredientNames = recipe.extraIngredients.map(item =>
        normalizeAllergenName(item.name)
    );

    for (const allergy of patientAllergies) {
        if (
            ingredientNames.some(
                name => name.includes(allergy) || allergy.includes(name)
            ) ||
            extraIngredientNames.some(
                name => name.includes(allergy) || allergy.includes(name)
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
function isRealisticMeal(ingredients: any[], scale: number): boolean {
    for (const item of ingredients) {
        const scaledGrams = item.grams * scale;

        if (item.maxPortionGrams && scaledGrams > item.maxPortionGrams) {
            return false;
        }

        if (item.unit === 'PIECE') {
            const scaledQty = item.quantity * scale;
            if (scaledQty > 3) return false;
        }
    }

    return true;
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

function buildMeal(
    recipe: RecipeSummary,
    targetCalories: number
): {isValid: false; error: string} | {isValid: true; slot: MealSlot} {
    const scale = Number((targetCalories / recipe.calories).toFixed(2));

    console.log(
        `Construyendo comida: ${recipe.title}, targetCalories: ${targetCalories}, scale: ${scale}`
    );
    if (!isRealisticMeal(recipe.ingredients, scale)) {
        return {
            isValid: false,
            error: `Receta ${recipe.title} no realista. Agregar otro alimento para cumplir macros.`
        };
    }

    const slot: MealSlot = {
        id: recipe.id,
        recipeName: recipe.title,
        imageUrl: recipe.imageUrl ?? undefined,
        calories: Math.round(recipe.calories * scale),
        protein: round1(recipe.protein * scale),
        carbs: round1(recipe.carbs * scale),
        fat: round1(recipe.fat * scale),
        portionMultiplier: scale,
        ingredientPortions: recipe.ingredients.map(item => ({
            ingredientName: item.name,
            baseQuantity: item.quantity,
            targetQuantity:
                item.unit === 'PIECE'
                    ? Math.max(1, Math.round(item.quantity * scale))
                    : Math.round(item.quantity * scale),
            baseGrams: item.grams,
            targetGrams: Math.round(item.grams * scale),
            unit: normalizeRecipeIngredientUnit(item.unit)
        }))
    };

    return {isValid: true, slot};
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

    const recipesFromDb = await prisma.recipe.findMany({
        include: {
            ingredients: {
                include: {
                    ingredient: {
                        include: {
                            food: {
                                select: {
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
        .filter(recipe => isRecipeAllowed(recipe, allergyNames))
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
                        grams: number;
                        quantity?: number | null;
                        unit?: RecipeIngredientUnit | null;
                        ingredient: {name: string};
                    };

                    return {
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
            const targetCalories = dailyCalories * split[mealKey];

            const result = buildMeal(recipe, targetCalories);

            if (!result.isValid) {
                return {
                    success: false,
                    message: `${day} - ${mealKey}: ${result.error}`
                };
            }

            dayMeals[key] = result.slot;
        }

        weekPlan.push(dayMeals as DayMeals);
    }

    console.log('Generated week plan:', JSON.stringify(weekPlan, null, 2));

    return {
        success: true,
        data: {
            weekPlan
        }
    };
}
