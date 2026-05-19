import type {MealType} from '@prisma/client';
import {calculateRecipeNutrition, type RecipeIngredientForNutrition} from './calculate-recipe-nutrition';

/**
 * Shape aligned with MealSlider / RecipeModal (name, image, time, calories,
 * ingredients, instructions, mealType for slider badges). Portal maps protocol
 * meals to this type and passes it into MealSlider as `recipes`.
 */
export type MealSliderRecipe = {
    id: string;
    name: string;
    image: string;
    time: string;
    calories: number;
    ingredients: {
        name: string;
        amount: string;
        unit: string;
        equivalents?: string[];
    }[];
    instructions: string[];
    mealType: 'breakfast' | 'lunch' | 'dinner';
};

/** Same order as `MEAL_TYPE_BY_KEY` in protocols API when creating meals. */
export const PROTOCOL_MEAL_DISPLAY_ORDER: MealType[] = [
    'SMOOTHIE',
    'BREAKFAST',
    'SNACK1',
    'SNACK2',
    'LUNCH',
    'DINNER',
    'DRINKS'
];

const DEFAULT_SLIDER_IMAGE =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';

const INGREDIENT_UNIT_LABEL: Record<string, string> = {
    GRAM: 'g',
    PIECE: 'pz',
    CUP: 'taza',
    TBSP: 'cda',
    TSP: 'cdta',
    ML: 'ml',
    OZ: 'oz'
};

function mealTypeOrderIndex(mealType: MealType) {
    const i = PROTOCOL_MEAL_DISPLAY_ORDER.indexOf(mealType);
    return i === -1 ? PROTOCOL_MEAL_DISPLAY_ORDER.length : i;
}

export function sortProtocolMealsByPlanOrder<T extends {mealType: MealType}>(
    meals: T[]
): T[] {
    return [...meals].sort(
        (a, b) => mealTypeOrderIndex(a.mealType) - mealTypeOrderIndex(b.mealType)
    );
}

/**
 * MealSlider only has breakfast / lunch / dinner badges; map protocol slots
 * into those three for display parity with the slider UI.
 */
export function mapMealTypeToSliderMealType(
    mealType: MealType
): MealSliderRecipe['mealType'] {
    switch (mealType) {
        case 'SMOOTHIE':
        case 'BREAKFAST':
            return 'breakfast';
        case 'SNACK':
        case 'SNACK1':
        case 'LUNCH':
            return 'lunch';
        case 'SNACK2':
        case 'DINNER':
        case 'DRINKS':
            return 'dinner';
    }
}

function formatIngredientAmount(
    grams: number,
    quantity: number | null | undefined,
    unit: string | null | undefined
): {amount: string; unit: string} {
    const u = (unit ?? 'GRAM').toString().toUpperCase();
    if (u === 'GRAM') {
        const g = grams || 0;
        const rounded = Math.abs(g - Math.round(g)) < 0.05 ? Math.round(g) : g;
        return {
            amount: Number.isInteger(rounded)
                ? String(rounded)
                : rounded.toFixed(1),
            unit: INGREDIENT_UNIT_LABEL.GRAM
        };
    }
    const q = quantity ?? 1;
    const amount =
        Math.abs(q - Math.round(q)) < 0.001 ? String(Math.round(q)) : String(q);
    return {
        amount,
        unit: INGREDIENT_UNIT_LABEL[u] ?? u.toLowerCase()
    };
}

type ProtocolRecipeForSlider = {
    id: string;
    title: string;
    imageUrl: string | null;
    ingredients: Array<{
        grams: number;
        quantity: number | null;
        unit: string;
        ingredient: {name: string; food: RecipeIngredientForNutrition['ingredient']['food']};
    }>;
    extraIngredients: Array<{name: string}>;
    steps: Array<{stepNumber: number; instruction: string}>;
};

type ProtocolMealForSlider = {
    id: string;
    mealType: MealType;
    recipe: ProtocolRecipeForSlider | null;
};

export function mapProtocolMealToSliderRecipe(
    meal: ProtocolMealForSlider,
    mealTimeLabel: string
): MealSliderRecipe | null {
    const recipe = meal.recipe;
    if (!recipe) return null;

    const nutrition = calculateRecipeNutrition(
        recipe.ingredients as RecipeIngredientForNutrition[]
    );

    const ingredients: MealSliderRecipe['ingredients'] =
        recipe.ingredients.map(row => {
            const {amount, unit} = formatIngredientAmount(
                row.grams,
                row.quantity,
                row.unit
            );
            return {
                name: row.ingredient.name,
                amount,
                unit
            };
        });

    for (const extra of recipe.extraIngredients) {
        ingredients.push({
            name: extra.name,
            amount: '1',
            unit: 'porción'
        });
    }

    const instructions = [...recipe.steps]
        .sort((a, b) => a.stepNumber - b.stepNumber)
        .map(s => s.instruction.trim())
        .filter(Boolean);

    return {
        id: meal.id,
        name: recipe.title.trim() || 'Receta',
        image: recipe.imageUrl?.trim() || DEFAULT_SLIDER_IMAGE,
        time: mealTimeLabel,
        calories: Math.round(nutrition.calories),
        ingredients,
        instructions,
        mealType: mapMealTypeToSliderMealType(meal.mealType)
    };
}

export function mapProtocolDayMealsToSliderRecipes(
    meals: ProtocolMealForSlider[],
    mealTimeByType: Record<string, string>
): MealSliderRecipe[] {
    const withRecipe = meals.filter(
        (m): m is ProtocolMealForSlider & {recipe: ProtocolRecipeForSlider} =>
            m.recipe !== null
    );
    const sorted = sortProtocolMealsByPlanOrder(withRecipe);

    return sorted
        .map(m =>
            mapProtocolMealToSliderRecipe(
                m,
                mealTimeByType[m.mealType] ?? 'Cualquier hora'
            )
        )
        .filter((r): r is MealSliderRecipe => Boolean(r));
}

/**
 * Protocol weeks use Monday=0 .. Sunday=6 (see protocol POST `dayIndex`).
 * Logs server-side warnings for inconsistent data.
 */
export function validateProtocolWeekDays(
    days: Array<{dayIndex: number; id: string}>
) {
    const seen = new Set<number>();
    for (const day of days) {
        if (day.dayIndex < 0 || day.dayIndex > 6) {
            console.warn('[portal] Protocol dayIndex out of range 0-6', {
                dayId: day.id,
                dayIndex: day.dayIndex
            });
        }
        if (seen.has(day.dayIndex)) {
            console.warn('[portal] Duplicate protocol dayIndex in week', {
                dayIndex: day.dayIndex
            });
        }
        seen.add(day.dayIndex);
    }
}
