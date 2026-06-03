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
        return Array.from({length: 7}, () => recipes[0]);
    }

    const shuffled = shuffleRecipes(recipes, shuffleSeed + weekIndex * 31);
    const slots: T[] = [];
    const useCount = new Map<string, number>();

    for (let day = 0; day < 7; day++) {
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

/**
 * Builds one 7-day recipe row per week for a meal type.
 * Repeats within a week are allowed when needed; across weeks the pool is reused
 * with a different shuffle. Same recipe never appears on back-to-back days.
 */
export function buildWeeklyRecipeSchedule<T extends SchedulableRecipe>(
    recipes: T[],
    weekCount: number,
    shuffleSeed: number
): T[][] {
    if (recipes.length === 0) {
        return [];
    }

    return Array.from({length: weekCount}, (_, weekIndex) =>
        buildWeekDaySlots(recipes, weekIndex, shuffleSeed)
    );
}

export function collectRecipeIdsUsedInOtherWeeks<T extends {day: string}>(
    weekPlan: T[],
    currentDayLabel: string,
    mealKey: string,
    parseWeekIndex: (dayLabel: string) => number
): Set<string> {
    const currentWeekIndex = parseWeekIndex(currentDayLabel);
    const ids = new Set<string>();

    for (const day of weekPlan) {
        if (parseWeekIndex(day.day) === currentWeekIndex) {
            continue;
        }

        const slot = (day as Record<string, {id?: string} | undefined>)[mealKey];
        if (slot?.id) {
            ids.add(slot.id);
        }
    }

    return ids;
}
