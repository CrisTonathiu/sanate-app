import {
    normalizeIngredientUnit,
    resolveIngredientNutritionGrams,
    scaleIngredientQuantity,
    snapQuantityForUnit,
    targetGramsForPieceQuantity,
    usesUnitBasedGramScaling
} from '@/lib/utils/ingredient-quantity';

export type MacroKcalTarget = {
    totalKcal: number;
    proteinKcal: number;
    carbsKcal: number;
    fatKcal: number;
};

export type MacroGramTargets = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
};

export type ScalableIngredient = {
    quantity: number;
    grams: number;
    unit?: string | null;
    caloriesPer100g?: number | null;
    proteinPer100g?: number | null;
    carbsPer100g?: number | null;
    fatPer100g?: number | null;
    isDiscrete?: boolean | null;
    density?: number | null;
};

function round4(value: number) {
    return Number(value.toFixed(4));
}

export function macroKcalToGrams(target: MacroKcalTarget): MacroGramTargets {
    return {
        calories: target.totalKcal,
        protein: target.proteinKcal / 4,
        carbs: target.carbsKcal / 4,
        fat: target.fatKcal / 9
    };
}

/**
 * Uniform calorie scale so every meal of the same type hits the same kcal
 * target (e.g. all breakfasts = 25% of plan calories).
 */
export function computeIngredientScalesForMacros(
    ingredients: ScalableIngredient[],
    recipeCalories: number,
    targetCalories: number,
    _gramTargets?: MacroGramTargets | null
): number[] {
    const count = ingredients.length;
    if (count === 0) {
        return [];
    }

    const calorieScale =
        recipeCalories > 0 ? targetCalories / recipeCalories : 1;

    return ingredients.map(() => round4(calorieScale));
}

export function scaleIngredientByFactor(
    item: ScalableIngredient,
    scale: number
) {
    const unit = item.unit ?? 'GRAM';
    const baseNutritionGrams = resolveIngredientNutritionGrams(
        item.quantity,
        unit,
        item.grams,
        item.density
    );
    const isDiscrete = item.isDiscrete ?? false;
    const targetQuantity = scaleIngredientQuantity(
        item.quantity,
        scale,
        unit,
        {isDiscrete}
    );
    const targetGrams = usesUnitBasedGramScaling(unit)
        ? targetGramsForPieceQuantity(
              baseNutritionGrams,
              item.quantity,
              targetQuantity
          )
        : Math.round(baseNutritionGrams * scale);

    return {
        baseNutritionGrams,
        targetQuantity,
        targetGrams,
        unit,
        isDiscrete
    };
}

export type CalorieScaledPortion = {
    targetGrams: number;
    targetQuantity?: number;
    unit?: string | null;
    isDiscrete?: boolean | null;
    baseCalories?: number | null;
    baseProtein?: number | null;
    baseCarbs?: number | null;
    baseFat?: number | null;
};

/**
 * After kitchen-unit snapping, nudge all portions so total calories match the
 * planned meal target exactly (same breakfast kcal every day, etc.).
 */
export function correctPortionsToTargetCalories<T extends CalorieScaledPortion>(
    portions: T[],
    targetCalories: number
): T[] {
    if (portions.length === 0 || targetCalories <= 0) {
        return portions;
    }

    const currentCalories = portions.reduce((sum, portion) => {
        const ratio = portion.targetGrams / 100;
        return sum + (portion.baseCalories ?? 0) * ratio;
    }, 0);

    if (currentCalories <= 0) {
        return portions;
    }

    const factor = targetCalories / currentCalories;
    if (Math.abs(factor - 1) < 0.005) {
        return portions;
    }

    return portions.map(portion => {
        const unit = portion.unit ?? 'GRAM';

        // Generated piece counts stay whole; grams already match that count.
        // Nudging grams here would reintroduce fractions like 2 1/4 pz.
        if (normalizeIngredientUnit(unit) === 'PIECE') {
            return portion;
        }

        const nextGrams = Math.max(1, Math.round(portion.targetGrams * factor));

        if (!usesUnitBasedGramScaling(unit)) {
            return {
                ...portion,
                targetGrams: nextGrams,
                targetQuantity: nextGrams
            };
        }

        const baseQuantity =
            typeof portion.targetQuantity === 'number' &&
            portion.targetQuantity > 0
                ? portion.targetQuantity
                : 1;
        const gramsPerUnit =
            portion.targetGrams > 0
                ? portion.targetGrams / baseQuantity
                : nextGrams;
        const rawQuantity =
            gramsPerUnit > 0 ? nextGrams / gramsPerUnit : baseQuantity * factor;
        const targetQuantity = snapQuantityForUnit(rawQuantity, unit, {
            isDiscrete: portion.isDiscrete ?? false
        });

        return {
            ...portion,
            targetQuantity:
                targetQuantity > 0 ? targetQuantity : baseQuantity * factor,
            targetGrams: nextGrams
        };
    });
}
