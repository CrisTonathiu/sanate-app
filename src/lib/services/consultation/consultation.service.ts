'use server';

import {prisma} from '@/lib/prisma';
import {
    CreateConsultationInput,
    createConsultationSchema,
    ConsultationIdInput,
    consultationIdSchema
} from '@/lib/validations/consultation.schema';
import {
    PatientIdInput,
    patientIdSchema
} from '@/lib/validations/patient.schema';
import {ZodError} from 'zod';

export async function getPatientConsultation(input: PatientIdInput) {
    try {
        const validatedInput = patientIdSchema.parse(input);
        const consultations = await prisma.consultation.findMany({
            where: {
                patientId: validatedInput
            },
            include: {
                nutritionist: true
            }
        });
        return {success: true, data: consultations};
    } catch (error) {
        if (error instanceof ZodError) {
            return {success: false, error: error.message, data: null};
        }
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function createConsultation(input: CreateConsultationInput) {
    try {
        const validatedInput = createConsultationSchema.parse(input);
        const consultation = await prisma.consultation.create({
            data: {
                patientId: validatedInput.patientId,
                nutritionistId: validatedInput.nutritionistId,
                reason: validatedInput.reason,
                diagnosis: validatedInput.diagnosis,
                notes: validatedInput.notes,
                followUpAt: validatedInput.followUpAt
                    ? new Date(validatedInput.followUpAt)
                    : null
            }
        });
        return {success: true, data: consultation};
    } catch (error) {
        if (error instanceof ZodError) {
            return {success: false, error: error.message, data: null};
        }
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function updateConsultation(
    consultationId: ConsultationIdInput,
    input: Partial<CreateConsultationInput>
) {
    try {
        const validatedConsultationId =
            consultationIdSchema.parse(consultationId);
        const validatedInput = createConsultationSchema.partial().parse(input);
        const consultation = await prisma.consultation.update({
            where: {
                id: validatedConsultationId
            },
            data: {
                reason: validatedInput.reason,
                diagnosis: validatedInput.diagnosis,
                notes: validatedInput.notes,
                followUpAt: validatedInput.followUpAt
                    ? new Date(validatedInput.followUpAt)
                    : null
            }
        });
        return {success: true, data: consultation};
    } catch (error) {
        if (error instanceof ZodError) {
            return {success: false, error: error.message, data: null};
        }
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function deleteConsultation(input: ConsultationIdInput) {
    try {
        const validatedInput = consultationIdSchema.parse(input);
        await prisma.consultation.delete({
            where: {
                id: validatedInput
            }
        });
        return {success: true, data: null};
    } catch (error) {
        if (error instanceof ZodError) {
            return {success: false, error: error.message, data: null};
        }
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}
