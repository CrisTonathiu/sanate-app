export function normalizeExtraIngredientNames(
    extras?: Array<string | {name?: string | null} | null> | null
): string[] {
    if (!extras) {
        return [];
    }

    const seen = new Set<string>();
    const names: string[] = [];

    for (const extra of extras) {
        const name = (typeof extra === 'string' ? extra : extra?.name ?? '')
            .trim();
        if (!name) {
            continue;
        }

        const key = name.toLowerCase();
        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        names.push(name);
    }

    return names;
}

/** `null` means the meal never stored extras — fall back to the recipe. */
export function parseStoredExtraIngredients(value: unknown): string[] | null {
    if (value == null) {
        return null;
    }

    if (!Array.isArray(value)) {
        return null;
    }

    return normalizeExtraIngredientNames(
        value as Array<string | {name?: string | null} | null>
    );
}

export function resolveMealExtraIngredients(
    stored: unknown,
    recipeExtras?: Array<string | {name?: string | null} | null> | null
): string[] {
    const storedNames = parseStoredExtraIngredients(stored);
    if (storedNames) {
        return storedNames;
    }

    return normalizeExtraIngredientNames(recipeExtras);
}
