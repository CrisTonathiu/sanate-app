'use server';

import {
    CreatePatientAllergyInput,
    createPatientAllergySchema,
    PatientIdInput,
    patientIdSchema
} from '@/lib/validations/patient.schema';
import {ZodError} from 'zod';
import {prisma} from '../../prisma';

export async function getPatientAllergies(input: PatientIdInput) {
    try {
        const validatedInput = patientIdSchema.parse(input);
        const allergies = await prisma.patientAllergy.findMany({
            where: {patientId: validatedInput},
            include: {
                allergen: true
            }
        });
        return {success: true, data: allergies};
    } catch (error) {
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function createPatientAllergy(input: CreatePatientAllergyInput) {
    try {
        const validatedInput = createPatientAllergySchema.parse(input);

        const result = await prisma.patientAllergy.create({
            data: {
                patientId: validatedInput.patientId,
                allergenId: validatedInput.allergyId,
                severity: validatedInput.severity,
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
            message: 'Error al crear la alergia del paciente',
            data: null
        };
    }
}

export async function deletePatientAllergy(
    patientId: string,
    allergyId: string
) {
    try {
        const result = await prisma.patientAllergy.deleteMany({
            where: {
                patientId,
                allergenId: allergyId
            }
        });
        return {success: true, data: result};
    } catch (error) {
        return {
            success: false,
            message: 'Error al eliminar la alergia del paciente',
            data: null
        };
    }
}
