export interface MealIngredientPortion {
    ingredientId?: string;
    ingredientName: string;
    baseQuantity?: number;
    targetQuantity?: number;
    baseGrams: number;
    targetGrams: number;
    unit?: string;
    baseCalories?: number;
    baseProtein?: number;
    baseCarbs?: number;
    baseFat?: number;
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
    isRealistic?: boolean;
    warnings?: string[];
    ingredientPortions?: MealIngredientPortion[];
}

export interface Recipe {
    id: string;
    title: string;
    imageUrl?: string;
    mealType:
        | 'smoothie'
        | 'breakfast'
        | 'snack1'
        | 'snack2'
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
