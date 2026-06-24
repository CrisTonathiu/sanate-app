import {buildWeeklyShoppingLists} from '@/lib/patient-portal/build-shopping-list';
import type {ShoppingListPayload} from '@/lib/patient-portal/shopping-list.types';
import {enhanceWeeklyShoppingListsWithAI} from '@/lib/services/ai/enhance-shopping-list';
import {getActiveProtocolWeekIndex} from '@/lib/utils/protocol-week-plan';
import {prisma} from '@/lib/prisma';

const protocolWeekSelect = {
    weekNumber: true,
    days: {
        orderBy: {dayIndex: 'asc' as const},
        select: {
            meals: {
                select: {
                    portions: {
                        select: {
                            ingredients: {
                                select: {
                                    ingredientName: true,
                                    unit: true,
                                    targetQuantity: true,
                                    targetGrams: true
                                }
                            }
                        }
                    },
                    recipe: {
                        select: {
                            extraIngredients: {
                                select: {name: true}
                            },
                            ingredients: {
                                select: {
                                    grams: true,
                                    quantity: true,
                                    unit: true,
                                    ingredient: {
                                        select: {
                                            id: true,
                                            name: true,
                                            food: {
                                                select: {
                                                    id: true,
                                                    isDiscrete: true,
                                                    group: {
                                                        select: {name: true}
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
        }
    }
} as const;

export async function loadProtocolShoppingListForUser(
    userId: string,
    now: Date = new Date()
): Promise<ShoppingListPayload> {
    const patient = await prisma.patient.findUnique({
        where: {userId},
        select: {id: true}
    });

    if (!patient) {
        return {
            weeklyLists: [],
            protocolWeekCount: 0,
            activeProtocolWeekIndex: 0
        };
    }

    const protocol = await prisma.protocol.findFirst({
        where: {
            patientId: patient.id,
            status: 'ACTIVE'
        },
        orderBy: {createdAt: 'desc'},
        select: {
            createdAt: true,
            weekCount: true,
            weeksPlan: {
                orderBy: {weekNumber: 'asc'},
                select: protocolWeekSelect
            }
        }
    });

    if (!protocol || protocol.weeksPlan.length === 0) {
        return {
            weeklyLists: [],
            protocolWeekCount: 0,
            activeProtocolWeekIndex: 0
        };
    }

    const activeProtocolWeekIndex = getActiveProtocolWeekIndex(
        protocol.createdAt,
        protocol.weekCount,
        now
    );

    const weeklyLists = buildWeeklyShoppingLists({
        weeks: protocol.weeksPlan,
        planStart: protocol.createdAt,
        activeProtocolWeekIndex
    });

    const enhancedWeeklyLists =
        await enhanceWeeklyShoppingListsWithAI(weeklyLists);

    return {
        weeklyLists: enhancedWeeklyLists,
        protocolWeekCount: protocol.weekCount,
        activeProtocolWeekIndex
    };
}
