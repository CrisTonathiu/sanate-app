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
    description: string;
    mealType: 'breakfast' | 'snack' | 'lunch' | 'dinner' | 'any';
    calories: number;
    protein: number;
}

export interface DayMeals {
    day: string;
    breakfast: MealSlot;
    snack: MealSlot;
    lunch: MealSlot;
    dinner: MealSlot;
}
