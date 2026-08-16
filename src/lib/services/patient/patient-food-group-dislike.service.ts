'use server';

import {
    CreatePatientFoodGroupDislikeInput,
    createPatientFoodGroupDislikeSchema,
    PatientIdInput,
    patientIdSchema
} from '@/lib/validations/patient.schema';
import {ZodError} from 'zod';
import {prisma} from '../../prisma';

const groupDislikeInclude = {
    group: {
        include: {
            items: {
                include: {
                    food: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }
        }
    }
} as const;

export async function getPatientFoodGroupDislikes(input: PatientIdInput) {
    try {
        const validatedInput = patientIdSchema.parse(input);
        const groupDislikes = await prisma.patientFoodGroupDislike.findMany({
            where: {patientId: validatedInput},
            include: groupDislikeInclude,
            orderBy: {
                group: {
                    name: 'asc'
                }
            }
        });

        return {success: true, data: groupDislikes};
    } catch {
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function createPatientFoodGroupDislike(
    input: CreatePatientFoodGroupDislikeInput
) {
    try {
        const validatedInput = createPatientFoodGroupDislikeSchema.parse(input);

        const group = await prisma.ingredientGroup.findUnique({
            where: {id: validatedInput.groupId}
        });

        if (!group) {
            return {
                success: false,
                message: 'Grupo no encontrado',
                data: null
            };
        }

        const result = await prisma.patientFoodGroupDislike.upsert({
            where: {
                patientId_groupId: {
                    patientId: validatedInput.patientId,
                    groupId: validatedInput.groupId
                }
            },
            update: {
                notes: validatedInput.notes
            },
            create: {
                patientId: validatedInput.patientId,
                groupId: validatedInput.groupId,
                notes: validatedInput.notes
            },
            include: groupDislikeInclude
        });

        return {success: true, data: result};
    } catch (error) {
        if (error instanceof ZodError) {
            return {
                success: false,
                message: 'Error de validación',
                errors: error.flatten(),
                data: null
            };
        }

        return {
            success: false,
            message: 'Error al agregar el grupo rechazado del paciente',
            data: null
        };
    }
}

export async function deletePatientFoodGroupDislike(
    patientId: string,
    groupId: string
) {
    try {
        const result = await prisma.patientFoodGroupDislike.deleteMany({
            where: {
                patientId,
                groupId
            }
        });

        return {success: true, data: result};
    } catch {
        return {
            success: false,
            message: 'Error al eliminar el grupo rechazado del paciente',
            data: null
        };
    }
}
