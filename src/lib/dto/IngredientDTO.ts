export interface IngredientDTO {
    id: string;
    name: string;
    quantity?: number;
    grams?: number;
    unit?: string;
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
    grams: number;
    ingredient: IngredientDTO;
}

export interface CreateRecipeIngredientDTO {
    recipeId: string;
    ingredientId: string;
    grams: number;
}

export interface UpdateRecipeIngredientDTO {
    recipeId: string;
    ingredientId: string;
    grams?: number;
}
