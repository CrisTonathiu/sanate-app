'use server';

import {
    CreatePatientConditionInput,
    createPatientConditionSchema,
    PatientIdInput,
    patientIdSchema
} from '@/lib/validations/patient.schema';
import {ZodError} from 'zod';
import {prisma} from '../../prisma';

export async function getPatientConditions(input: PatientIdInput) {
    try {
        const validatedInput = patientIdSchema.parse(input);
        const conditions = await prisma.patientCondition.findMany({
            where: {patientId: validatedInput},
            include: {
                condition: true
            }
        });
        return {success: true, data: conditions};
    } catch (error) {
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function createPatientCondition(
    input: CreatePatientConditionInput
) {
    try {
        const validatedInput = createPatientConditionSchema.parse(input);

        const result = await prisma.patientCondition.create({
            data: {
                patientId: validatedInput.patientId,
                conditionId: validatedInput.conditionId,
                diagnosedAt: validatedInput.diagnosedAt,
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
            message: 'Error al crear la condición del paciente',
            data: null
        };
    }
}

export async function deletePatientCondition(
    patientId: string,
    conditionId: string
) {
    try {
        const result = await prisma.patientCondition.deleteMany({
            where: {
                patientId,
                conditionId
            }
        });
        return {success: true, data: result};
    } catch (error) {
        return {
            success: false,
            message: 'Error al eliminar la condición del paciente',
            data: null
        };
    }
}
