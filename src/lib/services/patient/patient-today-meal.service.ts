import type {MealType} from '@prisma/client';
import {PROTOCOL_MEAL_TIMES} from '@/lib/config/protocol-meal-times';
import {
    mapProtocolMealToSliderRecipe,
    type MealSliderRecipe
} from '@/lib/patient-portal/protocol-meal-slider-map';
import {loadTodayProtocolMeals} from '@/lib/services/patient/patient-meal-by-type.service';
import {prisma} from '@/lib/prisma';

function minutesSinceMidnight(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
}

function parseMealTimeRange(
    label: string
): {startMinutes: number; endMinutes: number} | null {
    const match = label.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!match) {
        return null;
    }

    return {
        startMinutes: Number(match[1]) * 60 + Number(match[2]),
        endMinutes: Number(match[3]) * 60 + Number(match[4])
    };
}

/** Picks the meal slot for "now": in-window, else next, else last of the day. */
export function pickCurrentMealType(
    mealTypes: MealType[],
    now: Date = new Date(),
    timeByType: Record<string, string> = PROTOCOL_MEAL_TIMES
): MealType | null {
    if (mealTypes.length === 0) {
        return null;
    }

    const nowMinutes = minutesSinceMidnight(now);

    for (const mealType of mealTypes) {
        const range = parseMealTimeRange(timeByType[mealType] ?? '');
        if (
            range &&
            nowMinutes >= range.startMinutes &&
            nowMinutes < range.endMinutes
        ) {
            return mealType;
        }
    }

    for (const mealType of mealTypes) {
        const range = parseMealTimeRange(timeByType[mealType] ?? '');
        if (range && nowMinutes < range.startMinutes) {
            return mealType;
        }
    }

    return mealTypes[mealTypes.length - 1] ?? null;
}

export type PatientTodayMealResult =
    | {success: true; meal: MealSliderRecipe}
    | {
          success: false;
          reason: 'no_patient' | 'no_protocol' | 'no_meals_today';
      };

export async function getPatientCurrentTodayMeal(
    userId: string,
    now: Date = new Date()
): Promise<PatientTodayMealResult> {
    const {patient, meals} = await loadTodayProtocolMeals(userId, now);

    if (!patient) {
        return {success: false, reason: 'no_patient'};
    }

    if (meals.length === 0) {
        const hasProtocol = await prisma.protocol.findFirst({
            where: {patientId: patient.id, status: 'ACTIVE'},
            select: {id: true}
        });

        if (!hasProtocol) {
            return {success: false, reason: 'no_protocol'};
        }

        return {success: false, reason: 'no_meals_today'};
    }

    const currentMealType = pickCurrentMealType(
        meals.map(meal => meal.mealType),
        now
    );

    const currentMeal =
        meals.find(meal => meal.mealType === currentMealType) ?? meals[0];

    const mapped = mapProtocolMealToSliderRecipe(
        currentMeal,
        PROTOCOL_MEAL_TIMES[currentMeal.mealType] ?? 'Cualquier hora'
    );

    if (!mapped) {
        return {success: false, reason: 'no_meals_today'};
    }

    return {success: true, meal: mapped};
}
