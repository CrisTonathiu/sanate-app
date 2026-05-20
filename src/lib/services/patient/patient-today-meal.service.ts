import type {MealType} from '@prisma/client';
import {PROTOCOL_MEAL_TIMES} from '@/lib/config/protocol-meal-times';
import {
    mapProtocolMealToSliderRecipe,
    sortProtocolMealsByPlanOrder,
    type MealSliderRecipe
} from '@/lib/patient-portal/protocol-meal-slider-map';
import {prisma} from '@/lib/prisma';

const protocolMealRecipeSelect = {
    id: true,
    title: true,
    imageUrl: true,
    ingredients: {
        select: {
            grams: true,
            quantity: true,
            unit: true,
            ingredient: {
                select: {
                    name: true,
                    food: {
                        select: {
                            caloriesPer100g: true,
                            proteinPer100g: true,
                            carbsPer100g: true,
                            fatPer100g: true
                        }
                    }
                }
            }
        }
    },
    extraIngredients: {
        select: {name: true}
    },
    steps: {
        select: {
            stepNumber: true,
            instruction: true
        }
    }
} as const;

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
    const patient = await prisma.patient.findUnique({
        where: {userId},
        select: {id: true}
    });

    if (!patient) {
        return {success: false, reason: 'no_patient'};
    }

    const protocol = await prisma.protocol.findFirst({
        where: {
            patientId: patient.id,
            status: 'ACTIVE'
        },
        orderBy: {createdAt: 'desc'},
        select: {
            weeksPlan: {
                orderBy: {weekNumber: 'asc'},
                take: 1,
                select: {
                    days: {
                        orderBy: {dayIndex: 'asc'},
                        select: {
                            dayIndex: true,
                            meals: {
                                select: {
                                    id: true,
                                    mealType: true,
                                    recipe: {
                                        select: protocolMealRecipeSelect
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!protocol) {
        return {success: false, reason: 'no_protocol'};
    }

    const days = protocol.weeksPlan[0]?.days ?? [];
    const todayIndex = (now.getDay() + 6) % 7;
    const selectedDay =
        days.find(day => day.dayIndex === todayIndex) ??
        days.find(day => day.dayIndex === 0) ??
        days[0];

    const mealsWithRecipe = sortProtocolMealsByPlanOrder(
        (selectedDay?.meals ?? []).filter(meal => meal.recipe !== null)
    );

    if (mealsWithRecipe.length === 0) {
        return {success: false, reason: 'no_meals_today'};
    }

    const currentMealType = pickCurrentMealType(
        mealsWithRecipe.map(meal => meal.mealType),
        now
    );

    const currentMeal =
        mealsWithRecipe.find(meal => meal.mealType === currentMealType) ??
        mealsWithRecipe[0];

    const mapped = mapProtocolMealToSliderRecipe(
        currentMeal,
        PROTOCOL_MEAL_TIMES[currentMeal.mealType] ?? 'Cualquier hora'
    );

    if (!mapped) {
        return {success: false, reason: 'no_meals_today'};
    }

    return {success: true, meal: mapped};
}
