import type {FoodSwapCategory} from '@prisma/client';
import {
    equivalentsForFood,
    formatEquivalentsMeasure,
    roundEquivalents
} from '@/lib/patient-portal/equivalencias';
import {
    formatIngredientQuantity,
    snapFriendlyQuantityForUnit,
    snapQuantityForUnit
} from '@/lib/utils/ingredient-quantity';

export type DominantMacro = 'PROTEIN' | 'CARBS' | 'FAT';

/**
 * Catalog food that can take part in a portal swap. Built server-side with
 * free foods and foods without calories already removed.
 */
export type SwapCatalogFood = {
    id: string;
    name: string;
    /** Equivalencias PDF column; only foods with a column can be swapped. */
    columnKey: string;
    /** FoodGroup name, upper-cased. Fallback when there is no category. */
    groupName: string;
    /** Family of interchangeable foods (pan ↔ pan). */
    swapCategory: FoodSwapCategory | null;
    /** Macro that gives most of the calories; null without macro data. */
    dominantMacro: DominantMacro | null;
    caloriesPer100g: number;
    isDiscrete: boolean;
    allowPieceFractions: boolean;
    gramsPerPiece: number | null;
    gramsPerEquivalent: number | null;
    equivalentDisplayText: string | null;
    /** Largest portion allowed for this food, in grams. */
    maxPortionGrams: number | null;
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
 * (e.g. 1 whole tortilla for a 20 kcal portion) are hidden. This also hides
 * foods whose calorie data is clearly wrong.
 */
const MAX_CALORIE_DELTA_RATIO = 0.5;
const MIN_CALORIE_DELTA_TOLERANCE = 30;
const MAX_SWAP_OPTIONS = 8;

export function dominantMacroFromPer100g(food: {
    proteinPer100g: number | null;
    carbsPer100g: number | null;
    fatPer100g: number | null;
}): DominantMacro | null {
    const kcal: Array<[DominantMacro, number]> = [
        ['PROTEIN', (food.proteinPer100g ?? 0) * 4],
        ['CARBS', (food.carbsPer100g ?? 0) * 4],
        ['FAT', (food.fatPer100g ?? 0) * 9]
    ];
    const total = kcal.reduce((sum, [, value]) => sum + value, 0);
    if (!(total > 0)) {
        return null;
    }

    return kcal.reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0];
}

/**
 * A categorised food only swaps within its category. Without a category,
 * fall back to the same FoodGroup and require the same dominant macro, so a
 * misfiled food (edamame in CARBOHIDRATOS) is not offered for bread.
 */
function isSimilarFood(
    source: SwapCatalogFood,
    candidate: SwapCatalogFood
): boolean {
    if (source.swapCategory) {
        return candidate.swapCategory === source.swapCategory;
    }

    if (candidate.groupName !== source.groupName) {
        return false;
    }

    return (
        !source.dominantMacro ||
        !candidate.dominantMacro ||
        source.dominantMacro === candidate.dominantMacro
    );
}

function gramsPerEquivalentOf(food: SwapCatalogFood): number | null {
    return food.gramsPerEquivalent != null && food.gramsPerEquivalent > 0
        ? food.gramsPerEquivalent
        : null;
}

type ReplacementAmount = {
    amount: string;
    unit: string;
    grams: number;
    hint: string | null;
};

/**
 * Same number of SMAE equivalents as the original, rounded like the
 * equivalencias PDF (roundEquivalents), so each option is N times the food's
 * single-equivalent measure (3 eq pollo 90 g = 3 eq atún = 1 lata).
 */
function equivalentReplacement(
    sourceFood: SwapCatalogFood,
    sourceGrams: number,
    food: SwapCatalogFood
): ReplacementAmount | null {
    const sourceGpe = gramsPerEquivalentOf(sourceFood);
    const targetGpe = gramsPerEquivalentOf(food);
    if (!sourceGpe || !targetGpe) {
        return null;
    }

    const equivalents = equivalentsForFood(
        food,
        roundEquivalents(sourceGrams / sourceGpe)
    );
    const grams = Math.round(equivalents * targetGpe);

    return {
        amount: String(grams),
        unit: 'g',
        grams,
        hint: formatEquivalentsMeasure(food, equivalents)
    };
}

/** Calorie-matched amount for foods without SMAE equivalents. */
function calorieReplacement(
    food: SwapCatalogFood,
    sourceCalories: number
): ReplacementAmount | null {
    const targetGrams = (sourceCalories / food.caloriesPer100g) * 100;

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
            grams: pieces * food.gramsPerPiece,
            hint: null
        };
    }

    const grams = snapFriendlyQuantityForUnit(targetGrams, 'GRAM');
    if (!(grams > 0)) {
        return null;
    }

    return {amount: String(grams), unit: 'g', grams, hint: null};
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
                food.id !== sourceFood.id &&
                !food.disliked &&
                !mealFoodIds.has(food.id) &&
                isSimilarFood(sourceFood, food)
        )
        .flatMap(food => {
            const snapped =
                equivalentReplacement(sourceFood, source.grams, food) ??
                calorieReplacement(food, sourceCalories);
            if (!snapped) {
                return [];
            }
            if (
                food.maxPortionGrams != null &&
                food.maxPortionGrams > 0 &&
                snapped.grams > food.maxPortionGrams
            ) {
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
                    hint: snapped.hint,
                    grams: snapped.grams,
                    calories: Math.round(calories),
                    calorieDelta
                }
            ];
        })
        .sort(
            (a, b) =>
                Math.abs(a.calorieDelta) - Math.abs(b.calorieDelta) ||
                a.name.localeCompare(b.name, 'es')
        )
        .slice(0, MAX_SWAP_OPTIONS);
}
