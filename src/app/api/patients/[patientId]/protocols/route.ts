import {requireRole} from '@/lib/auth/requireRole';
import {prisma} from '@/lib/prisma';
import {MealType, ProtocolStatus} from '@prisma/client';

type DayMealPayload = {
    id?: string;
};

type DayPlanPayload = {
    day: string;
    smoothie?: DayMealPayload;
    breakfast?: DayMealPayload;
    snack1?: DayMealPayload;
    snack2?: DayMealPayload;
    lunch?: DayMealPayload;
    dinner?: DayMealPayload;
    drinks?: DayMealPayload;
};

const MEAL_TYPE_BY_KEY: Record<
    Exclude<keyof DayPlanPayload, 'day'>,
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

export async function GET(
    _request: Request,
    {params}: {params: Promise<{patientId: string}>}
) {
    await requireRole('ADMIN');
    const {patientId} = await params;
    if (!patientId) {
        return Response.json(
            {success: false, message: 'Patient ID is required'},
            {status: 400}
        );
    }
    // Aquí podrías agregar lógica para obtener el protocolo por ID si es necesario
    return Response.json(
        {
            success: true,
            message: `Protocolo del paciente ${patientId} obtenido correctamente`
        },
        {status: 200}
    );
}

export async function POST(
    request: Request,
    {params}: {params: Promise<{patientId: string}>}
) {
    await requireRole('ADMIN');

    const {patientId} = await params;

    if (!patientId) {
        return Response.json(
            {success: false, message: 'Patient ID is required'},
            {status: 400}
        );
    }

    try {
        const body = await request.json();
        const title = typeof body?.title === 'string' ? body.title.trim() : '';
        const weekCount =
            typeof body?.weekCount === 'number' && body.weekCount > 0
                ? Math.floor(body.weekCount)
                : 1;
        const status =
            body?.status === 'ACTIVE' ||
            body?.status === 'COMPLETED' ||
            body?.status === 'ARCHIVED'
                ? (body.status as ProtocolStatus)
                : 'ACTIVE';
        const weekPlan = Array.isArray(body?.weekPlan)
            ? (body.weekPlan as DayPlanPayload[])
            : [];

        if (title.length < 3) {
            return Response.json(
                {
                    success: false,
                    message:
                        'El nombre del protocolo debe tener al menos 3 caracteres'
                },
                {status: 400}
            );
        }

        if (weekPlan.length === 0) {
            return Response.json(
                {
                    success: false,
                    message: 'El plan semanal no puede estar vacío'
                },
                {status: 400}
            );
        }

        const protocol = await prisma.protocol.create({
            data: {
                title,
                weekCount,
                patientId,
                status,
                weeksPlan: {
                    create: [
                        {
                            weekNumber: 1,
                            days: {
                                create: weekPlan.map((day, dayIndex) => {
                                    const meals = (
                                        Object.keys(MEAL_TYPE_BY_KEY) as Array<
                                            Exclude<keyof DayPlanPayload, 'day'>
                                        >
                                    )
                                        .map(mealKey => {
                                            const meal = day[mealKey];
                                            if (!meal?.id) {
                                                return null;
                                            }

                                            return {
                                                mealType:
                                                    MEAL_TYPE_BY_KEY[mealKey],
                                                recipeId: meal.id
                                            };
                                        })
                                        .filter(
                                            (
                                                meal
                                            ): meal is {
                                                mealType: MealType;
                                                recipeId: string;
                                            } => Boolean(meal)
                                        );

                                    return {
                                        dayIndex,
                                        meals: {
                                            create: meals
                                        }
                                    };
                                })
                            }
                        }
                    ]
                }
            },
            include: {
                weeksPlan: {
                    include: {
                        days: {
                            include: {
                                meals: true
                            }
                        }
                    }
                }
            }
        });

        return Response.json(
            {
                success: true,
                message: 'Protocolo generado correctamente',
                data: protocol
            },
            {status: 200}
        );
    } catch (error) {
        return Response.json(
            {
                success: false,
                message: 'No se pudo generar el protocolo',
                error:
                    error instanceof Error ? error.message : 'Error desconocido'
            },
            {status: 500}
        );
    }
}
