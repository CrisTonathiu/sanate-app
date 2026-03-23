export interface Step {
    id: string;
    instruction: string;
}

export interface NutritionData {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

interface SelectedIngredient {
    foodId: string;
    grams?: number;
}

interface SelectedExtraIngredient {
    name: string;
}

interface SelectedStep {
    instruction: string;
}

// Recipe data structure for initial data / form submission
export interface RecipeFormData {
    id?: string;
    title: string;
    mealType: string;
    imageUrl?: string | null;
    ingredients: SelectedIngredient[];
    extraIngredients: SelectedExtraIngredient[];
    steps: SelectedStep[];
}
