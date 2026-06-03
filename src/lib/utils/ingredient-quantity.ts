/** Fractions that fit a standard measuring cup (smallest mark is 1/8). */
const COOKING_CUP_FRACTIONS: ReadonlyArray<{num: number; den: number}> = [
    {num: 1, den: 8},
    {num: 1, den: 6},
    {num: 1, den: 4},
    {num: 1, den: 3},
    {num: 3, den: 8},
    {num: 1, den: 2},
    {num: 5, den: 8},
    {num: 2, den: 3},
    {num: 3, den: 4},
    {num: 5, den: 6},
    {num: 7, den: 8}
];

export function normalizeIngredientUnit(unit?: string | null): string {
    const normalized = unit?.toString().trim().toUpperCase();

    switch (normalized) {
        case 'PIECE':
        case 'CUP':
        case 'TBSP':
        case 'TSP':
        case 'ML':
        case 'OZ':
            return normalized;
        default:
            return 'GRAM';
    }
}

function gcd(a: number, b: number): number {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));
    while (y !== 0) {
        const temp = y;
        y = x % y;
        x = temp;
    }
    return x || 1;
}

function simplifyFraction(num: number, den: number) {
    const divisor = gcd(num, den);
    return {num: num / divisor, den: den / divisor};
}

/**
 * Snaps a quantity to realistic kitchen measures before display or storage.
 */
export function snapQuantityForUnit(
    quantity: number,
    unit?: string | null
): number {
    if (!Number.isFinite(quantity)) {
        return 0;
    }

    const normalized = normalizeIngredientUnit(unit);

    switch (normalized) {
        case 'PIECE':
            return Math.round(quantity);
        case 'CUP':
            return Math.round(quantity * 8) / 8;
        case 'TBSP':
        case 'TSP':
            return Math.round(quantity * 4) / 4;
        case 'GRAM':
        case 'ML':
            return Math.round(quantity);
        case 'OZ':
            return Math.round(quantity * 4) / 4;
        default:
            return Math.round(quantity);
    }
}

function formatSnappedQuantityAsFraction(value: number): string {
    if (!Number.isFinite(value) || value < 0) {
        return '0';
    }

    const rounded = Math.round(value * 1000) / 1000;

    if (rounded < 0.001) {
        return '0';
    }

    let whole = Math.floor(rounded + 1e-9);
    let fractional = rounded - whole;

    if (fractional < 0.001) {
        return String(whole);
    }

    if (fractional > 1 - 0.001) {
        return String(whole + 1);
    }

    let bestNum = 1;
    let bestDen = 8;
    let bestError = Infinity;

    for (const {num, den} of COOKING_CUP_FRACTIONS) {
        const decimal = num / den;
        const error = Math.abs(fractional - decimal);
        if (error < bestError) {
            bestError = error;
            bestNum = num;
            bestDen = den;
        }
    }

    const {num, den} = simplifyFraction(bestNum, bestDen);
    const fractionLabel = `${num}/${den}`;

    if (whole > 0) {
        return `${whole} ${fractionLabel}`;
    }

    return fractionLabel;
}

/**
 * Formats a quantity using kitchen-realistic steps (no decimals, no odd fractions).
 */
export function formatIngredientQuantity(
    quantity: number,
    unit?: string | null
): string {
    const snapped = snapQuantityForUnit(quantity, unit);
    return formatSnappedQuantityAsFraction(snapped);
}

/** Units whose scaled count should drive targetGrams (not linear calorie scale). */
export function usesUnitBasedGramScaling(unit?: string | null): boolean {
    const normalized = normalizeIngredientUnit(unit);
    return (
        normalized === 'PIECE' ||
        normalized === 'CUP' ||
        normalized === 'TBSP' ||
        normalized === 'TSP'
    );
}

/**
 * Parses user input such as "1/3", "1 1/2", "0.33", or "0,33".
 */
export function parseIngredientQuantity(
    input: string | number | null | undefined
): number | null {
    if (typeof input === 'number') {
        return Number.isFinite(input) ? input : null;
    }

    if (input == null) {
        return null;
    }

    const normalized = input.trim().replace(',', '.');
    if (!normalized) {
        return null;
    }

    const mixedMatch = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
        const whole = Number(mixedMatch[1]);
        const num = Number(mixedMatch[2]);
        const den = Number(mixedMatch[3]);
        if (den > 0) {
            return whole + num / den;
        }
    }

    const fractionMatch = normalized.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
        const num = Number(fractionMatch[1]);
        const den = Number(fractionMatch[2]);
        if (den > 0) {
            return num / den;
        }
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

/** Whole-piece count (pz): 3.35 → 3, 5.75 → 6. */
export function roundPieceQuantity(quantity: number): number {
    if (!Number.isFinite(quantity)) {
        return 0;
    }

    return Math.round(quantity);
}

/**
 * Scales a quantity while preserving fractional precision.
 * For PIECE (pz), rounds to the nearest whole number after scaling.
 */
export function scaleIngredientQuantity(
    quantity: number,
    scale: number,
    unit?: string | null
): number {
    if (!Number.isFinite(quantity) || !Number.isFinite(scale)) {
        return 0;
    }

    const scaled = Math.round(quantity * scale * 1000) / 1000;
    return snapQuantityForUnit(scaled, unit);
}

/** Gram weight for a scaled piece count, using the recipe's base portion. */
export function targetGramsForPieceQuantity(
    baseNutritionGrams: number,
    baseQuantity: number,
    targetPieceCount: number
): number {
    const baseQty = baseQuantity > 0 ? baseQuantity : 1;
    const gramsPerUnit = baseNutritionGrams / baseQty;
    return Math.round(gramsPerUnit * targetPieceCount);
}

/**
 * Returns a user-friendly quantity string for ingredient inputs on blur.
 */
export function formatIngredientQuantityInput(
    input: string | number | null | undefined,
    unit?: string | null
): string {
    const parsed = parseIngredientQuantity(input);
    if (parsed == null || parsed <= 0) {
        return typeof input === 'string' ? input : '';
    }

    return formatIngredientQuantity(parsed, unit);
}

/** Gram weight of one measure (e.g. 1 ml ≈ 1 g, 1 tbsp ≈ 15 g). */
export function gramsPerIngredientUnit(unit?: string | null): number {
    switch (normalizeIngredientUnit(unit)) {
        case 'ML':
            return 1;
        case 'OZ':
            return 28.3495;
        case 'TSP':
            return 5;
        case 'TBSP':
            return 15;
        case 'CUP':
            return 240;
        case 'PIECE':
            return 100;
        default:
            return 1;
    }
}

/**
 * Converts recipe ingredient quantity/unit/grams into effective gram weight
 * for nutrition math. Non-gram units treat `grams` as the weight of 1 unit.
 */
export function resolveIngredientNutritionGrams(
    quantity: number | null | undefined,
    unit: string | null | undefined,
    grams: number | null | undefined
): number {
    const normalizedUnit = normalizeIngredientUnit(unit);
    const fallbackQuantity =
        normalizedUnit === 'GRAM'
            ? typeof grams === 'number' && grams > 0
                ? grams
                : 100
            : 1;
    const qty =
        typeof quantity === 'number' && quantity > 0
            ? quantity
            : fallbackQuantity;

    if (normalizedUnit === 'GRAM') {
        return typeof grams === 'number' && grams > 0 ? grams : qty;
    }

    const referenceGramsPerUnit =
        typeof grams === 'number' && grams > 0
            ? grams
            : gramsPerIngredientUnit(normalizedUnit);

    return referenceGramsPerUnit * qty;
}
