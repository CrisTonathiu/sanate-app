import {DayMeals, MealSlot} from '@/lib/interface/meal-interface';
import {formatDayLabelWithWeek} from '@/lib/utils/protocol-week-plan';
import {
    buildMealSlotFromProtocolMeal,
    buildProtocolMealPortionsCreateData
} from '@/lib/services/protocol/protocol-meal-portions.mapper';
import {prisma} from '@/lib/prisma';
import {MealType, Prisma} from '@prisma/client';

const WEEK_DAY_NAMES = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
] as const;

const MEAL_TYPE_BY_KEY: Record<
    Exclude<keyof DayMeals, 'day'>,
    MealType
> = {
    smoothie: 'SMOOTHIE',
    breakfast: 'BREAKFAST',
    snack1: 'SNACK1',
    snack2: 'SNACK2',
    lunch: 'LUNCH',
    dinner: 'DINNER',
    drinks: 'DRINKS'
};

const MEAL_TYPE_TO_KEY: Record<
    MealType,
    Exclude<keyof DayMeals, 'day'>
> = {
    SMOOTHIE: 'smoothie',
    BREAKFAST: 'breakfast',
    SNACK: 'snack1',
    SNACK1: 'snack1',
    SNACK2: 'snack2',
    LUNCH: 'lunch',
    DINNER: 'dinner',
    DRINKS: 'drinks'
};

export type WeekPlanPayload = Array<
    {
        day: string;
    } & Partial<Record<Exclude<keyof DayMeals, 'day'>, Partial<MealSlot>>>
>;

export type ActiveProtocolSummary = {
    protocolId: string;
    title: string;
    weekCount: number;
    weekPlan: DayMeals[];
};

export const protocolMealWithPortionsSelect = {
    mealType: true,
    recipeId: true,
    recipe: {
        select: {
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
                                    fatPer100g: true,
                                    density: true
                                }
                            }
                        }
                    }
                }
            },
            extraIngredients: {
                select: {
                    name: true
                }
            },
            steps: {
                select: {
                    stepNumber: true,
                    instruction: true
                }
            }
        }
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
} as const;

type ProtocolMealCreateInput = {
    mealType: MealType;
    recipeId: string;
    portions?: {
        create: NonNullable<
            ReturnType<typeof buildProtocolMealPortionsCreateData>
        >;
    };
};

function buildMealsCreateInput(
    weekPlan: WeekPlanPayload
): Prisma.ProtocolWeekCreateWithoutProtocolInput['days'] {
    return {
        create: weekPlan.map((day, dayIndex) => {
            const meals = (
                Object.keys(MEAL_TYPE_BY_KEY) as Array<
                    Exclude<keyof DayMeals, 'day'>
                >
            )
                .map(mealKey => {
                    const meal = day[mealKey];
                    if (!meal?.id) {
                        return null;
                    }

                    const portionsData = buildProtocolMealPortionsCreateData({
                        calories: meal.calories ?? 0,
                        protein: meal.protein ?? 0,
                        carbs: meal.carbs ?? 0,
                        fat: meal.fat ?? 0,
                        ingredientPortions: meal.ingredientPortions
                    });

                    return {
                        mealType: MEAL_TYPE_BY_KEY[mealKey],
                        recipeId: meal.id,
                        ...(portionsData
                            ? {
                                  portions: {
                                      create: portionsData
                                  }
                              }
                            : {})
                    } satisfies ProtocolMealCreateInput;
                })
                .filter(
                    (meal): meal is ProtocolMealCreateInput => Boolean(meal)
                );

            return {
                dayIndex,
                meals: {
                    create: meals
                }
            };
        })
    };
}

function splitWeekPlanIntoWeeks(
    weekPlan: WeekPlanPayload,
    weekCount: number
): WeekPlanPayload[] {
    const weeks: WeekPlanPayload[] = [];

    for (let weekIndex = 0; weekIndex < weekCount; weekIndex++) {
        weeks.push(weekPlan.slice(weekIndex * 7, weekIndex * 7 + 7));
    }

    return weeks;
}

function mapDaysToWeekPlan(
    days: Array<{
        dayIndex: number;
        meals: Array<
            Parameters<typeof buildMealSlotFromProtocolMeal>[0] & {
                mealType: MealType;
            }
        >;
    }>,
    weekNumber = 1,
    weekCount = 1
): DayMeals[] {
    return days.map(day => {
        const dayMeals: Partial<DayMeals> & {day: string} = {
            day: formatDayLabelWithWeek(
                WEEK_DAY_NAMES[day.dayIndex] ?? `Día ${day.dayIndex + 1}`,
                weekNumber,
                weekCount
            )
        };

        for (const meal of day.meals) {
            const slot = buildMealSlotFromProtocolMeal(meal);
            if (!slot) continue;

            const key = MEAL_TYPE_TO_KEY[meal.mealType];
            dayMeals[key] = slot;
        }

        return dayMeals as DayMeals;
    });
}

async function loadWeekPlanDays(protocolId: string): Promise<DayMeals[]> {
    const protocol = await prisma.protocol.findUnique({
        where: {id: protocolId},
        select: {
            weekCount: true,
            weeksPlan: {
                orderBy: {weekNumber: 'asc'},
                select: {
                    weekNumber: true,
                    days: {
                        orderBy: {dayIndex: 'asc'},
                        select: {
                            dayIndex: true,
                            meals: {
                                select: protocolMealWithPortionsSelect
                            }
                        }
                    }
                }
            }
        }
    });

    const weekCount = protocol?.weekCount ?? 1;

    return (
        protocol?.weeksPlan.flatMap(week =>
            mapDaysToWeekPlan(week.days, week.weekNumber, weekCount)
        ) ?? []
    );
}

export async function loadProtocolWeekPlanById(
    protocolId: string
): Promise<DayMeals[]> {
    return loadWeekPlanDays(protocolId);
}

export async function getActiveProtocolForPatient(
    patientId: string
): Promise<ActiveProtocolSummary | null> {
    const protocol = await prisma.protocol.findFirst({
        where: {
            patientId,
            status: 'ACTIVE'
        },
        orderBy: {createdAt: 'desc'},
        select: {
            id: true,
            title: true,
            weekCount: true,
            weeksPlan: {
                orderBy: {weekNumber: 'asc'},
                select: {
                    weekNumber: true,
                    days: {
                        orderBy: {dayIndex: 'asc'},
                        select: {
                            dayIndex: true,
                            meals: {
                                select: protocolMealWithPortionsSelect
                            }
                        }
                    }
                }
            }
        }
    });

    if (!protocol) {
        return null;
    }

    const weekCount = protocol.weekCount ?? 1;
    const weekPlan = protocol.weeksPlan.flatMap(week =>
        mapDaysToWeekPlan(week.days, week.weekNumber, weekCount)
    );

    return {
        protocolId: protocol.id,
        title: protocol.title,
        weekCount,
        weekPlan
    };
}

export async function loadProtocolWeekPlanForPatient(
    patientId: string
): Promise<DayMeals[]> {
    const active = await getActiveProtocolForPatient(patientId);
    return active?.weekPlan ?? [];
}

async function replaceProtocolWeekPlan(
    protocolId: string,
    weekPlan: WeekPlanPayload,
    weekCount: number,
    tx: Prisma.TransactionClient
) {
    await tx.protocolMeal.deleteMany({
        where: {
            day: {
                week: {
                    protocolId
                }
            }
        }
    });

    await tx.protocolDay.deleteMany({
        where: {
            week: {
                protocolId
            }
        }
    });

    await tx.protocolWeek.deleteMany({
        where: {protocolId}
    });

    const weekChunks = splitWeekPlanIntoWeeks(weekPlan, weekCount);

    for (const [index, chunk] of weekChunks.entries()) {
        if (chunk.length === 0) continue;

        await tx.protocolWeek.create({
            data: {
                protocolId,
                weekNumber: index + 1,
                days: buildMealsCreateInput(chunk)
            }
        });
    }
}

export async function createPatientProtocol(input: {
    patientId: string;
    title: string;
    weekCount?: number;
    weekPlan: WeekPlanPayload;
    affiliateLinks?: Prisma.InputJsonValue;
}) {
    const weekCount = input.weekCount ?? 1;
    const weekChunks = splitWeekPlanIntoWeeks(input.weekPlan, weekCount);

    const protocol = await prisma.protocol.create({
        data: {
            title: input.title,
            weekCount,
            patientId: input.patientId,
            status: 'ACTIVE',
            affiliateLinks: input.affiliateLinks,
            weeksPlan: {
                create: weekChunks
                    .filter(chunk => chunk.length > 0)
                    .map((chunk, index) => ({
                        weekNumber: index + 1,
                        days: buildMealsCreateInput(chunk)
                    }))
            }
        },
        select: {
            id: true,
            title: true
        }
    });

    return {
        protocolId: protocol.id,
        title: protocol.title,
        weekPlan: await loadProtocolWeekPlanById(protocol.id)
    };
}

export async function updatePatientProtocol(input: {
    protocolId: string;
    title: string;
    weekCount?: number;
    weekPlan: WeekPlanPayload;
    affiliateLinks?: Prisma.InputJsonValue;
}) {
    await prisma.$transaction(async tx => {
        await tx.protocol.update({
            where: {id: input.protocolId},
            data: {
                title: input.title,
                weekCount: input.weekCount ?? 1,
                affiliateLinks: input.affiliateLinks
            }
        });

        await replaceProtocolWeekPlan(
            input.protocolId,
            input.weekPlan,
            input.weekCount ?? 1,
            tx
        );
    });

    const protocol = await prisma.protocol.findUnique({
        where: {id: input.protocolId},
        select: {id: true, title: true}
    });

    if (!protocol) {
        throw new Error('Protocol not found after update');
    }

    return {
        protocolId: protocol.id,
        title: protocol.title,
        weekPlan: await loadProtocolWeekPlanById(protocol.id)
    };
}
