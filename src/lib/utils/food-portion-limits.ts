import {normalizeIngredientUnit, resolveIngredientNutritionGrams} from '@/lib/utils/ingredient-quantity';

export type PortionLimitUnit =
    | 'GRAM'
    | 'PIECE'
    | 'CUP'
    | 'TBSP'
    | 'TSP'
    | 'ML'
    | 'OZ';

export type FoodPortionLimitSource = {
    isDiscrete?: boolean | null;
    isFreePortion?: boolean | null;
    foodGroupName?: string | null;
    density?: number | null;
    gramsPerPiece?: number | null;
    minPortionQuantity?: number | null;
    minPortionUnit?: string | null;
    maxPortionQuantity?: number | null;
    maxPortionUnit?: string | null;
    maxPortionGrams?: number | null;
};

export type FoodPortionGrams = {
    minGrams: number | null;
    maxGrams: number | null;
};

export function portionQuantityToGrams(
    quantity: number | null | undefined,
    unit: string | null | undefined,
    food?: {
        density?: number | null;
        gramsPerPiece?: number | null;
    }
): number | null {
    if (quantity == null || !Number.isFinite(quantity) || quantity <= 0) {
        return null;
    }

    const grams = resolveIngredientNutritionGrams(
        quantity,
        unit ?? 'GRAM',
        null,
        food?.density,
        food?.gramsPerPiece
    );

    return grams > 0 ? grams : null;
}

function groupDefaultLimits(food: FoodPortionLimitSource): {
    minQuantity?: number;
    minUnit?: PortionLimitUnit;
    maxQuantity?: number;
    maxUnit?: PortionLimitUnit;
} {
    const group = (food.foodGroupName ?? '').trim().toUpperCase();
    if (food.isFreePortion || group === 'VEGETALES') {
        return {};
    }

    if (group === 'GRASAS') {
        if (food.isDiscrete) {
            return {
                minQuantity: 0.5,
                minUnit: 'PIECE',
                maxQuantity: 0.5,
                maxUnit: 'PIECE'
            };
        }
        return {maxQuantity: 1, maxUnit: 'TBSP'};
    }

    if (group === 'PROTEINAS') {
        if (food.isDiscrete) {
            return {minQuantity: 1, minUnit: 'PIECE', maxQuantity: 3, maxUnit: 'PIECE'};
        }
        return {minQuantity: 100, minUnit: 'GRAM', maxQuantity: 180, maxUnit: 'GRAM'};
    }

    if (
        group === 'CEREALES' ||
        group === 'CARBOHIDRATOS' ||
        group === 'TUBERCULOS'
    ) {
        return {maxQuantity: 1, maxUnit: 'CUP'};
    }

    if (group === 'FRUTAS' || group === 'FRUTOS ROJOS') {
        if (food.isDiscrete) {
            return {maxQuantity: 2, maxUnit: 'PIECE'};
        }
        return {maxQuantity: 1, maxUnit: 'CUP'};
    }

    if (group === 'FRUTOS SECOS' || group === 'SEMILLAS') {
        return {maxQuantity: 2, maxUnit: 'TBSP'};
    }

    if (group === 'LACTEOS' || group === 'LEGUMINOSAS') {
        return {maxQuantity: 1, maxUnit: 'CUP'};
    }

    return {};
}

function gramsFromExplicit(
    quantity: number | null | undefined,
    unit: string | null | undefined,
    food: FoodPortionLimitSource
): number | null {
    return portionQuantityToGrams(quantity, unit, food);
}

/**
 * Kitchen min/max in grams. Catalog quantity+unit wins; otherwise group defaults.
 * Legacy `maxPortionGrams` is used when no max quantity is set.
 */
export function resolveFoodPortionGrams(
    food: FoodPortionLimitSource
): FoodPortionGrams {
    const defaults = groupDefaultLimits(food);
    const minGrams =
        gramsFromExplicit(
            food.minPortionQuantity,
            food.minPortionUnit,
            food
        ) ??
        gramsFromExplicit(defaults.minQuantity, defaults.minUnit, food);

    const maxGrams =
        gramsFromExplicit(
            food.maxPortionQuantity,
            food.maxPortionUnit,
            food
        ) ??
        (food.maxPortionGrams != null && food.maxPortionGrams > 0
            ? food.maxPortionGrams
            : null) ??
        gramsFromExplicit(defaults.maxQuantity, defaults.maxUnit, food);

    if (minGrams != null && maxGrams != null && minGrams > maxGrams) {
        return {minGrams: maxGrams, maxGrams};
    }

    return {minGrams, maxGrams};
}

export function resolveFoodPortionGramsFromCatalog(
    food?: {
        isDiscrete?: boolean | null;
        isFreePortion?: boolean | null;
        density?: number | null;
        gramsPerPiece?: number | null;
        minPortionQuantity?: number | null;
        minPortionUnit?: string | null;
        maxPortionQuantity?: number | null;
        maxPortionUnit?: string | null;
        maxPortionGrams?: number | null;
        group?: {name?: string | null} | null;
    } | null
): FoodPortionGrams {
    if (!food) {
        return {minGrams: null, maxGrams: null};
    }

    return resolveFoodPortionGrams({
        isDiscrete: food.isDiscrete ?? false,
        isFreePortion: food.isFreePortion ?? false,
        foodGroupName: food.group?.name ?? null,
        density: food.density ?? null,
        gramsPerPiece: food.gramsPerPiece ?? null,
        minPortionQuantity: food.minPortionQuantity ?? null,
        minPortionUnit: food.minPortionUnit ?? null,
        maxPortionQuantity: food.maxPortionQuantity ?? null,
        maxPortionUnit: food.maxPortionUnit ?? null,
        maxPortionGrams: food.maxPortionGrams ?? null
    });
}

export function normalizePortionLimitUnit(
    unit?: string | null
): PortionLimitUnit {
    const normalized = normalizeIngredientUnit(unit);
    if (
        normalized === 'PIECE' ||
        normalized === 'CUP' ||
        normalized === 'TBSP' ||
        normalized === 'TSP' ||
        normalized === 'ML' ||
        normalized === 'OZ'
    ) {
        return normalized;
    }
    return 'GRAM';
}
