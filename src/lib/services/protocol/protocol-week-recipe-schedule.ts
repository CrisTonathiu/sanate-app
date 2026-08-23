import {DAYS_PER_WEEK} from '@/lib/utils/protocol-week-plan';
import {
    collectProteinFamiliesFromNames,
    recipeHasProteinSource,
    recipeSharesProteinFamily
} from '@/lib/utils/protein-family';

export type SchedulableRecipe = {
    id: string;
    proteinFamilies?: readonly string[];
    calories?: number;
    protein?: number;
};

export type MealSlotTargets = {
    calories?: number;
    proteinGrams?: number;
};

const PROTEIN_PREFERRED_MEALS = new Set(['breakfast', 'lunch', 'dinner']);
const MIN_PROTEIN_TARGET_RATIO = 0.55;

export const MEAL_TYPE_LABELS: Record<string, string> = {
    smoothie: 'Batido',
    breakfast: 'Desayuno',
    snack1: 'Snack 1',
    snack2: 'Snack 2',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    drinks: 'Bebidas'
};

function shuffleRecipes<T extends SchedulableRecipe>(
    recipes: T[],
    seed: number
): T[] {
    const copy = [...recipes];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.abs((seed + i * 17) % (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

/**
 * Split recipes into disjoint per-week pools so each week gets a different
 * menu. Extra recipes beyond `maxPerWeek` per week are left unused.
 * Weeks with no unique recipe left receive an empty pool (caller may fall back).
 */
export function partitionRecipesAcrossWeeks<T extends SchedulableRecipe>(
    recipes: T[],
    weekCount: number,
    shuffleSeed: number,
    maxPerWeek: number = DAYS_PER_WEEK
): T[][] {
    const shuffled = shuffleRecipes(recipes, shuffleSeed);
    const safeWeekCount = Math.max(1, weekCount);

    if (safeWeekCount === 1) {
        return [shuffled];
    }

    const usableCount = Math.min(
        shuffled.length,
        Math.max(0, maxPerWeek) * safeWeekCount
    );
    const usable = shuffled.slice(0, usableCount);
    const baseSize = Math.floor(usable.length / safeWeekCount);
    const remainder = usable.length % safeWeekCount;

    const partitions: T[][] = [];
    let offset = 0;

    for (let weekIndex = 0; weekIndex < safeWeekCount; weekIndex++) {
        const size = baseSize + (weekIndex < remainder ? 1 : 0);
        partitions.push(usable.slice(offset, offset + size));
        offset += size;
    }

    return partitions;
}

function uniqueRecipesById<T extends SchedulableRecipe>(recipes: T[]): T[] {
    const seen = new Set<string>();
    const unique: T[] = [];

    for (const recipe of recipes) {
        if (seen.has(recipe.id)) {
            continue;
        }
        seen.add(recipe.id);
        unique.push(recipe);
    }

    return unique;
}

function scaledProteinGrams(
    recipe: SchedulableRecipe,
    targetCalories: number
): number {
    const protein = recipe.protein ?? 0;
    const calories = recipe.calories ?? 0;
    if (calories <= 0 || !(targetCalories > 0)) {
        return protein;
    }

    return protein * (targetCalories / calories);
}

function recipeMeetsProteinNeed(
    recipe: SchedulableRecipe,
    targets: MealSlotTargets | undefined,
    needProtein: boolean
): boolean {
    if (!needProtein) {
        return true;
    }

    const proteinTarget = targets?.proteinGrams ?? 0;
    if (proteinTarget > 0) {
        return (
            scaledProteinGrams(recipe, targets?.calories ?? 0) >=
            proteinTarget * MIN_PROTEIN_TARGET_RATIO
        );
    }

    return recipeHasProteinSource(recipe);
}

function rankForSlot<T extends SchedulableRecipe>(
    recipes: T[],
    useCount: Map<string, number>,
    targets?: MealSlotTargets
): T[] {
    const proteinTarget = targets?.proteinGrams ?? 0;
    const targetCalories = targets?.calories ?? 0;

    return [...recipes].sort((a, b) => {
        if (proteinTarget > 0) {
            const distance =
                Math.abs(scaledProteinGrams(a, targetCalories) - proteinTarget) -
                Math.abs(scaledProteinGrams(b, targetCalories) - proteinTarget);
            if (Math.abs(distance) > 2) {
                return distance;
            }
        }

        return (useCount.get(a.id) ?? 0) - (useCount.get(b.id) ?? 0);
    });
}

function slotNeedsProtein(
    mealKey: string,
    targets?: MealSlotTargets
): boolean {
    if ((targets?.proteinGrams ?? 0) > 0) {
        return true;
    }

    return PROTEIN_PREFERRED_MEALS.has(mealKey);
}

/**
 * Prefer a recipe that can hit the meal protein target, whose protein type
 * is not already used today, and that is not used earlier today / yesterday.
 * Never skip a protein-rich recipe in favor of a low-protein one just to
 * avoid repeating a protein type — that fallback comes last.
 */
function pickRecipeForSlot<T extends SchedulableRecipe>(
    pool: T[],
    usedToday: Set<string>,
    usedProteinToday: Set<string>,
    previousId: string | undefined,
    useCount: Map<string, number>,
    targets?: MealSlotTargets,
    needProtein: boolean = false
): T | undefined {
    if (pool.length === 0) {
        return undefined;
    }

    if (pool.length === 1) {
        return pool[0];
    }

    const uniqueToday = (recipe: T) => !usedToday.has(recipe.id);
    const notPrevious = (recipe: T) => recipe.id !== previousId;
    const uniqueProtein = (recipe: T) =>
        !recipeSharesProteinFamily(recipe, usedProteinToday);
    const meetsProtein = (recipe: T) =>
        recipeMeetsProteinNeed(recipe, targets, needProtein);

    const candidateGroups: Array<Array<(recipe: T) => boolean>> = needProtein
        ? [
              [uniqueToday, notPrevious, uniqueProtein, meetsProtein],
              [uniqueToday, uniqueProtein, meetsProtein],
              [uniqueToday, notPrevious, meetsProtein],
              [uniqueToday, meetsProtein],
              [notPrevious, meetsProtein],
              [meetsProtein],
              [uniqueToday, notPrevious, uniqueProtein],
              [uniqueToday, uniqueProtein],
              [uniqueToday, notPrevious],
              [uniqueToday],
              [notPrevious]
          ]
        : [
              [uniqueToday, notPrevious, uniqueProtein],
              [uniqueToday, uniqueProtein],
              [uniqueToday, notPrevious],
              [uniqueToday],
              [notPrevious]
          ];

    for (const predicates of candidateGroups) {
        const candidates = pool.filter(recipe =>
            predicates.every(predicate => predicate(recipe))
        );
        if (candidates.length > 0) {
            return rankForSlot(candidates, useCount, targets)[0];
        }
    }

    return rankForSlot(pool, useCount, targets)[0];
}

function resolveWeekPool<T extends SchedulableRecipe>(
    mealCatalog: T[],
    weekRecipes: T[],
    otherWeekIds: Set<string>
): T[] {
    const weekIds = new Set(weekRecipes.map(recipe => recipe.id));
    const weekPool = mealCatalog.filter(recipe => weekIds.has(recipe.id));
    if (weekPool.length > 0) {
        return weekPool;
    }

    const uniquePool = mealCatalog.filter(
        recipe => !otherWeekIds.has(recipe.id)
    );
    if (uniquePool.length > 0) {
        return uniquePool;
    }

    return mealCatalog;
}

function buildWeekPoolsForMeals<T extends SchedulableRecipe>(
    catalog: Record<string, T[]>,
    mealKeys: string[],
    weekCount: number,
    shuffleSeed: number,
    sharedPoolKeys: string[]
): Record<string, T[][]> {
    const pools: Record<string, T[][]> = {};
    const sharedKeySet = new Set(sharedPoolKeys);
    const sharedKeys = mealKeys.filter(key => sharedKeySet.has(key));
    const independentKeys = mealKeys.filter(key => !sharedKeySet.has(key));

    if (sharedKeys.length > 0) {
        const union = uniqueRecipesById(
            sharedKeys.flatMap(key => catalog[key] ?? [])
        );
        const partitions = partitionRecipesAcrossWeeks(
            union,
            weekCount,
            shuffleSeed,
            DAYS_PER_WEEK * sharedKeys.length
        );

        for (const mealKey of sharedKeys) {
            pools[mealKey] = partitions.map((weekRecipes, weekIndex) => {
                const otherWeekIds = new Set(
                    partitions.flatMap((recipes, index) =>
                        index === weekIndex ? [] : recipes.map(recipe => recipe.id)
                    )
                );
                return resolveWeekPool(
                    catalog[mealKey] ?? [],
                    weekRecipes,
                    otherWeekIds
                );
            });
        }
    }

    for (const [mealOffset, mealKey] of independentKeys.entries()) {
        const mealCatalog = catalog[mealKey] ?? [];
        const partitions = partitionRecipesAcrossWeeks(
            mealCatalog,
            weekCount,
            shuffleSeed + mealOffset * 19 + mealKey.length
        );

        pools[mealKey] = partitions.map((weekRecipes, weekIndex) => {
            const otherWeekIds = new Set(
                partitions.flatMap((recipes, index) =>
                    index === weekIndex ? [] : recipes.map(recipe => recipe.id)
                )
            );
            return resolveWeekPool(mealCatalog, weekRecipes, otherWeekIds);
        });
    }

    return pools;
}

/**
 * Builds one 7-day recipe row per week for a meal type.
 * Each week uses a disjoint recipe set so menus do not repeat across weeks.
 * Repeats within a week are allowed only when that week's pool is smaller
 * than 7. Same recipe never appears on back-to-back days.
 */
export function buildWeeklyRecipeSchedule<T extends SchedulableRecipe>(
    recipes: T[],
    weekCount: number,
    shuffleSeed: number
): T[][] {
    return (
        buildMultiMealWeeklySchedules(
            {meal: recipes},
            ['meal'],
            weekCount,
            shuffleSeed
        ).meal ?? []
    );
}

/**
 * Schedules meal types together so:
 * - weeks use disjoint recipe sets
 * - the same recipe is not used twice on the same day
 * - the same protein type is used in at most one recipe per day when another
 *   protein-rich option exists
 * - breakfast, lunch, and dinner prefer recipes that can hit the protein target
 *   so macros stay even across the week
 * - the same recipe is not used on consecutive days of the same meal
 *
 * `sharedPoolKeys` (breakfast/lunch/dinner when mixing is on) share one
 * catalog and one per-week partition.
 */
export function buildMultiMealWeeklySchedules<T extends SchedulableRecipe>(
    catalog: Record<string, T[]>,
    mealKeys: string[],
    weekCount: number,
    shuffleSeed: number,
    sharedPoolKeys: string[] = [],
    mealTargets: Record<string, MealSlotTargets> = {}
): Record<string, T[][]> {
    const schedules: Record<string, T[][]> = Object.fromEntries(
        mealKeys.map(key => [key, []])
    );

    if (mealKeys.length === 0) {
        return schedules;
    }

    const weekPools = buildWeekPoolsForMeals(
        catalog,
        mealKeys,
        weekCount,
        shuffleSeed,
        sharedPoolKeys
    );
    const safeWeekCount = Math.max(1, weekCount);

    for (let weekIndex = 0; weekIndex < safeWeekCount; weekIndex++) {
        const useCount = new Map<string, number>();

        for (const mealKey of mealKeys) {
            schedules[mealKey].push([]);
        }

        for (let day = 0; day < DAYS_PER_WEEK; day++) {
            const usedToday = new Set<string>();
            const usedProteinToday = new Set<string>();

            for (const mealKey of mealKeys) {
                const pool = weekPools[mealKey]?.[weekIndex] ?? [];
                const previousId = schedules[mealKey][weekIndex][day - 1]?.id;
                const targets = mealTargets[mealKey];
                const picked = pickRecipeForSlot(
                    pool,
                    usedToday,
                    usedProteinToday,
                    previousId,
                    useCount,
                    targets,
                    slotNeedsProtein(mealKey, targets)
                );

                if (!picked) {
                    continue;
                }

                schedules[mealKey][weekIndex].push(picked);
                usedToday.add(picked.id);
                for (const family of picked.proteinFamilies ?? []) {
                    usedProteinToday.add(family);
                }
                useCount.set(picked.id, (useCount.get(picked.id) ?? 0) + 1);
            }
        }
    }

    return schedules;
}

export function collectRecipeIdsUsedInOtherWeeks<T extends {day: string}>(
    weekPlan: T[],
    currentDayLabel: string,
    _mealKey: string,
    parseWeekIndex: (dayLabel: string) => number
): Set<string> {
    const currentWeekIndex = parseWeekIndex(currentDayLabel);
    const ids = new Set<string>();

    for (const day of weekPlan) {
        if (parseWeekIndex(day.day) === currentWeekIndex) {
            continue;
        }

        for (const [key, value] of Object.entries(day)) {
            if (key === 'day') {
                continue;
            }

            const slot = value as {id?: string} | undefined;
            if (slot?.id) {
                ids.add(slot.id);
            }
        }
    }

    return ids;
}

export function collectRecipeIdsUsedOnSameDay<T extends {day: string}>(
    weekPlan: T[],
    currentDayLabel: string,
    currentMealKey: string
): Set<string> {
    const ids = new Set<string>();
    const day = weekPlan.find(item => item.day === currentDayLabel);
    if (!day) {
        return ids;
    }

    for (const [key, value] of Object.entries(day)) {
        if (key === 'day' || key === currentMealKey) {
            continue;
        }

        const slot = value as {id?: string} | undefined;
        if (slot?.id) {
            ids.add(slot.id);
        }
    }

    return ids;
}

export function collectProteinFamiliesUsedOnSameDay<T extends {day: string}>(
    weekPlan: T[],
    currentDayLabel: string,
    currentMealKey: string
): string[] {
    const day = weekPlan.find(item => item.day === currentDayLabel);
    if (!day) {
        return [];
    }

    const families = new Set<string>();

    for (const [key, value] of Object.entries(day)) {
        if (key === 'day' || key === currentMealKey) {
            continue;
        }

        const slot = value as
            | {
                  ingredientPortions?: Array<{ingredientName?: string}>;
              }
            | undefined;
        const names =
            slot?.ingredientPortions?.map(portion => portion.ingredientName) ??
            [];

        for (const family of collectProteinFamiliesFromNames(names)) {
            families.add(family);
        }
    }

    return [...families];
}
