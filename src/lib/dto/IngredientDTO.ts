export interface IngredientDTO {
    id: string;
    foodId?: string;
    name: string;
    quantity?: number;
    unit?: string;
    /** Gram weight per unit when unit is not grams (e.g. per tbsp, per piece). */
    gramsPerUnit?: number;
    /** Food density in g/ml; drives volume-unit conversions when set. */
    foodDensity?: number | null;
    caloriesPer100g: number;
    carbohydratesPer100g: number;
    proteinPer100g: number;
    fatPer100g: number;
}

export interface ExtraIngredientDTO {
    id: string;
    name: string;
}

export interface RecipeIngredientDTO {
    recipeId: string;
    ingredientId: string;
    ingredient: IngredientDTO;
}

export interface CreateRecipeIngredientDTO {
    recipeId: string;
    ingredientId: string;
}

export interface UpdateRecipeIngredientDTO {
    recipeId: string;
    ingredientId: string;
}
