export type IngredientQuantityOptions = {
    /** Food marked as discrete (eggs, bread slices). */
    isDiscrete?: boolean;
    /**
     * For pieza (pz): allow 1/4, 1/3, 1/2, 2/3, 3/4 (e.g. medio aguacate).
     * Tablespoons (cda) stay whole regardless.
     */
    allowFractions?: boolean;
};

/** Kitchen measures patients can actually scoop: no sixths or eighths. */
const PATIENT_VOLUME_FRACTIONS: ReadonlyArray<{num: number; den: number}> = [
    {num: 1, den: 4},
    {num: 1, den: 3},
    {num: 1, den: 2},
    {num: 2, den: 3},
    {num: 3, den: 4}
];

/**
 * 5/6 (0.83) and 7/8 snap up to the next whole number (1 5/6 cdita → 2).
 * 3/4 stays 3/4.
 */
const ROUND_UP_FRACTION_TO_WHOLE = 0.8;

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

    if (fractional >= ROUND_UP_FRACTION_TO_WHOLE) {
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
    return snapToNearestFraction(quantity, PATIENT_VOLUME_FRACTIONS);
}

function usesWholeCountUnit(
    unit?: string | null,
    options?: IngredientQuantityOptions
): boolean {
    const normalized = normalizeIngredientUnit(unit);
    if (normalized === 'TBSP') {
        return true;
    }
    return normalized === 'PIECE' && options?.allowFractions !== true;
}

function snapToWholeQuantity(quantity: number): number {
    if (!Number.isFinite(quantity) || quantity <= 0) {
        return 0;
    }

    const rounded = Math.round(quantity);
    return rounded === 0 ? 1 : rounded;
}

function snapFriendlyGrams(quantity: number): number {
    const abs = Math.abs(quantity);
    if (abs < 20) {
        return Math.round(quantity);
    }
    if (abs < 50) {
        return Math.round(quantity / 5) * 5;
    }
    return Math.round(quantity / 10) * 10;
}

/**
 * Snaps a quantity to easy-to-read measures for meal planner display.
 * Calories stay on the stored targetGrams; this only affects what users see.
 */
export function snapFriendlyQuantityForUnit(
    quantity: number,
    unit?: string | null,
    options?: IngredientQuantityOptions
): number {
    if (!Number.isFinite(quantity)) {
        return 0;
    }

    if (usesWholeCountUnit(unit, options)) {
        return snapToWholeQuantity(quantity);
    }

    const normalized = normalizeIngredientUnit(unit);

    switch (normalized) {
        case 'CUP':
        case 'TSP':
        case 'OZ':
            return snapToCookingFraction(quantity);
        case 'GRAM':
        case 'ML':
            return snapFriendlyGrams(quantity);
        default:
            return snapFriendlyGrams(quantity);
    }
}

/**
 * Snaps a quantity to realistic kitchen measures before display or storage.
 */
export function snapQuantityForUnit(
    quantity: number,
    unit?: string | null,
    options?: IngredientQuantityOptions
): number {
    if (!Number.isFinite(quantity)) {
        return 0;
    }

    if (usesWholeCountUnit(unit, options)) {
        return snapToWholeQuantity(quantity);
    }

    const normalized = normalizeIngredientUnit(unit);

    switch (normalized) {
        case 'PIECE':
        case 'CUP':
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

function formatSnappedQuantityAsFraction(value: number): string {
    const snapped = snapToNearestFraction(value, PATIENT_VOLUME_FRACTIONS);
    if (!Number.isFinite(snapped) || snapped < 0) {
        return '0';
    }

    if (snapped < 0.001) {
        return '0';
    }

    const whole = Math.floor(snapped + 1e-9);
    const fractional = snapped - whole;

    if (fractional < 0.001) {
        return String(whole);
    }

    for (const {num, den} of PATIENT_VOLUME_FRACTIONS) {
        if (Math.abs(fractional - num / den) < 0.02) {
            const simplified = simplifyFraction(num, den);
            const fractionLabel = `${simplified.num}/${simplified.den}`;
            return whole > 0 ? `${whole} ${fractionLabel}` : fractionLabel;
        }
    }

    return String(Math.round(snapped));
}

/**
 * Formats a quantity using easy kitchen steps (1/4, 1/3, 1/2, 2/3, 3/4, or whole).
 */
export function formatIngredientQuantity(
    quantity: number,
    unit?: string | null,
    options?: IngredientQuantityOptions
): string {
    const snapped = snapQuantityForUnit(quantity, unit, options);
    return formatSnappedQuantityAsFraction(snapped);
}

/**
 * Formats a quantity with coarse, user-friendly rounding for meal planner cards.
 */
export function formatFriendlyIngredientQuantity(
    quantity: number,
    unit?: string | null,
    options?: IngredientQuantityOptions
): string {
    const snapped = snapFriendlyQuantityForUnit(quantity, unit, options);
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

/** Piece count snapped to the nearest whole number (1.5 → 2, 2.25 → 2). */
export function roundPieceQuantity(quantity: number): number {
    return snapToWholeQuantity(quantity);
}

/**
 * Scales a quantity while snapping to kitchen measures.
 * Piece (pz) and tablespoon (cda) counts always round to the nearest whole
 * number (2 1/4 pz → 2, 2 7/8 cda → 3).
 */
export function scaleIngredientQuantity(
    quantity: number,
    scale: number,
    unit?: string | null,
    options?: IngredientQuantityOptions
): number {
    if (!Number.isFinite(quantity) || !Number.isFinite(scale)) {
        return 0;
    }

    const scaled = Math.round(quantity * scale * 1000) / 1000;
    return snapQuantityForUnit(scaled, unit, options);
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
 * Piece (pz) fields accept cooking fractions when `allowFractions` is true
 * (1/2 pz → 1/2). Tablespoon (cda) counts always round to whole (2 7/8 cda → 3).
 */
export function formatIngredientQuantityInput(
    input: string | number | null | undefined,
    unit?: string | null,
    options?: IngredientQuantityOptions
): string {
    const parsed = parseIngredientQuantity(input);
    if (parsed == null || parsed <= 0) {
        return typeof input === 'string' ? input : '';
    }

    return formatIngredientQuantity(parsed, unit, {
        ...options,
        allowFractions: options?.allowFractions ?? true
    });
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
    density?: number | null,
    gramsPerPiece?: number | null
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
            return typeof gramsPerPiece === 'number' && gramsPerPiece > 0
                ? gramsPerPiece
                : 100;
        default:
            return 1;
    }
}

/**
 * Resolves grams per unit for nutrition math.
 * Volume units (taza, cda, cdita, ml) always use density × ml.
 * Missing density is water (1 g/ml), so 1 cda = 15 g, not leftover recipe grams.
 * For PIECE, catalog gramsPerPiece is the grocery size of 1 pieza.
 */
export function resolveReferenceGramsPerUnit(
    unit?: string | null,
    grams?: number | null,
    density?: number | null,
    gramsPerPiece?: number | null
): number {
    const normalizedUnit = normalizeIngredientUnit(unit);

    if (isVolumeIngredientUnit(normalizedUnit)) {
        return gramsPerIngredientUnit(normalizedUnit, density);
    }

    if (
        normalizedUnit === 'PIECE' &&
        typeof gramsPerPiece === 'number' &&
        gramsPerPiece > 0
    ) {
        return gramsPerPiece;
    }

    if (typeof grams === 'number' && grams > 0) {
        return grams;
    }

    return gramsPerIngredientUnit(normalizedUnit, density, gramsPerPiece);
}

/**
 * Converts recipe ingredient quantity/unit/grams into effective gram weight
 * for nutrition math. Volume units use density × ml; PIECE uses gramsPerPiece.
 */
export function resolveIngredientNutritionGrams(
    quantity: number | null | undefined,
    unit: string | null | undefined,
    grams: number | null | undefined,
    density?: number | null,
    gramsPerPiece?: number | null
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
        density,
        gramsPerPiece
    );

    return referenceGramsPerUnit * qty;
}
