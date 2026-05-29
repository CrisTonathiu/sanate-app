import {MealIngredientPortion, MealSlot} from '@/lib/interface/meal-interface';
import {IngredientUnit, Prisma} from '@prisma/client';

export function normalizeIngredientUnit(unit?: string | null): IngredientUnit {
    const normalized = unit?.toString().trim().toUpperCase();

    switch (normalized) {
        case 'PIECE':
            return 'PIECE';
        case 'CUP':
            return 'CUP';
        case 'TBSP':
            return 'TBSP';
        case 'TSP':
            return 'TSP';
        case 'ML':
            return 'ML';
        case 'OZ':
            return 'OZ';
        default:
            return 'GRAM';
    }
}

function mapPortionToDbIngredient(portion: MealIngredientPortion) {
    return {
        ingredientName: portion.ingredientName,
        unit: normalizeIngredientUnit(portion.unit),
        baseQuantity:
            portion.baseQuantity ??
            portion.targetQuantity ??
            portion.targetGrams,
        targetQuantity: portion.targetQuantity ?? portion.targetGrams,
        baseGrams: portion.baseGrams,
        targetGrams: portion.targetGrams
    };
}

export function buildProtocolMealPortionsCreateData(
    meal: Pick<
        MealSlot,
        'calories' | 'protein' | 'carbs' | 'fat' | 'ingredientPortions'
    >
): Prisma.ProtocolMealPortionsCreateWithoutProtocolMealInput | undefined {
    if (meal.ingredientPortions === undefined) {
        return undefined;
    }

    const ingredientRows = meal.ingredientPortions
        .filter(portion => portion.ingredientName.trim().length > 0)
        .map(mapPortionToDbIngredient);

    const calories = meal.calories ?? 0;
    const protein = meal.protein ?? 0;
    const carbs = meal.carbs ?? 0;
    const fat = meal.fat ?? 0;

    return {
        targetCalories: calories,
        targetProtein: protein,
        targetCarbs: carbs,
        targetFat: fat,
        actualCalories: calories,
        actualProtein: protein,
        actualCarbs: carbs,
        actualFat: fat,
        ingredients: {
            create: ingredientRows
        }
    };
}

export function mapDbIngredientsToMealPortions(
    ingredients: Array<{
        ingredientName: string;
        unit: IngredientUnit;
        baseQuantity: number;
        targetQuantity: number;
        baseGrams: number;
        targetGrams: number;
    }>
): MealIngredientPortion[] {
    return ingredients.map(row => ({
        ingredientName: row.ingredientName,
        baseQuantity: row.baseQuantity,
        targetQuantity: row.targetQuantity,
        baseGrams: row.baseGrams,
        targetGrams: row.targetGrams,
        unit: row.unit
    }));
}

export function mapRecipeRowsToMealPortions(
    ingredients: Array<{
        grams: number;
        quantity: number | null;
        unit: string | null;
        ingredient: {
            name: string;
            food: {
                caloriesPer100g: number | null;
                proteinPer100g: number | null;
                carbsPer100g: number | null;
                fatPer100g: number | null;
            } | null;
        };
    }>
): MealIngredientPortion[] {
    return ingredients.map(item => {
        const grams = item.grams ?? 0;
        const unit = normalizeIngredientUnit(item.unit);
        const quantity =
            item.quantity ?? (unit === 'PIECE' ? 1 : grams);
        const food = item.ingredient.food;

        return {
            ingredientName: item.ingredient.name,
            baseQuantity: quantity,
            targetQuantity: quantity,
            baseGrams: grams,
            targetGrams: grams,
            unit,
            baseCalories: food?.caloriesPer100g ?? undefined,
            baseProtein: food?.proteinPer100g ?? undefined,
            baseCarbs: food?.carbsPer100g ?? undefined,
            baseFat: food?.fatPer100g ?? undefined
        };
    });
}

function computeMealTotals(portions: MealIngredientPortion[]) {
    return portions.reduce(
        (sum, portion) => {
            const ratio = portion.targetGrams / 100;

            return {
                calories:
                    sum.calories + (portion.baseCalories ?? 0) * ratio,
                protein: sum.protein + (portion.baseProtein ?? 0) * ratio,
                carbs: sum.carbs + (portion.baseCarbs ?? 0) * ratio,
                fat: sum.fat + (portion.baseFat ?? 0) * ratio
            };
        },
        {calories: 0, protein: 0, carbs: 0, fat: 0}
    );
}

export type StoredProtocolMealPortions = {
    actualCalories: number;
    actualProtein: number;
    actualCarbs: number;
    actualFat: number;
    ingredients: Array<{
        ingredientName: string;
        unit: IngredientUnit;
        baseQuantity: number;
        targetQuantity: number;
        baseGrams: number;
        targetGrams: number;
    }>;
};

function round1(value: number) {
    return Number(value.toFixed(1));
}

export function buildMealSlotFromProtocolMeal(meal: {
    recipeId: string | null;
    recipe: {
        id: string;
        title: string;
        imageUrl: string | null;
        ingredients: Array<{
            grams: number;
            quantity: number | null;
            unit: string | null;
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
    } | null;
    portions: StoredProtocolMealPortions | null;
}): MealSlot | null {
    const recipe = meal.recipe;
    if (!recipe || !meal.recipeId) {
        return null;
    }

    if (meal.portions) {
        return {
            id: recipe.id,
            recipeName: recipe.title,
            imageUrl: recipe.imageUrl ?? undefined,
            calories: Math.round(meal.portions.actualCalories),
            protein: round1(meal.portions.actualProtein),
            carbs: round1(meal.portions.actualCarbs),
            fat: round1(meal.portions.actualFat),
            ingredientPortions: mapDbIngredientsToMealPortions(
                meal.portions.ingredients
            )
        };
    }

    const ingredientPortions = mapRecipeRowsToMealPortions(recipe.ingredients);
    const totals = computeMealTotals(ingredientPortions);

    return {
        id: recipe.id,
        recipeName: recipe.title,
        imageUrl: recipe.imageUrl ?? undefined,
        calories: Math.round(totals.calories),
        protein: round1(totals.protein),
        carbs: round1(totals.carbs),
        fat: round1(totals.fat),
        ingredientPortions
    };
}

const INGREDIENT_UNIT_LABEL: Record<IngredientUnit, string> = {
    GRAM: 'g',
    PIECE: 'pz',
    CUP: 'taza',
    TBSP: 'cda',
    TSP: 'cdta',
    ML: 'ml',
    OZ: 'oz'
};

export function mapStoredPortionsToSliderIngredients(
    portions: StoredProtocolMealPortions
) {
    return portions.ingredients.map(row => {
        const unit = INGREDIENT_UNIT_LABEL[row.unit] ?? row.unit.toLowerCase();

        if (row.unit === 'GRAM') {
            const grams = row.targetGrams || 0;
            const rounded =
                Math.abs(grams - Math.round(grams)) < 0.05
                    ? Math.round(grams)
                    : grams;

            return {
                name: row.ingredientName,
                amount: Number.isInteger(rounded)
                    ? String(rounded)
                    : rounded.toFixed(1),
                unit
            };
        }

        const quantity = row.targetQuantity ?? 1;
        const amount =
            Math.abs(quantity - Math.round(quantity)) < 0.001
                ? String(Math.round(quantity))
                : String(quantity);

        return {
            name: row.ingredientName,
            amount,
            unit
        };
    });
}
