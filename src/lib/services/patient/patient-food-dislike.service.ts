'use server';

import {
    CreatePatientFoodDislikeInput,
    createPatientFoodDislikeSchema,
    PatientIdInput,
    patientIdSchema
} from '@/lib/validations/patient.schema';
import {ZodError} from 'zod';
import {prisma} from '../../prisma';

export async function getPatientFoodDislikes(input: PatientIdInput) {
    try {
        const validatedInput = patientIdSchema.parse(input);
        const foodDislikes = await prisma.patientFoodDislike.findMany({
            where: {patientId: validatedInput},
            include: {
                food: true
            },
            orderBy: {
                food: {
                    name: 'asc'
                }
            }
        });

        return {success: true, data: foodDislikes};
    } catch {
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function createPatientFoodDislike(
    input: CreatePatientFoodDislikeInput
) {
    try {
        const validatedInput = createPatientFoodDislikeSchema.parse(input);

        const result = await prisma.patientFoodDislike.upsert({
            where: {
                patientId_foodId: {
                    patientId: validatedInput.patientId,
                    foodId: validatedInput.foodId
                }
            },
            update: {
                notes: validatedInput.notes
            },
            create: {
                patientId: validatedInput.patientId,
                foodId: validatedInput.foodId,
                notes: validatedInput.notes
            }
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
            message: 'Error al crear el alimento rechazado del paciente',
            data: null
        };
    }
}

export async function deletePatientFoodDislike(
    patientId: string,
    foodId: string
) {
    try {
        const result = await prisma.patientFoodDislike.deleteMany({
            where: {
                patientId,
                foodId
            }
        });

        return {success: true, data: result};
    } catch {
        return {
            success: false,
            message: 'Error al eliminar el alimento rechazado del paciente',
            data: null
        };
    }
}
