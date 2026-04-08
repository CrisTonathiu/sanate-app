'use server';

import {MealType} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {GenerateProtocolPlanInput} from '@/lib/validations/protocol-generation.schema';

// --------------------
// Types
// --------------------

type MealKey =
    | 'smoothie'
    | 'breakfast'
    | 'snack1'
    | 'snack2'
    | 'lunch'
    | 'dinner'
    | 'drinks';

const DAYS = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
] as const;

// --------------------
// Helpers
// --------------------

function round1(value: number) {
    return Number(value.toFixed(1));
}

function normalizeUnit(unit?: string | null) {
    return (unit ?? 'GRAM').toUpperCase();
}

function getActiveMealKeys(
    mealDistribution?: Record<string, number>
): MealKey[] {
    if (!mealDistribution) return ['breakfast', 'lunch', 'dinner'];

    return Object.entries(mealDistribution)
        .filter(([, v]) => v > 0)
        .map(([k]) => k as MealKey);
}

function buildMealCalorieSplit(
    mealKeys: MealKey[],
    distribution?: Record<string, number>
) {
    const split: Record<string, number> = {};

    if (distribution) {
        for (const key of mealKeys) {
            split[key] = (distribution[key] ?? 0) / 100;
        }
        return split;
    }

    const equal = 1 / mealKeys.length;
    for (const key of mealKeys) {
        split[key] = equal;
    }

    return split;
}

// --------------------
// Realism validation
// --------------------

function isRealisticMeal(ingredients: any[], scale: number) {
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

function computeRecipeNutrition(recipe: any) {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const item of recipe.ingredients) {
        const grams = item.grams;
        const ratio = grams / 100;
        const food = item.ingredient.food;

        if (!food) continue;

        protein += (food.proteinPer100g ?? 0) * ratio;
        carbs += (food.carbsPer100g ?? 0) * ratio;
        fat += (food.fatPer100g ?? 0) * ratio;

        calories += food.caloriesPer100g
            ? food.caloriesPer100g * ratio
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

function buildMeal(recipe: any, targetCalories: number) {
    const scale = Number((targetCalories / recipe.calories).toFixed(2));

    if (!isRealisticMeal(recipe.ingredients, scale)) {
        return {
            isValid: false,
            error: 'Receta no realista. Agregar otro alimento para cumplir macros.'
        };
    }

    return {
        isValid: true,
        recipeId: recipe.id,
        recipeName: recipe.title,
        imageUrl: recipe.imageUrl || 'https://via.placeholder.com/150',
        calories: Math.round(recipe.calories * scale),
        protein: round1(recipe.protein * scale),
        carbs: round1(recipe.carbs * scale),
        fat: round1(recipe.fat * scale),
        ingredients: recipe.ingredients.map((item: any) => ({
            name: item.name,
            quantity:
                item.unit === 'PIECE'
                    ? Math.max(1, Math.round(item.quantity * scale))
                    : round1(item.quantity * scale),
            grams: round1(item.grams * scale),
            unit: normalizeUnit(item.unit)
        }))
    };
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
    const patient = await prisma.patient.findUnique({where: {id: patientId}});
    if (!patient) return {success: false, message: 'Paciente no encontrado'};

    const recipesFromDb = await prisma.recipe.findMany({
        include: {
            ingredients: {
                include: {
                    ingredient: {
                        include: {
                            food: true
                        }
                    }
                }
            }
        }
    });

    const recipes = recipesFromDb.map(r => ({
        ...r,
        ...computeRecipeNutrition(r)
    }));

    const mealKeys = getActiveMealKeys(input.mealDistribution);
    const split = buildMealCalorieSplit(mealKeys, input.mealDistribution);

    const dailyCalories = input.planCalories;

    const weekPlan = DAYS.map((day, dayIndex) => {
        const meals: Record<string, any> = {};

        for (const mealKey of mealKeys) {
            const recipe = recipes[dayIndex % recipes.length];
            const targetCalories = dailyCalories * split[mealKey];

            const meal = buildMeal(recipe, targetCalories);

            if (!meal.isValid) {
                return {
                    success: false,
                    message: `${day} - ${mealKey}: ${meal.error}`
                };
            }

            meals[mealKey] = meal;
        }

        return {
            day,
            meals
        };
    });

    console.log('Generated week plan:', JSON.stringify(weekPlan, null, 2));

    return {
        success: true,
        data: weekPlan
    };
}
