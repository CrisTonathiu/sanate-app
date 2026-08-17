export type EquivalenciasFoodRow = {
    name: string;
    groupName: string;
    isFree: boolean;
    gramsPerEquivalent: number | null;
    equivalentDisplayText: string | null;
};

export type AssignedMenuPortion = {
    name: string;
    grams: number;
};

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

type AmountSnap = 'whole' | 'quarter';

const WHOLE_NUMBER_COLUMN_KEYS = new Set([
    'proteinas',
    'carbohidratos',
    'carbohidratos-complejos'
]);

function snapModeForColumn(columnKey: string): AmountSnap {
    return WHOLE_NUMBER_COLUMN_KEYS.has(columnKey) ? 'whole' : 'quarter';
}

function snapAmount(quantity: number, mode: AmountSnap): number {
    if (!Number.isFinite(quantity) || quantity <= 0) {
        return 0;
    }

    if (mode === 'whole') {
        const rounded = Math.round(quantity);
        return rounded === 0 ? 1 : rounded;
    }

    const snapped = Math.round(quantity * 4) / 4;
    return snapped === 0 ? 0.25 : snapped;
}

function formatSnappedQuantity(quantity: number, mode: AmountSnap): string {
    const snapped = snapAmount(quantity, mode);

    if (mode === 'whole') {
        return String(snapped);
    }

    const whole = Math.floor(snapped + 1e-9);
    const fourths = Math.round((snapped - whole) * 4);

    if (fourths === 4) {
        return String(whole + 1);
    }
    if (fourths === 0) {
        return String(whole);
    }

    const fractionLabel =
        fourths === 1 ? '1/4' : fourths === 2 ? '1/2' : '3/4';
    return whole > 0 ? `${whole} ${fractionLabel}` : fractionLabel;
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
        .match(/^(\d+(?:\.\d+)?|\d+\s*\/\s*\d+)\s+(.+)$/);
    if (!match) {
        return null;
    }

    const rawQuantity = match[1].replace(/\s+/g, '');
    let quantity: number;
    if (rawQuantity.includes('/')) {
        const [numerator, denominator] = rawQuantity.split('/').map(Number);
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

type ColumnScale = {
    factor: number;
    sourceName: string;
    sourceGrams: number;
};

function resolveColumnScale(
    columnFoods: EquivalenciasFoodRow[],
    assignedPortions: AssignedMenuPortion[]
): ColumnScale | null {
    if (assignedPortions.length === 0) {
        return null;
    }

    const foodsByName = new Map(
        columnFoods.map(food => [food.name.trim().toLowerCase(), food])
    );

    let best: ColumnScale | null = null;

    for (const portion of assignedPortions) {
        const food = foodsByName.get(portion.name.trim().toLowerCase());
        if (!food || food.isFree) {
            continue;
        }
        if (
            food.gramsPerEquivalent == null ||
            !Number.isFinite(food.gramsPerEquivalent) ||
            food.gramsPerEquivalent <= 0
        ) {
            continue;
        }
        if (!Number.isFinite(portion.grams) || portion.grams <= 0) {
            continue;
        }

        const factor = portion.grams / food.gramsPerEquivalent;
        if (!best || factor > best.factor) {
            best = {
                factor,
                sourceName: food.name,
                sourceGrams: portion.grams
            };
        }
    }

    return best;
}

function formatEquivalentAmount(
    food: EquivalenciasFoodRow,
    factor = 1,
    snapMode: AmountSnap = 'whole'
): string | null {
    const text = food.equivalentDisplayText?.trim();
    if (text) {
        const parsed = parseDisplayQuantity(text);
        if (!parsed) {
            return toPdfSafeText(text);
        }

        const scaledQuantity = parsed.quantity * factor;
        const snappedQuantity = snapAmount(scaledQuantity, snapMode);
        const quantityLabel = formatSnappedQuantity(scaledQuantity, snapMode);

        return `${quantityLabel} ${formatUnitLabel(snappedQuantity, parsed.unit)}`;
    }

    if (
        food.gramsPerEquivalent == null ||
        !Number.isFinite(food.gramsPerEquivalent)
    ) {
        return null;
    }

    return formatGrams(food.gramsPerEquivalent * factor);
}

function formatItemLine(
    food: EquivalenciasFoodRow,
    factor = 1,
    snapMode: AmountSnap = 'whole'
): {name: string; amount: string | null} {
    if (food.isFree) {
        return {name: food.name, amount: null};
    }

    return {
        name: food.name,
        amount: formatEquivalentAmount(food, factor, snapMode)
    };
}

function foodsForGroup(
    foods: EquivalenciasFoodRow[],
    groupName: string
): EquivalenciasFoodRow[] {
    return foods
        .filter(food => food.groupName.toUpperCase() === groupName)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function buildEquivalenciasColumns(
    foods: EquivalenciasFoodRow[],
    assignedPortions: AssignedMenuPortion[] = []
): EquivalenciasColumn[] {
    return COLUMN_DEFS.flatMap(def => {
        const lines: EquivalenciasLine[] = [];
        const columnFoods = def.groups.flatMap(group =>
            foodsForGroup(foods, group.name)
        );

        if (columnFoods.length === 0) {
            return [];
        }

        const scale = resolveColumnScale(columnFoods, assignedPortions);
        const factor = scale?.factor ?? 1;
        const snapMode = snapModeForColumn(def.key);

        if (scale) {
            lines.push({
                kind: 'note',
                text: `Base: ${formatGrams(scale.sourceGrams)} ${scale.sourceName}`
            });
        }

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
                    ...formatItemLine(
                        food,
                        food.isFree ? 1 : factor,
                        snapMode
                    )
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
