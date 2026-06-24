import type {
    ShoppingCategory,
    ShoppingItem,
    WeeklyShoppingList
} from '@/lib/patient-portal/shopping-list.types';

export type ShoppingListPdfSection = {
    title: string;
    items: ShoppingItem[];
};

export type ShoppingListPdfColumn = {
    sections: ShoppingListPdfSection[];
};

const FRUIT_NAME_PATTERN =
    /\b(sand[ií]a|papaya|pl[aá]tan[oa]|manzana|pera|naranja|mandarina|fresa|zarzamora|ar[aá]ndano|uva|mel[oó]n|pi[nñ]a|mango|guayaba|kiwi|ciruela|durazno|tuna|frambuesa|maracuy[aá]|lichi|higo|coco)\b/i;

const CATEGORY_SECTION_ORDER: Array<{
    key: string;
    title: string;
    matches: (item: ShoppingItem) => boolean;
}> = [
    {
        key: 'fruits',
        title: 'FRUTAS',
        matches: item =>
            item.category === 'produce' && FRUIT_NAME_PATTERN.test(item.name)
    },
    {
        key: 'vegetables',
        title: 'VERDURAS',
        matches: item =>
            item.category === 'produce' && !FRUIT_NAME_PATTERN.test(item.name)
    },
    {
        key: 'protein',
        title: 'PROTEÍNAS',
        matches: item => item.category === 'protein'
    },
    {
        key: 'dairy',
        title: 'LÁCTEOS',
        matches: item => item.category === 'dairy'
    },
    {
        key: 'grains',
        title: 'CEREALES Y GRANOS',
        matches: item => item.category === 'grains'
    },
    {
        key: 'other',
        title: 'OTROS',
        matches: item => item.category === 'other'
    }
];

function sectionWeight(section: ShoppingListPdfSection) {
    return section.items.length + 1.5;
}

export function buildShoppingListPdfSections(
    items: ShoppingItem[]
): ShoppingListPdfSection[] {
    const sections: ShoppingListPdfSection[] = [];

    for (const definition of CATEGORY_SECTION_ORDER) {
        const sectionItems = items.filter(definition.matches);
        if (sectionItems.length === 0) {
            continue;
        }

        sections.push({
            title: definition.title,
            items: sectionItems.sort((a, b) =>
                a.name.localeCompare(b.name, 'es')
            )
        });
    }

    return sections;
}

export function distributeSectionsIntoColumns(
    sections: ShoppingListPdfSection[],
    columnCount = 4
): ShoppingListPdfColumn[] {
    const columns: ShoppingListPdfColumn[] = Array.from(
        {length: columnCount},
        () => ({sections: []})
    );
    const columnWeights = Array.from({length: columnCount}, () => 0);

    const sortedSections = [...sections].sort(
        (a, b) => b.items.length - a.items.length
    );

    for (const section of sortedSections) {
        const lightestColumn = columnWeights.indexOf(
            Math.min(...columnWeights)
        );
        columns[lightestColumn].sections.push(section);
        columnWeights[lightestColumn] += sectionWeight(section);
    }

    return columns;
}

export function getShoppingListPdfTypography(itemCount: number) {
    if (itemCount > 65) {
        return {itemFontSize: 5.5, titleFontSize: 6.5, sectionGap: 5, itemGap: 1.5};
    }
    if (itemCount > 45) {
        return {itemFontSize: 6, titleFontSize: 7, sectionGap: 6, itemGap: 2};
    }
    if (itemCount > 30) {
        return {itemFontSize: 6.5, titleFontSize: 7.5, sectionGap: 7, itemGap: 2};
    }

    return {itemFontSize: 7, titleFontSize: 8, sectionGap: 8, itemGap: 2.5};
}

export function buildShoppingListPdfLayout(week: WeeklyShoppingList) {
    const sections = buildShoppingListPdfSections(week.items);
    const columns = distributeSectionsIntoColumns(sections);
    const typography = getShoppingListPdfTypography(week.items.length);

    return {sections, columns, typography};
}

export function formatShoppingListItemLine(item: ShoppingItem) {
    return `${item.name} — ${item.quantity}`;
}

export const SHOPPING_LIST_PDF_COLORS = {
    border: '#3d8b5a',
    title: '#3d8b5a',
    category: '#1a5f9e',
    text: '#2b2b2b',
    checkbox: '#8a8a8a',
    subtitle: '#555555'
} as const;
