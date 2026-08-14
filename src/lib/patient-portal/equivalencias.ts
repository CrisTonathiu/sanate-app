export type EquivalenciasFoodRow = {
    name: string;
    groupName: string;
    isFree: boolean;
    maxPortionGrams: number | null;
    isDiscrete: boolean;
};

export type EquivalenciasLine =
    | {kind: 'note'; text: string}
    | {kind: 'subheader'; text: string}
    | {kind: 'item'; text: string};

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

function formatAmount(food: EquivalenciasFoodRow): string | null {
    if (food.maxPortionGrams == null || !Number.isFinite(food.maxPortionGrams)) {
        return null;
    }

    const grams = food.maxPortionGrams;
    const label =
        Number.isInteger(grams) ? String(grams) : grams.toFixed(1).replace(/\.0$/, '');

    return `${label} g`;
}

function formatItemLine(food: EquivalenciasFoodRow): string {
    const amount = formatAmount(food);
    return amount ? `${food.name} ${amount}` : food.name;
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
    foods: EquivalenciasFoodRow[]
): EquivalenciasColumn[] {
    return COLUMN_DEFS.flatMap(def => {
        const lines: EquivalenciasLine[] = [];
        const columnFoods = def.groups.flatMap(group =>
            foodsForGroup(foods, group.name)
        );

        if (columnFoods.length === 0) {
            return [];
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
                lines.push({kind: 'item', text: formatItemLine(food)});
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

export const EQUIVALENCIAS_PDF_COLORS = {
    title: '#3d6b4f',
    headerBg: '#7fad8a',
    headerText: '#ffffff',
    bodyBg: '#eef6ef',
    text: '#2f2f2f',
    note: '#4a6b55',
    border: '#c5d9c9'
} as const;
