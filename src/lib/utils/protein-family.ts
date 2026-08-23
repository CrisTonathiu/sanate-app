export const PROTEIN_FOOD_GROUP = 'PROTEINAS';

export const PROTEIN_FAMILY = {
    eggs: 'eggs',
    chicken: 'chicken',
    turkey: 'turkey',
    beef: 'beef',
    pork: 'pork',
    fish: 'fish',
    shellfish: 'shellfish',
    soy: 'soy'
} as const;

export type KnownProteinFamily =
    (typeof PROTEIN_FAMILY)[keyof typeof PROTEIN_FAMILY];

type ProteinIngredientSource = {
    name?: string | null;
    foodGroupName?: string | null;
    ingredient?: {
        name?: string | null;
        food?: {
            name?: string | null;
            group?: {
                name?: string | null;
            } | null;
        } | null;
    } | null;
};

function normalizeProteinName(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[._/,-]+/g, ' ')
        .replace(/\s+/g, ' ');
}

const FAMILY_RULES: Array<{family: KnownProteinFamily; pattern: RegExp}> = [
    {family: PROTEIN_FAMILY.eggs, pattern: /\bhuevos?\b|\bclaras?\b|\beggs?\b/},
    {family: PROTEIN_FAMILY.chicken, pattern: /\bpollos?\b|\bchicken\b/},
    {family: PROTEIN_FAMILY.turkey, pattern: /\bpavos?\b|\bturkey\b/},
    {
        family: PROTEIN_FAMILY.pork,
        pattern: /\bcerdo\b|\bpuerco\b|\bjamon\b|\bchuletas?\b|\bpork\b/
    },
    {
        family: PROTEIN_FAMILY.beef,
        pattern:
            /\bres\b|\bbistec\b|\barrachera\b|\bsirloin\b|\bfilete de res\b|\bbeef\b|\bsteak\b/
    },
    {
        family: PROTEIN_FAMILY.shellfish,
        pattern:
            /\bcamarones?\b|\bostiones?\b|\bpulpo\b|\bcalamar\b|\bjaiba\b|\bcangrejo\b|\bmejillones?\b|\bshrimp\b/
    },
    {
        family: PROTEIN_FAMILY.fish,
        pattern:
            /\bpescado\b|\bsalmon\b|\batun\b|\btrucha\b|\btilapia\b|\bhuachinango\b|\brobalo\b|\bbacalao\b|\bmerluza\b|\bmojarra\b|\bfish\b|\btuna\b/
    },
    {
        family: PROTEIN_FAMILY.soy,
        pattern: /\btofu\b|\bsoja\b|\bsoya\b|\btempeh\b/
    }
];

export function classifyProteinFamily(
    rawName: string,
    options?: {allowUnknown?: boolean}
): string | null {
    const normalized = normalizeProteinName(rawName);
    if (!normalized) {
        return null;
    }

    for (const rule of FAMILY_RULES) {
        if (rule.pattern.test(normalized)) {
            return rule.family;
        }
    }

    if (options?.allowUnknown) {
        return `other:${normalized}`;
    }

    return null;
}

function ingredientFoodGroupName(item: ProteinIngredientSource): string {
    return (
        item.foodGroupName ??
        item.ingredient?.food?.group?.name ??
        ''
    )
        .trim()
        .toUpperCase();
}

function ingredientProteinNames(item: ProteinIngredientSource): string[] {
    return [
        item.ingredient?.food?.name,
        item.name,
        item.ingredient?.name
    ].filter((name): name is string => Boolean(name?.trim()));
}

/**
 * Protein types present in a recipe. Only catalog items in PROTEINAS count,
 * so fruit, dressing, or herbs never occupy a protein slot.
 */
export function collectRecipeProteinFamilies(recipe: {
    ingredients?: ProteinIngredientSource[] | null;
}): string[] {
    const families = new Set<string>();

    for (const item of recipe.ingredients ?? []) {
        if (ingredientFoodGroupName(item) !== PROTEIN_FOOD_GROUP) {
            continue;
        }

        const names = ingredientProteinNames(item);
        const family =
            names
                .map(name =>
                    classifyProteinFamily(name, {allowUnknown: true})
                )
                .find(Boolean) ?? null;

        if (family) {
            families.add(family);
        }
    }

    return [...families];
}

/** Best-effort from stored portion names (no food group on meal slots). */
export function collectProteinFamiliesFromNames(
    names: Array<string | null | undefined>
): string[] {
    const families = new Set<string>();

    for (const name of names) {
        if (!name) {
            continue;
        }

        const family = classifyProteinFamily(name);
        if (family) {
            families.add(family);
        }
    }

    return [...families];
}

export function recipeSharesProteinFamily(
    recipe: {proteinFamilies?: readonly string[] | null},
    usedFamilies: ReadonlySet<string>
): boolean {
    if (usedFamilies.size === 0) {
        return false;
    }

    return (recipe.proteinFamilies ?? []).some(family =>
        usedFamilies.has(family)
    );
}

export function recipeHasProteinSource(recipe: {
    proteinFamilies?: readonly string[] | null;
}): boolean {
    return (recipe.proteinFamilies?.length ?? 0) > 0;
}

/**
 * 0 = unused protein type, 1 = protein already used today, 2 = no protein.
 * Used to sort replace-picker results without hiding protein-rich recipes.
 */
export function proteinVarietyRank(
    families: readonly string[],
    usedFamilies: ReadonlySet<string>
): number {
    const hasProtein = families.length > 0;
    if (hasProtein && !families.some(family => usedFamilies.has(family))) {
        return 0;
    }
    if (hasProtein) {
        return 1;
    }
    return 2;
}
