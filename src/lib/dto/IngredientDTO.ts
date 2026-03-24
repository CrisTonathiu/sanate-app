export interface IngredientDTO {
    id: string;
    foodId?: string;
    name: string;
    quantity?: number;
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
