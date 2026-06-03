import type {DayMeals} from '@/lib/interface/meal-interface';

export const DAYS_PER_WEEK = 7;
export const MAX_PROTOCOL_WEEKS = 4;

const WEEK_IN_DAY_LABEL = /\(Semana\s+(\d+)\)\s*$/i;

/** Parses "Lunes (Semana 2)" → week index 1; plain "Lunes" → 0. */
export function parseWeekIndexFromDayLabel(dayLabel: string): number {
    const match = dayLabel.match(WEEK_IN_DAY_LABEL);
    if (!match) {
        return 0;
    }

    const weekNumber = Number.parseInt(match[1], 10);
    return Number.isFinite(weekNumber) && weekNumber > 0 ? weekNumber - 1 : 0;
}

export function formatDayLabelWithWeek(
    dayName: string,
    weekNumber: number,
    weekCount: number
): string {
    return weekCount > 1 ? `${dayName} (Semana ${weekNumber})` : dayName;
}

export function countWeeksInPlan(weekPlan: DayMeals[]): number {
    if (weekPlan.length === 0) {
        return 1;
    }

    return Math.max(
        1,
        Math.ceil(weekPlan.length / DAYS_PER_WEEK),
        ...weekPlan.map(day => parseWeekIndexFromDayLabel(day.day) + 1)
    );
}

export function getDaysForWeekIndex(
    weekPlan: DayMeals[],
    weekIndex: number
): DayMeals[] {
    const byLabel = weekPlan.filter(
        day => parseWeekIndexFromDayLabel(day.day) === weekIndex
    );

    if (byLabel.length > 0) {
        return byLabel;
    }

    return weekPlan.slice(
        weekIndex * DAYS_PER_WEEK,
        weekIndex * DAYS_PER_WEEK + DAYS_PER_WEEK
    );
}

export function dayBelongsToWeek(dayLabel: string, weekIndex: number): boolean {
    return parseWeekIndexFromDayLabel(dayLabel) === weekIndex;
}

/** Which protocol week the patient is on (0-based), from plan start date. */
export function getActiveProtocolWeekIndex(
    planStart: Date,
    weekCount: number,
    now: Date = new Date()
): number {
    if (weekCount <= 1) {
        return 0;
    }

    const msPerWeek = DAYS_PER_WEEK * 24 * 60 * 60 * 1000;
    const elapsedWeeks = Math.floor(
        Math.max(0, now.getTime() - planStart.getTime()) / msPerWeek
    );

    return Math.min(elapsedWeeks, weekCount - 1);
}
