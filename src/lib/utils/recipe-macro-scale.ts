import {
    resolveIngredientNutritionGrams,
    scaleIngredientQuantity,
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

type DominantMacro = 'protein' | 'carbs' | 'fat' | 'balanced';

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

function getDominantMacro(item: ScalableIngredient): DominantMacro {
    const proteinKcal = (item.proteinPer100g ?? 0) * 4;
    const carbsKcal = (item.carbsPer100g ?? 0) * 4;
    const fatKcal = (item.fatPer100g ?? 0) * 9;
    const total = proteinKcal + carbsKcal + fatKcal;

    if (total <= 0) {
        return 'balanced';
    }

    const max = Math.max(proteinKcal, carbsKcal, fatKcal);
    if (proteinKcal === max && proteinKcal / total >= 0.45) {
        return 'protein';
    }
    if (carbsKcal === max && carbsKcal / total >= 0.45) {
        return 'carbs';
    }
    if (fatKcal === max && fatKcal / total >= 0.45) {
        return 'fat';
    }

    return 'balanced';
}

/**
 * Compute per-ingredient scales so the recipe approaches fixed meal macro
 * targets (same breakfast/lunch/... targets every day). Falls back to a
 * uniform calorie scale when no macro targets are provided.
 */
export function computeIngredientScalesForMacros(
    ingredients: ScalableIngredient[],
    recipeCalories: number,
    targetCalories: number,
    gramTargets: MacroGramTargets | null
): number[] {
    const count = ingredients.length;
    if (count === 0) {
        return [];
    }

    const calorieScale =
        recipeCalories > 0 ? targetCalories / recipeCalories : 1;

    if (!gramTargets) {
        return ingredients.map(() => round4(calorieScale));
    }

    const bases = ingredients.map(item => {
        const grams = resolveIngredientNutritionGrams(
            item.quantity,
            item.unit,
            item.grams,
            item.density
        );
        const ratio = grams / 100;

        return {
            protein: (item.proteinPer100g ?? 0) * ratio,
            carbs: (item.carbsPer100g ?? 0) * ratio,
            fat: (item.fatPer100g ?? 0) * ratio,
            dominant: getDominantMacro(item)
        };
    });

    const scales = bases.map(() => calorieScale);

    const refine = (macro: 'protein' | 'carbs' | 'fat') => {
        const target = gramTargets[macro];
        const dominantIdx = bases
            .map((base, index) => (base.dominant === macro ? index : -1))
            .filter(index => index >= 0);

        const contributorIdx =
            dominantIdx.length > 0
                ? dominantIdx
                : bases
                      .map((base, index) => (base[macro] > 0.05 ? index : -1))
                      .filter(index => index >= 0);

        if (contributorIdx.length === 0) {
            return;
        }

        const total = bases.reduce(
            (sum, base, index) => sum + base[macro] * scales[index],
            0
        );
        const groupTotal = contributorIdx.reduce(
            (sum, index) => sum + bases[index][macro] * scales[index],
            0
        );

        if (groupTotal <= 0) {
            return;
        }

        const others = total - groupTotal;
        const neededFromGroup = Math.max(target - others, 0);
        const factor = Math.min(Math.max(neededFromGroup / groupTotal, 0.15), 6);

        for (const index of contributorIdx) {
            scales[index] *= factor;
        }
    };

    for (let pass = 0; pass < 3; pass++) {
        refine('protein');
        refine('carbs');
        refine('fat');
    }

    const minScale = Math.max(calorieScale * 0.2, 0.05);
    const maxScale = Math.max(calorieScale * 5, 1);

    return scales.map(scale =>
        round4(Math.min(Math.max(scale, minScale), maxScale))
    );
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
