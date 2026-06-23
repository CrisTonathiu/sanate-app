import {resolveIngredientNutritionGrams} from '@/lib/utils/ingredient-quantity';

export type NutritionFood = {
    caloriesPer100g?: number | null;
    proteinPer100g?: number | null;
    carbsPer100g?: number | null;
    fatPer100g?: number | null;
    density?: number | null;
};

export type RecipeIngredientForNutrition = {
    grams?: number | null;
    quantity?: number | null;
    unit?: string | null;
    ingredient?: {
        food?: NutritionFood | null;
    } | null;
};

export function calculateRecipeNutrition(
    ingredients: RecipeIngredientForNutrition[]
) {
    return ingredients.reduce(
        (acc, item) => {
            const food = item.ingredient?.food;
            if (!food) return acc;

            const factor =
                resolveIngredientNutritionGrams(
                    item.quantity,
                    item.unit,
                    item.grams,
                    food.density
                ) / 100;

            acc.calories += (food.caloriesPer100g || 0) * factor;
            acc.protein += (food.proteinPer100g || 0) * factor;
            acc.carbs += (food.carbsPer100g || 0) * factor;
            acc.fat += (food.fatPer100g || 0) * factor;

            return acc;
        },
        {calories: 0, protein: 0, carbs: 0, fat: 0}
    );
}
