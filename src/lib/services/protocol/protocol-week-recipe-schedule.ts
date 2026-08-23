import {DAYS_PER_WEEK} from '@/lib/utils/protocol-week-plan';

export type SchedulableRecipe = {
    id: string;
};

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

/**
 * Seven day slots for one week: spread recipes evenly, allow repeats when the
 * pool is small, but never place the same recipe on consecutive days.
 */
function buildWeekDaySlots<T extends SchedulableRecipe>(
    recipes: T[],
    weekIndex: number,
    shuffleSeed: number
): T[] {
    if (recipes.length === 0) {
        return [];
    }

    if (recipes.length === 1) {
        return Array.from({length: DAYS_PER_WEEK}, () => recipes[0]);
    }

    const shuffled = shuffleRecipes(recipes, shuffleSeed + weekIndex * 31);
    const slots: T[] = [];
    const useCount = new Map<string, number>();

    for (let day = 0; day < DAYS_PER_WEEK; day++) {
        const previousId = slots[day - 1]?.id;

        const candidates = shuffled
            .filter(recipe => recipe.id !== previousId)
            .sort(
                (a, b) =>
                    (useCount.get(a.id) ?? 0) - (useCount.get(b.id) ?? 0)
            );

        const picked = candidates[0] ?? shuffled[0];
        slots.push(picked);
        useCount.set(picked.id, (useCount.get(picked.id) ?? 0) + 1);
    }

    return slots;
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
    if (recipes.length === 0) {
        return [];
    }

    const partitions = partitionRecipesAcrossWeeks(
        recipes,
        weekCount,
        shuffleSeed
    );

    return partitions.map((weekRecipes, weekIndex) => {
        const pool = weekRecipes.length > 0 ? weekRecipes : recipes;
        return buildWeekDaySlots(pool, weekIndex, shuffleSeed);
    });
}

/**
 * Schedules several meal types from one shared catalog, keeping recipe IDs
 * unique across weeks. Used when breakfast/lunch/dinner share a pool.
 */
export function buildMultiMealWeeklySchedules<T extends SchedulableRecipe>(
    catalog: Record<string, T[]>,
    mealKeys: string[],
    weekCount: number,
    shuffleSeed: number
): Record<string, T[][]> {
    const schedules: Record<string, T[][]> = Object.fromEntries(
        mealKeys.map(key => [key, []])
    );

    if (mealKeys.length === 0) {
        return schedules;
    }

    const union = uniqueRecipesById(
        mealKeys.flatMap(key => catalog[key] ?? [])
    );

    if (union.length === 0) {
        return schedules;
    }

    const partitions = partitionRecipesAcrossWeeks(
        union,
        weekCount,
        shuffleSeed,
        DAYS_PER_WEEK * mealKeys.length
    );

    for (let weekIndex = 0; weekIndex < partitions.length; weekIndex++) {
        const weekIds = new Set(partitions[weekIndex].map(recipe => recipe.id));
        const otherWeekIds = new Set(
            partitions.flatMap((weekRecipes, index) =>
                index === weekIndex
                    ? []
                    : weekRecipes.map(recipe => recipe.id)
            )
        );

        for (const [mealOffset, mealKey] of mealKeys.entries()) {
            const mealCatalog = catalog[mealKey] ?? [];
            const weekPool = mealCatalog.filter(recipe =>
                weekIds.has(recipe.id)
            );
            const uniquePool = mealCatalog.filter(
                recipe => !otherWeekIds.has(recipe.id)
            );
            const pool =
                weekPool.length > 0
                    ? weekPool
                    : uniquePool.length > 0
                      ? uniquePool
                      : mealCatalog;

            schedules[mealKey].push(
                buildWeekDaySlots(
                    pool,
                    weekIndex,
                    shuffleSeed + mealOffset * 19
                )
            );
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
