import {
    gramsPerIngredientUnit,
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
    gramsPerPiece?: number | null;
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
        item.density,
        item.gramsPerPiece
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
    minGrams?: number | null;
    maxGrams?: number | null;
};

export type NamedCaloriePortion = CalorieScaledPortion & {
    ingredientName?: string;
};

type MacroKey = 'protein' | 'carbs' | 'fat';

const MACRO_LABEL: Record<MacroKey, string> = {
    protein: 'proteína',
    carbs: 'carbohidratos',
    fat: 'grasa'
};

const MIN_MACRO_GAP_KCAL = 20;
const MIN_PORTION_SCALE = 0.25;
const MAX_PORTION_SCALE = 4;
const MACRO_REBALANCE_PASSES = 5;

function portionMacroKcal(portion: CalorieScaledPortion, macro: MacroKey) {
    const ratio = portion.targetGrams / 100;
    if (macro === 'protein') {
        return (portion.baseProtein ?? 0) * ratio * 4;
    }
    if (macro === 'carbs') {
        return (portion.baseCarbs ?? 0) * ratio * 4;
    }
    return (portion.baseFat ?? 0) * ratio * 9;
}

function mealMacroTotals(portions: CalorieScaledPortion[]) {
    return portions.reduce(
        (sum, portion) => {
            const ratio = portion.targetGrams / 100;
            const protein = (portion.baseProtein ?? 0) * ratio;
            const carbs = (portion.baseCarbs ?? 0) * ratio;
            const fat = (portion.baseFat ?? 0) * ratio;
            return {
                calories:
                    sum.calories + (portion.baseCalories ?? 0) * ratio,
                protein: sum.protein + protein,
                carbs: sum.carbs + carbs,
                fat: sum.fat + fat,
                proteinKcal: sum.proteinKcal + protein * 4,
                carbsKcal: sum.carbsKcal + carbs * 4,
                fatKcal: sum.fatKcal + fat * 9
            };
        },
        {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            proteinKcal: 0,
            carbsKcal: 0,
            fatKcal: 0
        }
    );
}

function isPieceUnit(portion: CalorieScaledPortion) {
    return normalizeIngredientUnit(portion.unit) === 'PIECE';
}

function isWeightOrVolumeUnit(portion: CalorieScaledPortion) {
    const unit = normalizeIngredientUnit(portion.unit);
    return (
        unit === 'GRAM' ||
        unit === 'ML' ||
        unit === 'CUP' ||
        unit === 'TBSP' ||
        unit === 'TSP'
    );
}

function isAdjustablePortion(portion: CalorieScaledPortion) {
    return isWeightOrVolumeUnit(portion) || isPieceUnit(portion);
}

function pieceQuantity(portion: CalorieScaledPortion) {
    return portion.targetQuantity != null && portion.targetQuantity > 0
        ? portion.targetQuantity
        : 1;
}

function applyTargetGrams<T extends CalorieScaledPortion>(
    portion: T,
    grams: number
): T {
    const nextGrams = Math.max(1, Math.round(grams));
    const unit = normalizeIngredientUnit(portion.unit);
    if (unit === 'GRAM' || unit === 'ML') {
        return {...portion, targetGrams: nextGrams, targetQuantity: nextGrams};
    }
    if (unit === 'PIECE') {
        const qty = pieceQuantity(portion);
        const gramsEach =
            qty > 0 && portion.targetGrams > 0
                ? portion.targetGrams / qty
                : nextGrams;
        if (gramsEach <= 0) {
            return {...portion, targetGrams: nextGrams};
        }
        const rawQty = nextGrams / gramsEach;
        const maxPieces =
            portion.maxGrams != null && portion.maxGrams > 0
                ? portion.maxGrams / gramsEach
                : 6;
        const allowFractions = maxPieces < 0.95 || Math.abs(maxPieces - Math.round(maxPieces)) > 0.05;
        const snapped = snapQuantityForUnit(rawQty, 'PIECE', {allowFractions});
        const minPieces =
            portion.minGrams != null && gramsEach > 0
                ? portion.minGrams / gramsEach
                : allowFractions
                  ? 0.25
                  : 1;
        const nextQty = Math.min(maxPieces, Math.max(minPieces, snapped));
        return {
            ...portion,
            targetQuantity: nextQty,
            targetGrams: Math.max(1, Math.round(gramsEach * nextQty))
        };
    }
    return {...portion, targetGrams: nextGrams};
}

function clampPortionGrams(
    grams: number,
    originalGrams: number,
    portion?: CalorieScaledPortion
): number {
    const relativeFloor = Math.max(1, Math.round(originalGrams * MIN_PORTION_SCALE));
    const relativeCeiling = Math.max(
        originalGrams,
        Math.round(originalGrams * MAX_PORTION_SCALE)
    );
    const floor =
        portion?.minGrams != null && portion.minGrams > 0
            ? Math.max(1, Math.round(portion.minGrams))
            : relativeFloor;
    const ceiling =
        portion?.maxGrams != null && portion.maxGrams > 0
            ? Math.round(portion.maxGrams)
            : relativeCeiling;
    const hi = Math.max(floor, ceiling);
    return Math.min(hi, Math.max(floor, Math.round(grams)));
}

function pickMacroContributor<T extends CalorieScaledPortion>(
    portions: T[],
    macro: MacroKey,
    adjustableOnly: boolean,
    skip: ReadonlySet<T> = new Set()
): T | null {
    let best: T | null = null;
    let bestKcal = 0;
    for (const portion of portions) {
        if (skip.has(portion)) {
            continue;
        }
        if (adjustableOnly && !isAdjustablePortion(portion)) {
            continue;
        }
        const kcal = portionMacroKcal(portion, macro);
        if (kcal > bestKcal) {
            best = portion;
            bestKcal = kcal;
        }
    }
    return best;
}

function targetMacroKcal(target: MacroKcalTarget, macro: MacroKey) {
    if (macro === 'protein') return target.proteinKcal ?? 0;
    if (macro === 'carbs') return target.carbsKcal ?? 0;
    return target.fatKcal ?? 0;
}

function gramsFromMacroKcal(kcal: number, macro: MacroKey) {
    if (macro === 'fat') {
        return kcal / 9;
    }
    return kcal / 4;
}

function isMacroOff(
    actualKcal: number,
    targetKcal: number
) {
    const gap = Math.abs(actualKcal - targetKcal);
    if (targetKcal <= 0) {
        return actualKcal >= MIN_MACRO_GAP_KCAL;
    }
    return gap >= Math.max(MIN_MACRO_GAP_KCAL, targetKcal * 0.12);
}

function macroGramsPerFoodGram(portion: CalorieScaledPortion, macro: MacroKey) {
    if (macro === 'protein') {
        return (portion.baseProtein ?? 0) / 100;
    }
    if (macro === 'carbs') {
        return (portion.baseCarbs ?? 0) / 100;
    }
    return (portion.baseFat ?? 0) / 100;
}

function mealMacroGrams(
    totals: ReturnType<typeof mealMacroTotals>,
    macro: MacroKey
) {
    if (macro === 'protein') return totals.protein;
    if (macro === 'carbs') return totals.carbs;
    return totals.fat;
}

function scalePortionToCloseMacroGap<T extends CalorieScaledPortion>(
    portion: T,
    originalGrams: number,
    macro: MacroKey,
    gapGrams: number
): T {
    const concentration = macroGramsPerFoodGram(portion, macro);
    if (concentration <= 0.01) {
        return portion;
    }

    return applyTargetGrams(
        portion,
        clampPortionGrams(
            portion.targetGrams + gapGrams / concentration,
            originalGrams,
            portion
        )
    );
}

function shrinkRoomKcal(
    portion: CalorieScaledPortion,
    originalGrams: number
) {
    const kcalPerGram = (portion.baseCalories ?? 0) / 100;
    if (kcalPerGram <= 0) {
        return 0;
    }
    const floor =
        portion.minGrams != null && portion.minGrams > 0
            ? Math.max(1, Math.round(portion.minGrams))
            : Math.max(1, Math.round(originalGrams * MIN_PORTION_SCALE));
    return Math.max(0, (portion.targetGrams - floor) * kcalPerGram);
}

function pickCalorieTrimTarget<T extends CalorieScaledPortion>(
    portions: T[],
    skip: ReadonlySet<T>,
    originalGrams: number[]
): T | null {
    let best: T | null = null;
    let bestRoom = 0;
    for (const [index, portion] of portions.entries()) {
        if (skip.has(portion) || !isWeightOrVolumeUnit(portion)) {
            continue;
        }
        const room = shrinkRoomKcal(
            portion,
            originalGrams[index] ?? portion.targetGrams
        );
        if (room > bestRoom) {
            best = portion;
            bestRoom = room;
        }
    }
    return best;
}

function shiftPortionCalories<T extends CalorieScaledPortion>(
    portion: T,
    originalGrams: number,
    deltaKcal: number
): T {
    const kcalPerGram = (portion.baseCalories ?? 0) / 100;
    if (kcalPerGram <= 0) {
        return portion;
    }
    return applyTargetGrams(
        portion,
        clampPortionGrams(
            portion.targetGrams + deltaKcal / kcalPerGram,
            originalGrams,
            portion
        )
    );
}

/**
 * Moves portions toward the meal protein/carb/fat split (protein → fat cap →
 * carbs). Kitchen min/max grams keep garnish like ½ aguacate from growing.
 */
export function nudgePortionsTowardMacroTargets<T extends CalorieScaledPortion>(
    portions: T[],
    target?: MacroKcalTarget | null,
    originalGrams: number[] = portions.map(portion => portion.targetGrams)
): T[] {
    if (!target || portions.length === 0) {
        return portions;
    }

    const next = portions.map(portion => ({...portion}));
    const gramTargets = macroKcalToGrams(target);

    for (let pass = 0; pass < MACRO_REBALANCE_PASSES; pass++) {
        let changed = false;
        for (const macro of ['protein', 'fat', 'carbs'] as MacroKey[]) {
            const totals = mealMacroTotals(next);
            const currentGrams = mealMacroGrams(totals, macro);
            const goalGrams = gramTargets[macro];
            const gapGrams = goalGrams - currentGrams;
            const currentKcal =
                macro === 'protein'
                    ? totals.proteinKcal
                    : macro === 'carbs'
                      ? totals.carbsKcal
                      : totals.fatKcal;
            const goalKcal = targetMacroKcal(target, macro);
            if (!isMacroOff(currentKcal, goalKcal)) {
                continue;
            }

            const skip = new Set<T>();
            const proteinFood = pickMacroContributor(next, 'protein', false);
            if (macro !== 'protein' && gapGrams < 0 && proteinFood) {
                skip.add(proteinFood);
            }

            const adjustable = pickMacroContributor(
                next,
                macro,
                true,
                skip
            );
            const pieceFallback =
                !adjustable && gapGrams > 0
                    ? pickMacroContributor(next, macro, false, skip)
                    : !adjustable && gapGrams < 0
                      ? next.find(
                            portion =>
                                isPieceUnit(portion) &&
                                pieceQuantity(portion) >= 2 &&
                                !skip.has(portion)
                        )
                      : null;
            const chosen = adjustable ?? (pieceFallback && isPieceUnit(pieceFallback)
                ? pieceFallback
                : null);
            if (!chosen) {
                continue;
            }

            const index = next.indexOf(chosen);
            if (index < 0) {
                continue;
            }

            const scaled = scalePortionToCloseMacroGap(
                chosen,
                originalGrams[index] ?? chosen.targetGrams,
                macro,
                gapGrams
            );
            if (scaled.targetGrams !== chosen.targetGrams) {
                next[index] = scaled;
                changed = true;
            }
        }

        if (!changed) {
            break;
        }
    }

    return next;
}

/**
 * After kitchen-unit snapping, nudge portions so total calories match the
 * planned meal target. Does not shrink the main protein when protein is still
 * below target, and does not change piece counts.
 */
export function correctPortionsToTargetCalories<T extends CalorieScaledPortion>(
    portions: T[],
    targetCalories: number,
    macroTarget?: MacroKcalTarget | null,
    originalGrams: number[] = portions.map(portion => portion.targetGrams)
): T[] {
    if (portions.length === 0 || targetCalories <= 0) {
        return portions;
    }

    const next = portions.map(portion => ({...portion}));

    for (let pass = 0; pass < 6; pass++) {
        const totals = mealMacroTotals(next);
        const gapKcal = totals.calories - targetCalories;
        if (Math.abs(gapKcal) < 8) {
            break;
        }

        const skip = new Set<T>();
        for (const portion of next) {
            if (isPieceUnit(portion)) {
                skip.add(portion);
            }
        }
        const proteinFood = pickMacroContributor(next, 'protein', false);
        if (gapKcal > 0 && proteinFood) {
            skip.add(proteinFood);
        }

        let chosen: T | null = null;
        if (gapKcal > 0) {
            chosen = pickCalorieTrimTarget(next, skip, originalGrams);
        } else {
            const proteinLow =
                macroTarget != null &&
                totals.proteinKcal < (macroTarget.proteinKcal ?? 0) * 0.95;
            chosen =
                (proteinLow
                    ? pickMacroContributor(next, 'protein', true, skip)
                    : null) ??
                pickMacroContributor(next, 'carbs', true, skip) ??
                pickMacroContributor(next, 'fat', true, skip);
        }

        if (!chosen) {
            chosen =
                next.find(
                    portion =>
                        isWeightOrVolumeUnit(portion) && !skip.has(portion)
                ) ?? null;
        }
        if (!chosen) {
            break;
        }

        const index = next.indexOf(chosen);
        const scaled = shiftPortionCalories(
            chosen,
            originalGrams[index] ?? chosen.targetGrams,
            -gapKcal
        );
        if (scaled.targetGrams === chosen.targetGrams) {
            skip.add(chosen);
            const fallback = next.find(
                portion =>
                    isWeightOrVolumeUnit(portion) &&
                    !skip.has(portion) &&
                    portion !== chosen
            );
            if (!fallback) {
                break;
            }
            const fallbackIndex = next.indexOf(fallback);
            next[fallbackIndex] = shiftPortionCalories(
                fallback,
                originalGrams[fallbackIndex] ?? fallback.targetGrams,
                -gapKcal
            );
            continue;
        }
        next[index] = scaled;
    }

    return next;
}

export function finalizePortionsToMealTargets<T extends CalorieScaledPortion>(
    portions: T[],
    plannedCalories: number,
    macroTarget?: MacroKcalTarget | null
): T[] {
    const clamped = portions.map(portion =>
        applyTargetGrams(
            portion,
            clampPortionGrams(
                portion.targetGrams,
                portion.targetGrams,
                portion
            )
        )
    );
    const originalGrams = clamped.map(portion => portion.targetGrams);
    const nudged = nudgePortionsTowardMacroTargets(
        clamped,
        macroTarget,
        originalGrams
    );
    const corrected = correctPortionsToTargetCalories(
        nudged,
        plannedCalories,
        macroTarget,
        originalGrams
    );
    return syncQuantitiesFromGrams(corrected);
}

function syncQuantitiesFromGrams<T extends CalorieScaledPortion>(
    portions: T[]
): T[] {
    return portions.map(portion => {
        const unit = normalizeIngredientUnit(portion.unit);
        if (unit === 'GRAM') {
            return {...portion, targetQuantity: portion.targetGrams};
        }
        if (unit === 'PIECE') {
            return {
                ...portion,
                targetQuantity: snapQuantityForUnit(
                    portion.targetQuantity ?? 1,
                    unit,
                    {
                        isDiscrete: portion.isDiscrete ?? false,
                        allowFractions: true
                    }
                )
            };
        }

        const gramsPerUnit = gramsPerIngredientUnit(unit);
        if (gramsPerUnit <= 0) {
            return portion;
        }

        return {
            ...portion,
            targetQuantity: snapQuantityForUnit(
                portion.targetGrams / gramsPerUnit,
                unit,
                {isDiscrete: portion.isDiscrete ?? false}
            )
        };
    });
}

/**
 * Staff-facing notes when a scaled recipe is still off the meal macro split.
 * Names the ingredient that pushes the gap and suggests raising or lowering
 * that same food — never a new ingredient.
 */
export function buildMacroAdjustmentWarnings(
    portions: NamedCaloriePortion[],
    target?: MacroKcalTarget | null
): string[] {
    if (!target || portions.length === 0) {
        return [];
    }

    const totals = mealMacroTotals(portions);
    const warnings: string[] = [];
    const decreaseNames = new Set<string>();

    for (const macro of ['carbs', 'protein', 'fat'] as MacroKey[]) {
        const actualKcal =
            macro === 'protein'
                ? totals.proteinKcal
                : macro === 'carbs'
                  ? totals.carbsKcal
                  : totals.fatKcal;
        const goalKcal = targetMacroKcal(target, macro);
        if (!isMacroOff(actualKcal, goalKcal) || actualKcal <= goalKcal) {
            continue;
        }

        const actualGrams = gramsFromMacroKcal(actualKcal, macro);
        const goalGrams = gramsFromMacroKcal(goalKcal, macro);
        const label = MACRO_LABEL[macro];
        const pusher = pickMacroContributor(portions, macro, false);
        const food = pusher?.ingredientName?.trim() || 'un ingrediente';
        decreaseNames.add(food.toLowerCase());
        warnings.push(
            `${label}: ${round1Grams(actualGrams)} g vs ${round1Grams(goalGrams)} g objetivo. ${food} es lo que más empuja; baja un poco esa cantidad.`
        );
    }

    for (const macro of ['carbs', 'protein', 'fat'] as MacroKey[]) {
        const actualKcal =
            macro === 'protein'
                ? totals.proteinKcal
                : macro === 'carbs'
                  ? totals.carbsKcal
                  : totals.fatKcal;
        const goalKcal = targetMacroKcal(target, macro);
        if (!isMacroOff(actualKcal, goalKcal) || actualKcal >= goalKcal) {
            continue;
        }

        const actualGrams = gramsFromMacroKcal(actualKcal, macro);
        const goalGrams = gramsFromMacroKcal(goalKcal, macro);
        const label = MACRO_LABEL[macro];
        const pusher = pickMacroContributor(portions, macro, false);
        const food = pusher?.ingredientName?.trim() || 'un ingrediente';
        if (decreaseNames.has(food.toLowerCase())) {
            continue;
        }
        warnings.push(
            `${label}: ${round1Grams(actualGrams)} g vs ${round1Grams(goalGrams)} g objetivo. ${food} es lo que más aporta ${label} en esta receta; súbelo un poco.`
        );
    }

    return warnings;
}

function round1Grams(value: number) {
    return Number(value.toFixed(1));
}
