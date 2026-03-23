export interface RecipeDTO {
    id: string;
    title: string;
    mealType:
        | 'SMOOTHIE'
        | 'BREAKFAST'
        | 'SNACK'
        | 'LUNCH'
        | 'DINNER'
        | 'DRINKS'
        | 'ANY';
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    prepTime: number;
    imageUrl?: string | null;
}
