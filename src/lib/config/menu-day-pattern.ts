import {DAYS_PER_WEEK} from '@/lib/utils/protocol-week-plan';

export const MENU_DAY_PATTERN_IDS = [
    'UNIQUE',
    'ABABAB',
    'ABCABC',
    'AABBAA'
] as const;

export type MenuDayPatternId = (typeof MENU_DAY_PATTERN_IDS)[number];

export const DEFAULT_MENU_DAY_PATTERN: MenuDayPatternId = 'UNIQUE';

const WEEKDAY_SHORT_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

type MenuDayPatternDefinition = {
    id: MenuDayPatternId;
    cycle: string;
    label: string;
    description: string;
};

export const MENU_DAY_PATTERNS: Record<
    MenuDayPatternId,
    MenuDayPatternDefinition
> = {
    UNIQUE: {
        id: 'UNIQUE',
        cycle: 'ABCDEFG',
        label: 'Cada día distinto',
        description: 'Siete menús diferentes en la semana.'
    },
    ABABAB: {
        id: 'ABABAB',
        cycle: 'ABABABA',
        label: 'ABABAB',
        description:
            'Lunes, miércoles, viernes y domingo iguales. Martes, jueves y sábado iguales.'
    },
    ABCABC: {
        id: 'ABCABC',
        cycle: 'ABCABCA',
        label: 'ABCABC',
        description: 'Tres menús distintos que rotan a lo largo de la semana.'
    },
    AABBAA: {
        id: 'AABBAA',
        cycle: 'AABBAAB',
        label: 'AABBAA',
        description:
            'Lunes y martes iguales, miércoles y jueves iguales, viernes y sábado iguales, domingo como el miércoles.'
    }
};

export function isMenuDayPatternId(value: unknown): value is MenuDayPatternId {
    return (
        typeof value === 'string' &&
        MENU_DAY_PATTERN_IDS.includes(value as MenuDayPatternId)
    );
}

export function parseMenuDayPatternId(value: unknown): MenuDayPatternId {
    return isMenuDayPatternId(value) ? value : DEFAULT_MENU_DAY_PATTERN;
}

export function expandMenuDayPattern(
    patternId: MenuDayPatternId,
    dayCount: number = DAYS_PER_WEEK
): string[] {
    const cycle = MENU_DAY_PATTERNS[patternId].cycle;
    return Array.from({length: dayCount}, (_, index) => cycle[index % cycle.length]);
}

export function uniqueMenuDayLetters(patternId: MenuDayPatternId): string[] {
    const letters: string[] = [];
    const seen = new Set<string>();

    for (const letter of expandMenuDayPattern(patternId)) {
        if (seen.has(letter)) {
            continue;
        }
        seen.add(letter);
        letters.push(letter);
    }

    return letters;
}

export function uniqueMenuDayCount(patternId: MenuDayPatternId): number {
    return uniqueMenuDayLetters(patternId).length;
}

export function menuDayPatternPreview(
    patternId: MenuDayPatternId
): Array<{day: string; slot: string}> {
    return expandMenuDayPattern(patternId).map((slot, index) => ({
        day: WEEKDAY_SHORT_LABELS[index] ?? String(index + 1),
        slot
    }));
}
