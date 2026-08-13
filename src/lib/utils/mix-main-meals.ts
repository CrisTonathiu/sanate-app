/**
 * Breakfast, lunch, and dinner can share recipes with each other.
 * Smoothies, snacks, and drinks stay in their own slots.
 */
export const MIXABLE_MAIN_MEAL_KEYS = [
    'breakfast',
    'lunch',
    'dinner'
] as const;

export type MixableMainMealKey = (typeof MIXABLE_MAIN_MEAL_KEYS)[number];

const MIXABLE_MAIN_MEAL_KEY_SET = new Set<string>(MIXABLE_MAIN_MEAL_KEYS);

export function isMixableMainMealKey(key: string): key is MixableMainMealKey {
    return MIXABLE_MAIN_MEAL_KEY_SET.has(key.toLowerCase());
}

function catalogKey(key: string) {
    return key.toLowerCase();
}

/**
 * Toggle helper: when `mixMainMeals` is on, breakfast/lunch/dinner share one
 * recipe pool. Existing catalog entries for batidos, colaciones, and bebidas
 * are left unchanged. Pass `false` to keep the original per-type catalogs.
 */
export function applyMixableMainMealsCatalog<T extends {id: string}>(
    catalog: Record<string, T[]>,
    mixMainMeals: boolean
): Record<string, T[]> {
    if (!mixMainMeals) {
        return catalog;
    }

    const seen = new Set<string>();
    const mixed: T[] = [];

    for (const key of MIXABLE_MAIN_MEAL_KEYS) {
        for (const recipe of catalog[key] ?? []) {
            if (seen.has(recipe.id)) {
                continue;
            }
            seen.add(recipe.id);
            mixed.push(recipe);
        }
    }

    return {
        ...catalog,
        breakfast: mixed,
        lunch: mixed,
        dinner: mixed
    };
}

const SLOT_TO_RECIPE_TYPES: Record<string, string[]> = {
    smoothie: ['SMOOTHIE'],
    breakfast: ['BREAKFAST'],
    snack1: ['SNACK1', 'SNACK', 'ANY'],
    snack2: ['SNACK2', 'SNACK', 'ANY'],
    lunch: ['LUNCH', 'ANY'],
    dinner: ['DINNER', 'ANY'],
    drinks: ['DRINKS', 'ANY']
};

/**
 * Toggle helper for recipe pickers: when mixing is on, a breakfast/lunch/dinner
 * slot can show recipes from any of those three types.
 */
export function getAllowedRecipeTypesForSlot(
    slot: string,
    mixMainMeals: boolean
): string[] {
    const key = catalogKey(slot);

    if (mixMainMeals && isMixableMainMealKey(key)) {
        const types = new Set<string>();
        for (const mixable of MIXABLE_MAIN_MEAL_KEYS) {
            for (const type of SLOT_TO_RECIPE_TYPES[mixable] ?? []) {
                types.add(type);
            }
        }
        return [...types];
    }

    return SLOT_TO_RECIPE_TYPES[key] ?? [];
}
