import {formatEquivalentHint} from '@/lib/patient-portal/equivalencias';
import {
    formatIngredientQuantity,
    snapFriendlyQuantityForUnit,
    snapQuantityForUnit
} from '@/lib/utils/ingredient-quantity';

/**
 * Catalog food that can take part in a portal swap. Built server-side with
 * free foods and foods without calories already removed.
 */
export type SwapCatalogFood = {
    id: string;
    name: string;
    /** Equivalencias PDF column; swaps stay inside one column. */
    columnKey: string;
    caloriesPer100g: number;
    isDiscrete: boolean;
    allowPieceFractions: boolean;
    gramsPerPiece: number | null;
    gramsPerEquivalent: number | null;
    equivalentDisplayText: string | null;
    /** Patient dislikes the food (or an ingredient group containing it). */
    disliked: boolean;
};

/** Links a meal ingredient row back to its catalog food. */
export type IngredientSwapSource = {
    foodId: string;
    /** Grams the plan assigns for this ingredient (drives calories). */
    grams: number;
};

export type IngredientSwapOption = {
    foodId: string;
    name: string;
    amount: string;
    unit: string;
    /** SMAE household measure, e.g. "1/2 taza". */
    hint: string | null;
    grams: number;
    calories: number;
    /** Replacement calories minus original calories. */
    calorieDelta: number;
};

/**
 * Options too far from the original after rounding to a buyable amount
 * (e.g. 1 whole tortilla for a 20 kcal portion) are hidden.
 */
const MAX_CALORIE_DELTA_RATIO = 0.5;
const MIN_CALORIE_DELTA_TOLERANCE = 30;

function snapReplacementAmount(
    food: SwapCatalogFood,
    targetGrams: number
): {amount: string; unit: string; grams: number} | null {
    if (food.isDiscrete && food.gramsPerPiece && food.gramsPerPiece > 0) {
        const options = {
            isDiscrete: true,
            allowFractions: food.allowPieceFractions
        };
        const pieces = snapQuantityForUnit(
            targetGrams / food.gramsPerPiece,
            'PIECE',
            options
        );
        if (!(pieces > 0)) {
            return null;
        }

        return {
            amount: formatIngredientQuantity(pieces, 'PIECE', options),
            unit: 'pz',
            grams: pieces * food.gramsPerPiece
        };
    }

    const grams = snapFriendlyQuantityForUnit(targetGrams, 'GRAM');
    if (!(grams > 0)) {
        return null;
    }

    return {amount: String(grams), unit: 'g', grams};
}

export function buildIngredientSwapOptions(
    source: IngredientSwapSource,
    catalog: SwapCatalogFood[],
    /** Foods already in the meal; never offered as replacements. */
    mealFoodIds: ReadonlySet<string>
): IngredientSwapOption[] {
    const sourceFood = catalog.find(food => food.id === source.foodId);
    if (!sourceFood || !(source.grams > 0)) {
        return [];
    }

    const sourceCalories = (sourceFood.caloriesPer100g * source.grams) / 100;
    if (!(sourceCalories > 0)) {
        return [];
    }

    const tolerance = Math.max(
        MIN_CALORIE_DELTA_TOLERANCE,
        sourceCalories * MAX_CALORIE_DELTA_RATIO
    );

    return catalog
        .filter(
            food =>
                food.columnKey === sourceFood.columnKey &&
                !food.disliked &&
                !mealFoodIds.has(food.id)
        )
        .flatMap(food => {
            const targetGrams = (sourceCalories / food.caloriesPer100g) * 100;
            const snapped = snapReplacementAmount(food, targetGrams);
            if (!snapped) {
                return [];
            }

            const calories = (food.caloriesPer100g * snapped.grams) / 100;
            const calorieDelta = Math.round(calories - sourceCalories) || 0;
            if (Math.abs(calorieDelta) > tolerance) {
                return [];
            }

            return [
                {
                    foodId: food.id,
                    name: food.name,
                    amount: snapped.amount,
                    unit: snapped.unit,
                    hint:
                        snapped.unit === 'pz'
                            ? null
                            : formatEquivalentHint(food, snapped.grams),
                    grams: snapped.grams,
                    calories: Math.round(calories),
                    calorieDelta
                }
            ];
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
