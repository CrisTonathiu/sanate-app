export type EquivalenciasFoodRow = {
    name: string;
    groupName: string;
    isFree: boolean;
    /** Counted in whole pieces (Porción Discreta). */
    isDiscrete?: boolean;
    allowPieceFractions?: boolean;
    gramsPerEquivalent: number | null;
    equivalentDisplayText: string | null;
};

export type AssignedMenuPortion = {
    name: string;
    grams: number;
};

/** Catalog foods and grams of one protocol meal (one day's slot). */
export type AssignedMenuMeal = AssignedMenuPortion[];

export type EquivalenciasLine =
    | {kind: 'note'; text: string}
    | {kind: 'subheader'; text: string}
    | {kind: 'item'; name: string; amount: string | null};

export type EquivalenciasColumn = {
    key: string;
    title: string;
    lines: EquivalenciasLine[];
};

const COLUMN_DEFS: Array<{
    key: string;
    title: string;
    groups: Array<{
        name: string;
        subheader?: string;
        noteWhenFree?: string;
    }>;
    headerNote?: (foods: EquivalenciasFoodRow[]) => string | null;
}> = [
    {
        key: 'proteinas',
        title: 'PROTEINAS',
        groups: [{name: 'PROTEINAS'}, {name: 'LACTEOS'}]
    },
    {
        key: 'carbohidratos',
        title: 'CARBOHIDRATOS',
        groups: [
            {name: 'CARBOHIDRATOS'},
            {
                name: 'FRUTOS ROJOS',
                noteWhenFree: 'Libres'
            },
            {name: 'FRUTAS', subheader: 'FRUTAS'}
        ],
        headerNote: () => 'TODAS LAS FRUTAS'
    },
    {
        key: 'carbohidratos-complejos',
        title: 'CARBOHIDRATOS COMPLEJOS SALUDABLES',
        groups: [
            {name: 'CEREALES', subheader: 'CEREALES'},
            {name: 'LEGUMINOSAS', subheader: 'LEGUMINOSAS'},
            {name: 'TUBERCULOS', subheader: 'OTROS'}
        ],
        headerNote: () => 'TODOS LOS CEREALES Y LEGUMINOSAS'
    },
    {
        key: 'lipidos',
        title: 'LIPIDOS (GRASAS)',
        groups: [
            {name: 'GRASAS'},
            {name: 'FRUTOS SECOS', subheader: 'FRUTOS SECOS'},
            {name: 'SEMILLAS', subheader: 'SEMILLAS'}
        ]
    },
    {
        key: 'verduras',
        title: 'VERDURAS',
        groups: [{name: 'VEGETALES'}],
        headerNote: foods =>
            foods.some(f => f.isFree) ? 'TODAS SON LIBRES' : null
    }
];

const PDF_SAFE_FRACTIONS: Record<string, string> = {
    '⅓': '1/3',
    '¼': '1/4',
    '½': '1/2',
    '¾': '3/4',
    '⅕': '1/5',
    '⅖': '2/5',
    '⅗': '3/5',
    '⅘': '4/5',
    '⅙': '1/6',
    '⅚': '5/6',
    '⅛': '1/8',
    '⅜': '3/8',
    '⅝': '5/8',
    '⅞': '7/8',
    '⅔': '2/3'
};

function toPdfSafeText(text: string): string {
    return text.replace(/[⅓¼½¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞⅔]/g, char => {
        return PDF_SAFE_FRACTIONS[char] ?? char;
    });
}

function formatGrams(grams: number): string {
    const rounded = Math.round(grams);
    return `${rounded} g`;
}

/** Denominators a household measure may use (1/2, 1/3, 2/3, 3/4, 1/8 ...). */
const MEASURE_DENOMINATORS = [2, 3, 4, 6, 8];

/** "1", "2/3", "1 1/2"; amounts that fit no denominator snap to quarters. */
function formatMeasureQuantity(quantity: number): string {
    const whole = Math.floor(quantity + 1e-6);
    const rest = quantity - whole;
    if (rest < 1e-6) {
        return String(whole);
    }

    for (const denominator of MEASURE_DENOMINATORS) {
        const numerator = Math.round(rest * denominator);
        if (
            numerator > 0 &&
            numerator < denominator &&
            Math.abs(numerator / denominator - rest) < 1e-6
        ) {
            const fraction = `${numerator}/${denominator}`;
            return whole > 0 ? `${whole} ${fraction}` : fraction;
        }
    }

    return formatMeasureQuantity(Math.max(0.25, Math.round(quantity * 4) / 4));
}

/**
 * Rounds a number of SMAE equivalents the way the plan hands them out
 * (see docs/equivalencias.md): down to the whole or half below it, except
 * within 0.10 of the next whole, which rounds up.
 * 3.2 → 3, 3.6 → 3.5, 3.75 → 3.5, 3.9 → 4. Never below 1/2 equivalent.
 */
export function roundEquivalents(equivalents: number): number {
    if (!Number.isFinite(equivalents) || equivalents <= 0) {
        return 0;
    }

    const whole = Math.floor(equivalents);
    const rest = equivalents - whole;
    // Epsilon: 3.9 - 3 is 0.8999… in floating point.
    const rounded =
        rest >= 0.9 - 1e-9 ? whole + 1 : rest >= 0.5 - 1e-9 ? whole + 0.5 : whole;

    return Math.max(0.5, rounded);
}

const UNIT_FORMS: Record<string, {one: string; other: string}> = {
    pza: {one: 'pza', other: 'pzas'},
    pzas: {one: 'pza', other: 'pzas'},
    pieza: {one: 'pza', other: 'pzas'},
    piezas: {one: 'pza', other: 'pzas'},
    taza: {one: 'taza', other: 'tazas'},
    tazas: {one: 'taza', other: 'tazas'},
    lata: {one: 'lata', other: 'latas'},
    latas: {one: 'lata', other: 'latas'},
    cdita: {one: 'cdita', other: 'cditas'},
    cditas: {one: 'cdita', other: 'cditas'},
    cda: {one: 'cda', other: 'cdas'},
    cdas: {one: 'cda', other: 'cdas'},
    rebanada: {one: 'rebanada', other: 'rebanadas'},
    rebanadas: {one: 'rebanada', other: 'rebanadas'}
};

function formatUnitLabel(quantity: number, unit: string): string {
    const forms = UNIT_FORMS[unit.trim().toLowerCase()];
    if (!forms) {
        return unit;
    }
    return quantity > 1.001 ? forms.other : forms.one;
}

function parseDisplayQuantity(
    text: string
): {quantity: number; unit: string} | null {
    const match = toPdfSafeText(text)
        .trim()
        .match(
            /^(\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d+(?:\.\d+)?)\s+(.+)$/
        );
    if (!match) {
        return null;
    }

    const rawQuantity = match[1].trim();
    let quantity: number;

    const mixedMatch = rawQuantity.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixedMatch) {
        const whole = Number(mixedMatch[1]);
        const numerator = Number(mixedMatch[2]);
        const denominator = Number(mixedMatch[3]);
        if (!denominator) {
            return null;
        }
        quantity = whole + numerator / denominator;
    } else if (rawQuantity.includes('/')) {
        const [numerator, denominator] = rawQuantity
            .replace(/\s+/g, '')
            .split('/')
            .map(Number);
        if (!denominator) {
            return null;
        }
        quantity = numerator / denominator;
    } else {
        quantity = Number(rawQuantity);
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
        return null;
    }

    return {quantity, unit: match[2].trim()};
}

/**
 * Amount of `equivalents` SMAE equivalents of a food: its household measure
 * times the count ("1/3 lata" × 3 = "1 lata"), or grams when it has none.
 */
function formatItemLine(
    food: EquivalenciasFoodRow,
    equivalents: number
): {name: string; amount: string | null} {
    if (food.isFree) {
        return {name: food.name, amount: null};
    }

    const measure = formatEquivalentsMeasure(food, equivalents);
    if (measure) {
        return {name: food.name, amount: measure};
    }

    const grams = food.gramsPerEquivalent;
    return {
        name: food.name,
        amount:
            grams != null && Number.isFinite(grams) && grams > 0
                ? formatGrams(grams * equivalents)
                : null
    };
}

/**
 * PDF column a food group belongs to. Foods in the same column are
 * interchangeable (e.g. papa ↔ arroz, fresa ↔ manzana).
 */
export function equivalenciasColumnKeyForGroup(
    groupName: string
): string | null {
    const normalized = groupName.trim().toUpperCase();
    const def = COLUMN_DEFS.find(column =>
        column.groups.some(group => group.name === normalized)
    );
    return def?.key ?? null;
}

/**
 * Equivalents actually served of a food. Whole-piece foods (huevo) can't be
 * split, so their pieces round with the same rule as equivalents (only the
 * last 0.10 rounds up; 3.5 pzas → 3) and never below one piece.
 */
export function equivalentsForFood(
    food: Pick<
        EquivalenciasFoodRow,
        'equivalentDisplayText' | 'isDiscrete' | 'allowPieceFractions'
    >,
    equivalents: number
): number {
    if (!food.isDiscrete || food.allowPieceFractions) {
        return equivalents;
    }

    const parsed = parseDisplayQuantity(food.equivalentDisplayText ?? '');
    if (!parsed || UNIT_FORMS[parsed.unit.toLowerCase()]?.one !== 'pza') {
        return equivalents;
    }

    const pieces = Math.max(
        1,
        Math.floor(parsed.quantity * equivalents + 0.1 + 1e-9)
    );
    return pieces / parsed.quantity;
}

/**
 * Household measure of `equivalents` SMAE equivalents: exactly that many
 * times the food's line in the equivalencias PDF (3 × "1/3 lata" = "1 lata").
 * Null when the food has no display text to scale.
 */
export function formatEquivalentsMeasure(
    food: Pick<
        EquivalenciasFoodRow,
        'equivalentDisplayText' | 'isDiscrete' | 'allowPieceFractions'
    >,
    equivalents: number
): string | null {
    const text = food.equivalentDisplayText?.trim();
    if (!text || !(equivalents > 0)) {
        return null;
    }

    const parsed = parseDisplayQuantity(text);
    if (!parsed) {
        return equivalents === 1 ? toPdfSafeText(text) : null;
    }

    const quantity = parsed.quantity * equivalentsForFood(food, equivalents);
    return `${formatMeasureQuantity(quantity)} ${formatUnitLabel(quantity, parsed.unit)}`;
}

function hasGramsPerEquivalent(
    food: EquivalenciasFoodRow
): food is EquivalenciasFoodRow & {gramsPerEquivalent: number} {
    return (
        food.gramsPerEquivalent != null &&
        Number.isFinite(food.gramsPerEquivalent) &&
        food.gramsPerEquivalent > 0
    );
}

/**
 * Mean SMAE equivalents per meal for a column across the whole protocol.
 * Meals with no food from the column are left out so they don't pull the
 * mean down. Null when the plan never serves the column.
 */
function meanColumnEquivalents(
    columnFoods: EquivalenciasFoodRow[],
    assignedMeals: AssignedMenuMeal[]
): number | null {
    const foodsByName = new Map(
        columnFoods.map(food => [food.name.trim().toLowerCase(), food])
    );

    const mealEquivalents: number[] = [];

    for (const meal of assignedMeals) {
        let equivalents = 0;

        for (const portion of meal) {
            const food = foodsByName.get(portion.name.trim().toLowerCase());
            if (!food || food.isFree || !hasGramsPerEquivalent(food)) {
                continue;
            }
            if (!Number.isFinite(portion.grams) || portion.grams <= 0) {
                continue;
            }

            equivalents += portion.grams / food.gramsPerEquivalent;
        }

        if (equivalents > 0) {
            mealEquivalents.push(equivalents);
        }
    }

    if (mealEquivalents.length === 0) {
        return null;
    }

    return (
        mealEquivalents.reduce((sum, value) => sum + value, 0) /
        mealEquivalents.length
    );
}

function foodsForGroup(
    foods: EquivalenciasFoodRow[],
    groupName: string
): EquivalenciasFoodRow[] {
    return foods
        .filter(food => food.groupName.toUpperCase() === groupName)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/**
 * Free foods are listed without an amount on purpose; any other food needs
 * equivalence data or there is nothing useful to show for it.
 */
function hasEquivalenceData(food: EquivalenciasFoodRow): boolean {
    if (food.isFree) {
        return true;
    }

    if (food.equivalentDisplayText?.trim()) {
        return true;
    }

    return (
        food.gramsPerEquivalent != null &&
        Number.isFinite(food.gramsPerEquivalent) &&
        food.gramsPerEquivalent > 0
    );
}

/**
 * Every food in a column gets the same number of SMAE equivalents: the
 * plan's mean per meal for that column, rounded with roundEquivalents. So
 * every line in a column is interchangeable. Without plan meals each food
 * shows a single equivalent. See docs/equivalencias.md.
 */
export function buildEquivalenciasColumns(
    allFoods: EquivalenciasFoodRow[],
    assignedMeals: AssignedMenuMeal[] = []
): EquivalenciasColumn[] {
    const foods = allFoods.filter(hasEquivalenceData);

    return COLUMN_DEFS.flatMap(def => {
        const lines: EquivalenciasLine[] = [];
        const columnFoods = def.groups.flatMap(group =>
            foodsForGroup(foods, group.name)
        );

        if (columnFoods.length === 0) {
            return [];
        }

        const mean = meanColumnEquivalents(columnFoods, assignedMeals);
        const equivalents = mean != null ? roundEquivalents(mean) : 1;

        const headerNote = def.headerNote?.(columnFoods) ?? null;
        if (headerNote) {
            lines.push({kind: 'note', text: headerNote});
        }

        for (const group of def.groups) {
            const groupFoods = foodsForGroup(foods, group.name);
            if (groupFoods.length === 0) {
                continue;
            }

            if (group.subheader) {
                lines.push({kind: 'subheader', text: group.subheader});
            }

            const allFree = groupFoods.every(food => food.isFree);
            if (group.noteWhenFree && allFree) {
                lines.push({kind: 'note', text: group.noteWhenFree});
            } else if (
                group.noteWhenFree &&
                groupFoods.some(food => food.isFree)
            ) {
                const freeNames = groupFoods
                    .filter(food => food.isFree)
                    .map(food => food.name.toLowerCase());
                lines.push({
                    kind: 'note',
                    text: `${group.noteWhenFree}: ${freeNames.join(', ')}`
                });
            }

            for (const food of groupFoods) {
                lines.push({
                    kind: 'item',
                    ...formatItemLine(food, equivalents)
                });
            }
        }

        return [
            {
                key: def.key,
                title: def.title,
                lines
            }
        ];
    });
}

const EQUIVALENCIAS_CHARS_PER_LINE = 30;
export const EQUIVALENCIAS_PAGE_BODY_HEIGHT_PT = 780;

function estimateLineHeightPt(line: EquivalenciasLine): number {
    const text =
        line.kind === 'item'
            ? `${line.name} ${line.amount ?? ''}`
            : line.text;
    const wrappedLines = Math.max(
        1,
        Math.ceil(text.length / EQUIVALENCIAS_CHARS_PER_LINE)
    );

    if (line.kind === 'note') {
        return 4 + wrappedLines * 9;
    }
    if (line.kind === 'subheader') {
        return 10 + wrappedLines * 9;
    }
    return wrappedLines * 11.5;
}

export function paginateEquivalenciasColumns(
    columns: EquivalenciasColumn[],
    maxBodyHeightPt = EQUIVALENCIAS_PAGE_BODY_HEIGHT_PT
): EquivalenciasColumn[][] {
    if (columns.length === 0) {
        return [];
    }

    const columnChunks = columns.map(column => {
        const chunks: EquivalenciasLine[][] = [];
        let current: EquivalenciasLine[] = [];
        let height = 0;

        for (const line of column.lines) {
            const lineHeight = estimateLineHeightPt(line);
            if (current.length > 0 && height + lineHeight > maxBodyHeightPt) {
                chunks.push(current);
                current = [];
                height = 0;
            }
            current.push(line);
            height += lineHeight;
        }

        if (current.length > 0 || chunks.length === 0) {
            chunks.push(current);
        }

        return chunks;
    });

    const pageCount = Math.max(...columnChunks.map(chunks => chunks.length), 1);

    return Array.from({length: pageCount}, (_, pageIndex) =>
        columns.map((column, columnIndex) => ({
            ...column,
            lines: columnChunks[columnIndex][pageIndex] ?? []
        }))
    );
}

export const EQUIVALENCIAS_PDF_COLORS = {
    title: '#3d6b4f',
    headerBg: '#7fad8a',
    headerText: '#ffffff',
    bodyBg: '#eef6ef',
    text: '#2f2f2f',
    note: '#4a6b55',
    border: '#c5d9c9'
} as const;
