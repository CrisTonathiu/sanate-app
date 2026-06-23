export type MealTimeRange = {
    startMinutes: number;
    endMinutes: number;
};

export type DayScheduleState = 'today' | 'past' | 'future';

export function minutesSinceMidnight(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
}

export function parseMealTimeRange(label: string): MealTimeRange | null {
    const match = label.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!match) {
        return null;
    }

    return {
        startMinutes: Number(match[1]) * 60 + Number(match[2]),
        endMinutes: Number(match[3]) * 60 + Number(match[4])
    };
}

/** Progress (0–100) from meal schedule; null when no meals have a time range. */
export function calculateMealScheduleProgress(
    meals: {time: string}[],
    now: Date,
    dayScheduleState: DayScheduleState
): number | null {
    const timedMeals = meals
        .map(meal => parseMealTimeRange(meal.time))
        .filter((range): range is MealTimeRange => range !== null);

    if (timedMeals.length === 0) {
        return null;
    }

    if (dayScheduleState === 'past') {
        return 100;
    }

    if (dayScheduleState === 'future') {
        return 0;
    }

    const nowMinutes = minutesSinceMidnight(now);
    let totalProgress = 0;

    for (const range of timedMeals) {
        if (nowMinutes >= range.endMinutes) {
            totalProgress += 1;
        } else if (nowMinutes >= range.startMinutes) {
            const duration = range.endMinutes - range.startMinutes;
            totalProgress +=
                duration > 0
                    ? (nowMinutes - range.startMinutes) / duration
                    : 1;
        }
    }

    return Math.min((totalProgress / timedMeals.length) * 100, 100);
}
