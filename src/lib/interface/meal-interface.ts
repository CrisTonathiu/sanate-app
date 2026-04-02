export interface MealIngredientPortion {
    ingredientName: string;
    baseQuantity?: number;
    targetQuantity?: number;
    baseGrams: number;
    targetGrams: number;
    unit?: string;
}

export interface MealSlot {
    id: string;
    recipeName: string;
    description?: string;
    imageUrl?: string;
    calories: number;
    protein: number;
    carbs?: number;
    fat?: number;
    portionMultiplier?: number;
    ingredientPortions?: MealIngredientPortion[];
}

export interface Recipe {
    id: string;
    title: string;
    imageUrl?: string;
    mealType:
        | 'smoothie'
        | 'breakfast'
        | 'snack'
        | 'lunch'
        | 'dinner'
        | 'drinks'
        | 'any';
    calories: number;
    protein: number;
}

export interface DayMeals {
    day: string;
    smoothie: MealSlot;
    breakfast: MealSlot;
    snack1: MealSlot;
    snack2: MealSlot;
    lunch: MealSlot;
    dinner: MealSlot;
    drinks: MealSlot;
}
