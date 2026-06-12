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

/** Fractional piece counts allowed in recipes and protocol scaling. */
const PIECE_FRACTIONS: ReadonlyArray<{num: number; den: number}> = [
    {num: 1, den: 4},
    {num: 1, den: 3},
    {num: 1, den: 2}
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

function snapToNearestFraction(
    quantity: number,
    allowedFractions: ReadonlyArray<{num: number; den: number}>
): number {
    if (!Number.isFinite(quantity)) {
        return 0;
    }

    const rounded = Math.round(quantity * 1000) / 1000;

    if (rounded < 0.001) {
        return 0;
    }

    const whole = Math.floor(rounded + 1e-9);
    const fractional = rounded - whole;

    if (fractional < 0.001) {
        return whole;
    }

    if (fractional > 1 - 0.001) {
        return whole + 1;
    }

    let bestNum = allowedFractions[0]?.num ?? 1;
    let bestDen = allowedFractions[0]?.den ?? 2;
    let bestError = Infinity;

    for (const {num, den} of allowedFractions) {
        const decimal = num / den;
        const error = Math.abs(fractional - decimal);
        if (error < bestError) {
            bestError = error;
            bestNum = num;
            bestDen = den;
        }
    }

    return whole + bestNum / bestDen;
}

function snapToCookingFraction(quantity: number): number {
    return snapToNearestFraction(quantity, COOKING_CUP_FRACTIONS);
}

function snapToPieceFraction(quantity: number): number {
    return snapToNearestFraction(quantity, PIECE_FRACTIONS);
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
            return snapToPieceFraction(quantity);
        case 'CUP':
        case 'TBSP':
        case 'TSP':
        case 'OZ':
            return snapToCookingFraction(quantity);
        case 'GRAM':
        case 'ML':
            if (quantity > 0 && quantity < 1) {
                return snapToCookingFraction(quantity);
            }
            return Math.round(quantity);
        default:
            return Math.round(quantity);
    }
}

function formatSnappedQuantityAsFraction(
    value: number,
    allowedFractions: ReadonlyArray<{num: number; den: number}> = COOKING_CUP_FRACTIONS
): string {
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

    let bestNum = allowedFractions[0]?.num ?? 1;
    let bestDen = allowedFractions[0]?.den ?? 2;
    let bestError = Infinity;

    for (const {num, den} of allowedFractions) {
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
    const normalized = normalizeIngredientUnit(unit);
    const snapped = snapQuantityForUnit(quantity, unit);
    const allowedFractions =
        normalized === 'PIECE' ? PIECE_FRACTIONS : COOKING_CUP_FRACTIONS;
    return formatSnappedQuantityAsFraction(snapped, allowedFractions);
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

/** Piece count snapped to 1/4, 1/3, or 1/2 when fractional. */
export function roundPieceQuantity(quantity: number): number {
    return snapToPieceFraction(quantity);
}

/**
 * Scales a quantity while preserving fractional precision.
 * For PIECE (pz), snaps to the nearest 1/4, 1/3, or 1/2 after scaling.
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

/** Metric cooking cup size used for volume conversions. */
export const CUP_VOLUME_ML = 240;

/** Default density (g/ml) when a food has no density on file. Water. */
export const DEFAULT_FOOD_DENSITY = 1;

/** ml volume represented by one measure (null = weight/count unit). */
export function volumeMlPerIngredientUnit(
    unit?: string | null
): number | null {
    switch (normalizeIngredientUnit(unit)) {
        case 'ML':
            return 1;
        case 'TSP':
            return 5;
        case 'TBSP':
            return 15;
        case 'CUP':
            return CUP_VOLUME_ML;
        default:
            return null;
    }
}

export function isVolumeIngredientUnit(unit?: string | null): boolean {
    return volumeMlPerIngredientUnit(unit) != null;
}

/**
 * Gram weight of one measure.
 * Volume units (ml, taza, cda, cdta) use density (g/ml); defaults to water when omitted.
 */
export function gramsPerIngredientUnit(
    unit?: string | null,
    density?: number | null
): number {
    const volumeMl = volumeMlPerIngredientUnit(unit);
    if (volumeMl != null) {
        const effectiveDensity =
            typeof density === 'number' && density > 0
                ? density
                : DEFAULT_FOOD_DENSITY;
        return volumeMl * effectiveDensity;
    }

    switch (normalizeIngredientUnit(unit)) {
        case 'OZ':
            return 28.3495;
        case 'PIECE':
            return 100;
        default:
            return 1;
    }
}

/**
 * Resolves grams per unit for nutrition math.
 * When food.density is set, volume units prefer density over stored recipe grams.
 */
export function resolveReferenceGramsPerUnit(
    unit?: string | null,
    grams?: number | null,
    density?: number | null
): number {
    const normalizedUnit = normalizeIngredientUnit(unit);

    if (
        isVolumeIngredientUnit(normalizedUnit) &&
        typeof density === 'number' &&
        density > 0
    ) {
        return gramsPerIngredientUnit(normalizedUnit, density);
    }

    if (typeof grams === 'number' && grams > 0) {
        return grams;
    }

    return gramsPerIngredientUnit(normalizedUnit);
}

/**
 * Converts recipe ingredient quantity/unit/grams into effective gram weight
 * for nutrition math. Non-gram units treat `grams` as the weight of 1 unit.
 */
export function resolveIngredientNutritionGrams(
    quantity: number | null | undefined,
    unit: string | null | undefined,
    grams: number | null | undefined,
    density?: number | null
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

    const referenceGramsPerUnit = resolveReferenceGramsPerUnit(
        normalizedUnit,
        grams,
        density
    );

    return referenceGramsPerUnit * qty;
}
