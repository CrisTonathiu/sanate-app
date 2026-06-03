import type {MealType as ProtocolMealType} from '@prisma/client';
import type {MealType as WhatsAppMealType} from '@/lib/config/meal-config';
import {PROTOCOL_MEAL_TIMES} from '@/lib/config/protocol-meal-times';
import {
    mapProtocolMealToSliderRecipe,
    sortProtocolMealsByPlanOrder,
    type MealSliderRecipe
} from '@/lib/patient-portal/protocol-meal-slider-map';
import {getActiveProtocolWeekIndex} from '@/lib/utils/protocol-week-plan';
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

export const WHATSAPP_MEAL_TO_PROTOCOL_TYPES: Record<
    WhatsAppMealType,
    ProtocolMealType[]
> = {
    smoothie: ['SMOOTHIE'],
    breakfast: ['BREAKFAST'],
    snack1: ['SNACK1', 'SNACK'],
    snack2: ['SNACK2', 'SNACK'],
    lunch: ['LUNCH'],
    dinner: ['DINNER'],
    drinks: ['DRINKS']
};

/** When the user says "colación" without 1/2, match any snack slot on the plan. */
export const GENERIC_SNACK_PROTOCOL_TYPES: ProtocolMealType[] = [
    'SNACK1',
    'SNACK2',
    'SNACK'
];

const WEEK_DAY_NAMES = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
] as const;

export type WeekDayMealPlan = {
    dayIndex: number;
    dayLabel: string;
    isToday: boolean;
    meals: MealSliderRecipe[];
};

async function loadActiveProtocolWeekDays(userId: string, now: Date = new Date()) {
    const patient = await prisma.patient.findUnique({
        where: {userId},
        select: {id: true}
    });

    if (!patient) {
        return {patient: null, days: []};
    }

    const protocol = await prisma.protocol.findFirst({
        where: {
            patientId: patient.id,
            status: 'ACTIVE'
        },
        orderBy: {createdAt: 'desc'},
        select: {
            weekCount: true,
            createdAt: true,
            weeksPlan: {
                orderBy: {weekNumber: 'asc'},
                select: {
                    weekNumber: true,
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
                                    },
                                    portions: {
                                        select: {
                                            actualCalories: true,
                                            actualProtein: true,
                                            actualCarbs: true,
                                            actualFat: true,
                                            ingredients: {
                                                select: {
                                                    ingredientName: true,
                                                    unit: true,
                                                    baseQuantity: true,
                                                    targetQuantity: true,
                                                    baseGrams: true,
                                                    targetGrams: true
                                                }
                                            }
                                        }
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
        return {
            patient,
            days: [],
            weekCount: 1,
            activeWeekIndex: 0
        };
    }

    const activeWeekIndex = getActiveProtocolWeekIndex(
        protocol.createdAt,
        protocol.weekCount,
        now
    );
    const activeWeek =
        protocol.weeksPlan.find(
            week => week.weekNumber === activeWeekIndex + 1
        ) ?? protocol.weeksPlan[0];

    return {
        patient,
        days: activeWeek?.days ?? [],
        weekCount: protocol.weekCount,
        activeWeekIndex
    };
}

export async function loadWeekProtocolMeals(
    userId: string,
    now: Date = new Date()
): Promise<{
    patient: {id: string} | null;
    weekPlan: WeekDayMealPlan[];
    protocolWeekCount: number;
    activeProtocolWeekIndex: number;
}> {
    const {patient, days, weekCount, activeWeekIndex} =
        await loadActiveProtocolWeekDays(userId, now);

    if (!patient) {
        return {
            patient: null,
            weekPlan: [],
            protocolWeekCount: 1,
            activeProtocolWeekIndex: 0
        };
    }

    const todayIndex = (now.getDay() + 6) % 7;

    const weekPlan = days
        .map(day => {
            const mealsWithRecipe = sortProtocolMealsByPlanOrder(
                day.meals.filter(
                    (
                        meal
                    ): meal is typeof meal & {
                        recipe: NonNullable<typeof meal.recipe>;
                    } => meal.recipe !== null
                )
            );

            const meals = mealsWithRecipe
                .map(meal =>
                    mapProtocolMealToSliderRecipe(
                        meal,
                        PROTOCOL_MEAL_TIMES[meal.mealType] ?? 'Cualquier hora'
                    )
                )
                .filter((meal): meal is MealSliderRecipe => Boolean(meal));

            return {
                dayIndex: day.dayIndex,
                dayLabel: WEEK_DAY_NAMES[day.dayIndex] ?? `Día ${day.dayIndex + 1}`,
                isToday: day.dayIndex === todayIndex,
                meals
            };
        })
        .filter(day => day.meals.length > 0)
        .sort((a, b) => a.dayIndex - b.dayIndex);

    return {
        patient,
        weekPlan,
        protocolWeekCount: weekCount,
        activeProtocolWeekIndex: activeWeekIndex
    };
}

export async function loadTodayProtocolMeals(userId: string, now: Date = new Date()) {
    const {patient, days} = await loadActiveProtocolWeekDays(userId, now);

    if (!patient) {
        return {patient: null, meals: []};
    }

    const todayIndex = (now.getDay() + 6) % 7;
    const selectedDay =
        days.find(day => day.dayIndex === todayIndex) ??
        days.find(day => day.dayIndex === 0) ??
        days[0];

    const mealsWithRecipe = sortProtocolMealsByPlanOrder(
        (selectedDay?.meals ?? []).filter(
            (meal): meal is typeof meal & {recipe: NonNullable<typeof meal.recipe>} =>
                meal.recipe !== null
        )
    );

    return {patient, meals: mealsWithRecipe};
}

export function protocolTypesForWhatsAppMeal(
    meal: WhatsAppMealType,
    normalizedText: string
): ProtocolMealType[] {
    const genericColacion =
        (meal === 'snack1' || meal === 'snack2') &&
        /\bcolacion\b/.test(normalizedText) &&
        !/\bcolacion\s*[12]\b/.test(normalizedText) &&
        !/\bsnack\s*[12]\b/.test(normalizedText);

    if (genericColacion) {
        return GENERIC_SNACK_PROTOCOL_TYPES;
    }

    return WHATSAPP_MEAL_TO_PROTOCOL_TYPES[meal];
}

export type PatientMealByTypeResult =
    | {success: true; meal: MealSliderRecipe}
    | {
          success: false;
          reason:
              | 'no_patient'
              | 'no_protocol'
              | 'no_meals_today'
              | 'meal_not_assigned';
      };

export async function getPatientTodayMealByType(
    userId: string,
    meal: WhatsAppMealType,
    normalizedText: string,
    now: Date = new Date()
): Promise<PatientMealByTypeResult> {
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

    const protocolTypes = protocolTypesForWhatsAppMeal(meal, normalizedText);
    const match = meals.find(m => protocolTypes.includes(m.mealType));

    if (!match) {
        return {success: false, reason: 'meal_not_assigned'};
    }

    const mapped = mapProtocolMealToSliderRecipe(
        match,
        PROTOCOL_MEAL_TIMES[match.mealType] ?? 'Cualquier hora'
    );

    if (!mapped) {
        return {success: false, reason: 'meal_not_assigned'};
    }

    return {success: true, meal: mapped};
}
