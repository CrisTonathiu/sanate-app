export interface MealSlot {
    id: string;
    recipeName: string;
    description?: string;
    imageUrl?: string;
    calories: number;
    protein: number;
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
    snack: MealSlot;
    lunch: MealSlot;
    dinner: MealSlot;
    drinks: MealSlot;
}
