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
const MAX_NUDGE_RATIO = 0.2;

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

function isGramAdjustable(portion: CalorieScaledPortion) {
    const unit = normalizeIngredientUnit(portion.unit);
    return unit === 'GRAM' || unit === 'ML';
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
    return {...portion, targetGrams: nextGrams};
}

function pickMacroContributor<T extends CalorieScaledPortion>(
    portions: T[],
    macro: MacroKey,
    adjustableOnly: boolean
): T | null {
    let best: T | null = null;
    let bestKcal = 0;
    for (const portion of portions) {
        if (adjustableOnly && !isGramAdjustable(portion)) {
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

function macroGapKcal(
    totals: ReturnType<typeof mealMacroTotals>,
    target: MacroKcalTarget,
    macro: MacroKey
) {
    if (macro === 'protein') {
        return totals.proteinKcal - (target.proteinKcal ?? 0);
    }
    if (macro === 'carbs') {
        return totals.carbsKcal - (target.carbsKcal ?? 0);
    }
    return totals.fatKcal - (target.fatKcal ?? 0);
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

/**
 * Moves grams between weight-based ingredients so macros get closer to the
 * meal target without changing the food list. Total kcal stay roughly the
 * same; call correctPortionsToTargetCalories after this.
 */
export function nudgePortionsTowardMacroTargets<T extends CalorieScaledPortion>(
    portions: T[],
    target?: MacroKcalTarget | null
): T[] {
    if (!target || portions.length === 0) {
        return portions;
    }

    const next = portions.map(portion => ({...portion}));

    for (let pass = 0; pass < 2; pass++) {
        const totals = mealMacroTotals(next);
        const gaps = (['fat', 'carbs', 'protein'] as MacroKey[])
            .map(macro => ({
                macro,
                gap: macroGapKcal(totals, target, macro),
                targetKcal: targetMacroKcal(target, macro)
            }))
            .filter(item =>
                isMacroOff(item.targetKcal + item.gap, item.targetKcal)
            );

        if (gaps.length === 0) {
            break;
        }

        const surplus = [...gaps]
            .filter(item => item.gap > 0)
            .sort((a, b) => b.gap - a.gap)[0];
        const deficit = [...gaps]
            .filter(item => item.gap < 0)
            .sort((a, b) => a.gap - b.gap)[0];

        const donor = surplus
            ? pickMacroContributor(next, surplus.macro, true)
            : null;
        const receiver = deficit
            ? pickMacroContributor(next, deficit.macro, true)
            : null;

        let didAdjust = false;

        if (surplus && donor) {
            const donorIndex = next.indexOf(donor);
            const kcalPerGram = (donor.baseCalories ?? 0) / 100;
            if (donorIndex >= 0 && kcalPerGram > 0) {
                const maxKcal = donor.targetGrams * MAX_NUDGE_RATIO * kcalPerGram;
                let transfer = Math.min(surplus.gap * 0.5, maxKcal);

                if (
                    deficit &&
                    receiver &&
                    receiver !== donor &&
                    (receiver.baseCalories ?? 0) > 0
                ) {
                    const recvKcalPerGram = (receiver.baseCalories ?? 0) / 100;
                    const maxRecvKcal =
                        receiver.targetGrams * MAX_NUDGE_RATIO * recvKcalPerGram;
                    transfer = Math.min(transfer, -deficit.gap * 0.5, maxRecvKcal);
                    if (transfer >= 8) {
                        next[donorIndex] = applyTargetGrams(
                            donor,
                            donor.targetGrams - transfer / kcalPerGram
                        );
                        const recvIndex = next.indexOf(receiver);
                        if (recvIndex >= 0) {
                            next[recvIndex] = applyTargetGrams(
                                receiver,
                                receiver.targetGrams + transfer / recvKcalPerGram
                            );
                        }
                        continue;
                    }
                }

                if (transfer >= 8) {
                    next[donorIndex] = applyTargetGrams(
                        donor,
                        donor.targetGrams - transfer / kcalPerGram
                    );
                    didAdjust = true;
                }
            }
        } else if (deficit && receiver) {
            const recvIndex = next.indexOf(receiver);
            const kcalPerGram = (receiver.baseCalories ?? 0) / 100;
            if (recvIndex >= 0 && kcalPerGram > 0) {
                const maxKcal =
                    receiver.targetGrams * MAX_NUDGE_RATIO * kcalPerGram;
                const transfer = Math.min(-deficit.gap * 0.5, maxKcal);
                if (transfer >= 8) {
                    next[recvIndex] = applyTargetGrams(
                        receiver,
                        receiver.targetGrams + transfer / kcalPerGram
                    );
                    didAdjust = true;
                }
            }
        } else {
            break;
        }

        if (!didAdjust) {
            break;
        }
    }

    return next;
}

export function finalizePortionsToMealTargets<T extends CalorieScaledPortion>(
    portions: T[],
    plannedCalories: number,
    macroTarget?: MacroKcalTarget | null
): T[] {
    const nudged = nudgePortionsTowardMacroTargets(portions, macroTarget);
    return correctPortionsToTargetCalories(nudged, plannedCalories);
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

    for (const macro of ['carbs', 'protein', 'fat'] as MacroKey[]) {
        const actualKcal =
            macro === 'protein'
                ? totals.proteinKcal
                : macro === 'carbs'
                  ? totals.carbsKcal
                  : totals.fatKcal;
        const goalKcal = targetMacroKcal(target, macro);
        if (!isMacroOff(actualKcal, goalKcal)) {
            continue;
        }

        const actualGrams = gramsFromMacroKcal(actualKcal, macro);
        const goalGrams = gramsFromMacroKcal(goalKcal, macro);
        const label = MACRO_LABEL[macro];
        const pusher = pickMacroContributor(portions, macro, false);
        const food = pusher?.ingredientName?.trim() || 'un ingrediente';

        if (actualKcal > goalKcal) {
            warnings.push(
                `${label}: ${round1Grams(actualGrams)} g vs ${round1Grams(goalGrams)} g objetivo. ${food} es lo que más empuja; baja un poco esa cantidad.`
            );
        } else {
            warnings.push(
                `${label}: ${round1Grams(actualGrams)} g vs ${round1Grams(goalGrams)} g objetivo. ${food} es lo que más aporta ${label} en esta receta; súbelo un poco.`
            );
        }
    }

    return warnings;
}

function round1Grams(value: number) {
    return Number(value.toFixed(1));
}
