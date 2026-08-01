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

export type ProtocolRecommendations = {
    generalRecommendations: string | null;
    tips: string | null;
    hydrationRecommendations: string | null;
    supplementRecommendations: string | null;
};

export type ActiveProtocolSummary = {
    protocolId: string;
    title: string;
    weekCount: number;
    createdAt: string;
    weekPlan: DayMeals[];
} & ProtocolRecommendations;

export type PatientProtocolListItem = {
    id: string;
    title: string;
    weekCount: number;
    status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'DRAFT';
    createdAt: string;
    generalRecommendations: string | null;
    tips: string | null;
    hydrationRecommendations: string | null;
    supplementRecommendations: string | null;
};

export type PatientProtocolDetail = ActiveProtocolSummary & {
    status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'DRAFT';
    createdAt: string;
};

export type ProtocolDraftSnapshot = {
    currentStep: number;
    reason: string;
    diagnosis: string;
    notes: string;
    planCalories: number;
    weekCount: number;
    macroPercents: Record<string, number>;
    enabledMeals: Record<string, boolean>;
    mealPercentages: Record<string, number>;
    macroMealPercentages: Record<string, Record<string, number>>;
    weekPlan: DayMeals[];
    affiliateLinks: unknown[];
    generalRecommendations: string;
    tips: string;
    hydrationRecommendations: string;
    supplementRecommendations: string;
    selectedTemplateName: string | null;
};

export type ProtocolDraftSummary = {
    protocolId: string;
    title: string;
    weekCount: number;
    createdAt: string;
    updatedAt: string;
    draftSnapshot: ProtocolDraftSnapshot;
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
                                    density: true,
                                    isDiscrete: true
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
            targetCalories: true,
            targetProtein: true,
            targetCarbs: true,
            targetFat: true,
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

export async function listProtocolsForPatient(
    patientId: string
): Promise<PatientProtocolListItem[]> {
    const protocols = await prisma.protocol.findMany({
        where: {
            patientId,
            status: {not: 'DRAFT'}
        },
        orderBy: {createdAt: 'desc'},
        select: {
            id: true,
            title: true,
            weekCount: true,
            status: true,
            createdAt: true,
            generalRecommendations: true,
            tips: true,
            hydrationRecommendations: true,
            supplementRecommendations: true
        }
    });

    return protocols.map(protocol => ({
        id: protocol.id,
        title: protocol.title,
        weekCount: protocol.weekCount,
        status: protocol.status,
        createdAt: protocol.createdAt.toISOString(),
        generalRecommendations: protocol.generalRecommendations,
        tips: protocol.tips,
        hydrationRecommendations: protocol.hydrationRecommendations,
        supplementRecommendations: protocol.supplementRecommendations
    }));
}

export async function getProtocolDetailForPatient(
    patientId: string,
    protocolId: string
): Promise<PatientProtocolDetail | null> {
    const protocol = await prisma.protocol.findFirst({
        where: {
            id: protocolId,
            patientId
        },
        select: {
            id: true,
            title: true,
            weekCount: true,
            status: true,
            createdAt: true,
            generalRecommendations: true,
            tips: true,
            hydrationRecommendations: true,
            supplementRecommendations: true,
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
        status: protocol.status,
        createdAt: protocol.createdAt.toISOString(),
        weekPlan,
        generalRecommendations: protocol.generalRecommendations,
        tips: protocol.tips,
        hydrationRecommendations: protocol.hydrationRecommendations,
        supplementRecommendations: protocol.supplementRecommendations
    };
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
            createdAt: true,
            generalRecommendations: true,
            tips: true,
            hydrationRecommendations: true,
            supplementRecommendations: true,
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
        createdAt: protocol.createdAt.toISOString(),
        weekPlan,
        generalRecommendations: protocol.generalRecommendations,
        tips: protocol.tips,
        hydrationRecommendations: protocol.hydrationRecommendations,
        supplementRecommendations: protocol.supplementRecommendations
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
    weekCreates: Array<{
        weekNumber: number;
        days: Prisma.ProtocolWeekCreateWithoutProtocolInput['days'];
    }>,
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

    for (const week of weekCreates) {
        await tx.protocolWeek.create({
            data: {
                protocolId,
                weekNumber: week.weekNumber,
                days: week.days
            }
        });
    }
}

function buildProtocolWeekCreates(
    weekPlan: WeekPlanPayload,
    weekCount: number
) {
    return splitWeekPlanIntoWeeks(weekPlan, weekCount)
        .map((chunk, index) =>
            chunk.length === 0
                ? null
                : {
                      weekNumber: index + 1,
                      days: buildMealsCreateInput(chunk)
                  }
        )
        .filter(
            (
                week
            ): week is {
                weekNumber: number;
                days: Prisma.ProtocolWeekCreateWithoutProtocolInput['days'];
            } => week !== null
        );
}

type ProtocolRecommendationsInput = {
    generalRecommendations?: string | null;
    tips?: string | null;
    hydrationRecommendations?: string | null;
    supplementRecommendations?: string | null;
};

function isProtocolDraftSnapshot(
    value: unknown
): value is ProtocolDraftSnapshot {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const snapshot = value as Record<string, unknown>;
    return (
        typeof snapshot.currentStep === 'number' &&
        typeof snapshot.reason === 'string' &&
        typeof snapshot.diagnosis === 'string' &&
        Array.isArray(snapshot.weekPlan)
    );
}

export async function getDraftProtocolForPatient(
    patientId: string
): Promise<ProtocolDraftSummary | null> {
    const protocol = await prisma.protocol.findFirst({
        where: {
            patientId,
            status: 'DRAFT'
        },
        orderBy: {updatedAt: 'desc'},
        select: {
            id: true,
            title: true,
            weekCount: true,
            createdAt: true,
            updatedAt: true,
            draftSnapshot: true
        }
    });

    if (!protocol || !isProtocolDraftSnapshot(protocol.draftSnapshot)) {
        return null;
    }

    return {
        protocolId: protocol.id,
        title: protocol.title,
        weekCount: protocol.weekCount,
        createdAt: protocol.createdAt.toISOString(),
        updatedAt: protocol.updatedAt.toISOString(),
        draftSnapshot: protocol.draftSnapshot
    };
}

export async function saveProtocolDraft(input: {
    patientId: string;
    protocolId?: string;
    title: string;
    weekCount?: number;
    draftSnapshot: ProtocolDraftSnapshot;
    affiliateLinks?: Prisma.InputJsonValue;
} & ProtocolRecommendationsInput): Promise<ProtocolDraftSummary> {
    const weekCount = input.weekCount ?? input.draftSnapshot.weekCount ?? 1;
    const title =
        input.title.trim().length >= 3
            ? input.title.trim()
            : 'Borrador de protocolo';

    const existingDraft = input.protocolId
        ? await prisma.protocol.findFirst({
              where: {
                  id: input.protocolId,
                  patientId: input.patientId,
                  status: 'DRAFT'
              },
              select: {id: true}
          })
        : await prisma.protocol.findFirst({
              where: {
                  patientId: input.patientId,
                  status: 'DRAFT'
              },
              orderBy: {updatedAt: 'desc'},
              select: {id: true}
          });

    const protocol = existingDraft
        ? await prisma.protocol.update({
              where: {id: existingDraft.id},
              data: {
                  title,
                  weekCount,
                  status: 'DRAFT',
                  draftSnapshot:
                      input.draftSnapshot as unknown as Prisma.InputJsonValue,
                  affiliateLinks: input.affiliateLinks,
                  generalRecommendations:
                      input.generalRecommendations ?? null,
                  tips: input.tips ?? null,
                  hydrationRecommendations:
                      input.hydrationRecommendations ?? null,
                  supplementRecommendations:
                      input.supplementRecommendations ?? null
              },
              select: {
                  id: true,
                  title: true,
                  weekCount: true,
                  createdAt: true,
                  updatedAt: true,
                  draftSnapshot: true
              }
          })
        : await prisma.protocol.create({
              data: {
                  title,
                  weekCount,
                  patientId: input.patientId,
                  status: 'DRAFT',
                  draftSnapshot:
                      input.draftSnapshot as unknown as Prisma.InputJsonValue,
                  affiliateLinks: input.affiliateLinks,
                  generalRecommendations:
                      input.generalRecommendations ?? null,
                  tips: input.tips ?? null,
                  hydrationRecommendations:
                      input.hydrationRecommendations ?? null,
                  supplementRecommendations:
                      input.supplementRecommendations ?? null
              },
              select: {
                  id: true,
                  title: true,
                  weekCount: true,
                  createdAt: true,
                  updatedAt: true,
                  draftSnapshot: true
              }
          });

    if (!isProtocolDraftSnapshot(protocol.draftSnapshot)) {
        throw new Error('No se pudo guardar el borrador del protocolo');
    }

    return {
        protocolId: protocol.id,
        title: protocol.title,
        weekCount: protocol.weekCount,
        createdAt: protocol.createdAt.toISOString(),
        updatedAt: protocol.updatedAt.toISOString(),
        draftSnapshot: protocol.draftSnapshot
    };
}

export async function deleteDraftProtocolsForPatient(
    patientId: string,
    exceptProtocolId?: string
) {
    await prisma.protocol.deleteMany({
        where: {
            patientId,
            status: 'DRAFT',
            ...(exceptProtocolId ? {id: {not: exceptProtocolId}} : {})
        }
    });
}

export async function createPatientProtocol(input: {
    patientId: string;
    title: string;
    weekCount?: number;
    weekPlan: WeekPlanPayload;
    affiliateLinks?: Prisma.InputJsonValue;
} & ProtocolRecommendationsInput) {
    const weekCount = input.weekCount ?? 1;
    const weekCreates = buildProtocolWeekCreates(input.weekPlan, weekCount);

    const protocol = await prisma.protocol.create({
        data: {
            title: input.title,
            weekCount,
            patientId: input.patientId,
            status: 'ACTIVE',
            draftSnapshot: Prisma.JsonNull,
            affiliateLinks: input.affiliateLinks,
            generalRecommendations: input.generalRecommendations ?? null,
            tips: input.tips ?? null,
            hydrationRecommendations: input.hydrationRecommendations ?? null,
            supplementRecommendations: input.supplementRecommendations ?? null,
            weeksPlan: {
                create: weekCreates.map(week => ({
                    weekNumber: week.weekNumber,
                    days: week.days
                }))
            }
        },
        select: {
            id: true,
            title: true,
            createdAt: true,
            generalRecommendations: true,
            tips: true,
            hydrationRecommendations: true,
            supplementRecommendations: true
        }
    });

    await deleteDraftProtocolsForPatient(input.patientId, protocol.id);

    return {
        protocolId: protocol.id,
        title: protocol.title,
        createdAt: protocol.createdAt.toISOString(),
        weekPlan: await loadProtocolWeekPlanById(protocol.id),
        generalRecommendations: protocol.generalRecommendations,
        tips: protocol.tips,
        hydrationRecommendations: protocol.hydrationRecommendations,
        supplementRecommendations: protocol.supplementRecommendations
    };
}

export async function updatePatientProtocol(input: {
    protocolId: string;
    title: string;
    weekCount?: number;
    weekPlan: WeekPlanPayload;
    affiliateLinks?: Prisma.InputJsonValue;
    promoteFromDraft?: boolean;
} & ProtocolRecommendationsInput) {
    const weekCount = input.weekCount ?? 1;
    // Build nested create payloads before opening the interactive transaction
    // so CPU work does not consume the transaction timeout budget.
    const weekCreates = buildProtocolWeekCreates(input.weekPlan, weekCount);

    const protocolMeta = await prisma.protocol.findUnique({
        where: {id: input.protocolId},
        select: {patientId: true, status: true}
    });

    await prisma.$transaction(
        async tx => {
            await tx.protocol.update({
                where: {id: input.protocolId},
                data: {
                    title: input.title,
                    weekCount,
                    status: input.promoteFromDraft ? 'ACTIVE' : undefined,
                    draftSnapshot: input.promoteFromDraft
                        ? Prisma.JsonNull
                        : undefined,
                    affiliateLinks: input.affiliateLinks,
                    generalRecommendations:
                        input.generalRecommendations ?? null,
                    tips: input.tips ?? null,
                    hydrationRecommendations:
                        input.hydrationRecommendations ?? null,
                    supplementRecommendations:
                        input.supplementRecommendations ?? null
                }
            });

            await replaceProtocolWeekPlan(input.protocolId, weekCreates, tx);
        },
        {
            maxWait: 15_000,
            timeout: 60_000
        }
    );

    if (
        input.promoteFromDraft &&
        protocolMeta?.patientId &&
        protocolMeta.status === 'DRAFT'
    ) {
        await deleteDraftProtocolsForPatient(
            protocolMeta.patientId,
            input.protocolId
        );
    }

    const protocol = await prisma.protocol.findUnique({
        where: {id: input.protocolId},
        select: {
            id: true,
            title: true,
            createdAt: true,
            generalRecommendations: true,
            tips: true,
            hydrationRecommendations: true,
            supplementRecommendations: true
        }
    });

    if (!protocol) {
        throw new Error('Protocol not found after update');
    }

    return {
        protocolId: protocol.id,
        title: protocol.title,
        createdAt: protocol.createdAt.toISOString(),
        weekPlan: await loadProtocolWeekPlanById(protocol.id),
        generalRecommendations: protocol.generalRecommendations,
        tips: protocol.tips,
        hydrationRecommendations: protocol.hydrationRecommendations,
        supplementRecommendations: protocol.supplementRecommendations
    };
}
