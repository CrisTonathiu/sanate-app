type RestrictedFood = {
    id?: string | null;
    name?: string | null;
};

type RecipeRestrictionSource = {
    ingredients: Array<{
        ingredient?: {
            name?: string | null;
            foodId?: string | null;
        } | null;
    }>;
    extraIngredients?: Array<{name?: string | null}> | null;
};

export type RecipeRestrictions = {
    foodIds: ReadonlySet<string>;
    /** Restricted food names as word stems, for ingredients without a catalog food. */
    nameTokens: string[][];
};

// Folds Spanish plurals so "nueces" matches "nuez" and "tomates" matches "tomate".
function stemWord(word: string): string {
    if (word.length <= 3) {
        return word;
    }

    let stem = word.endsWith('ces') ? `${word.slice(0, -3)}z` : word;
    if (stem.endsWith('s')) {
        stem = stem.slice(0, -1);
    }
    if (stem.length > 3 && stem.endsWith('e')) {
        stem = stem.slice(0, -1);
    }

    return stem;
}

function tokenizeName(value: string): string[] {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
        .map(stemWord);
}

// Whole words, one direction: "huevo" matches "huevo revuelto", but "sal"
// does not match "salmón" and "aceite de oliva" does not match "aceite".
function containsWords(candidate: string[], restricted: string[]): boolean {
    for (
        let start = 0;
        start + restricted.length <= candidate.length;
        start++
    ) {
        if (restricted.every((word, i) => candidate[start + i] === word)) {
            return true;
        }
    }

    return false;
}

export function buildRecipeRestrictions(
    foods: RestrictedFood[]
): RecipeRestrictions {
    const foodIds = new Set<string>();
    const nameTokens: string[][] = [];

    for (const food of foods) {
        if (food.id) {
            foodIds.add(food.id);
        }

        const tokens = tokenizeName(food.name ?? '');
        if (tokens.length > 0) {
            nameTokens.push(tokens);
        }
    }

    return {foodIds, nameTokens};
}

/**
 * Ingredients linked to a catalog food are matched by food id. Unlinked
 * ingredients and free-text extras fall back to matching by name.
 */
export function isRecipeRestricted(
    recipe: RecipeRestrictionSource,
    restrictions: RecipeRestrictions
): boolean {
    if (
        restrictions.foodIds.size === 0 &&
        restrictions.nameTokens.length === 0
    ) {
        return false;
    }

    const unlinkedNames: string[] = [];

    for (const item of recipe.ingredients) {
        const foodId = item.ingredient?.foodId;
        if (foodId) {
            if (restrictions.foodIds.has(foodId)) {
                return true;
            }
            continue;
        }

        unlinkedNames.push(item.ingredient?.name ?? '');
    }

    for (const extra of recipe.extraIngredients ?? []) {
        unlinkedNames.push(extra.name ?? '');
    }

    return unlinkedNames.some(name => {
        const candidate = tokenizeName(name);
        return restrictions.nameTokens.some(restricted =>
            containsWords(candidate, restricted)
        );
    });
}
