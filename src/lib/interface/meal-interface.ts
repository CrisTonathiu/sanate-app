export interface MealIngredientPortion {
    ingredientId?: string;
    ingredientName: string;
    baseQuantity?: number;
    targetQuantity?: number;
    baseGrams: number;
    targetGrams: number;
    unit?: string;
    /** From Food.isDiscrete. Manual piece edits may still be fractional. */
    isDiscrete?: boolean;
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
    /** Recipe preparation steps; editable in protocol preview and shown on the PDF. */
    instructions?: string[];
    /** Name-only extras (salt, herbs, etc.). Shown on menus/PDF; ignored by macros. */
    extraIngredients?: string[];
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
    time: string;
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
