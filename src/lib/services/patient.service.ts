'use server';

import {
    CreatePatientInput,
    createPatientSchema
} from '../validations/patient.schema';
import {ZodError} from 'zod';
import {prisma} from '../prisma';

export async function createPatient(
    input: CreatePatientInput,
    nutritionistId: string
) {
    try {
        const validatedInput = createPatientSchema.parse(input);

        const normalizedGender = validatedInput.gender
            ? validatedInput.gender.toUpperCase()
            : null;

        const result = await prisma.$transaction(async tx => {
            const user = await tx.user.create({
                data: {
                    firstName: validatedInput.firstName,
                    lastName: validatedInput.lastName,
                    email: validatedInput.email,
                    phone: validatedInput.phone || null,
                    whatsappNumber: validatedInput.whatsappNumber || null,
                    role: 'PATIENT'
                }
            });

            const patient = await tx.patient.create({
                data: {
                    userId: user.id,
                    nutritionistId,
                    birthDate: validatedInput.birthDate
                        ? new Date(validatedInput.birthDate)
                        : null,
                    gender: normalizedGender,
                    height: validatedInput.height ?? null,
                    weight: validatedInput.weight ?? null
                }
            });

            return {user, patient};
        });

        return {
            success: true,
            message: 'Paciente creado exitosamente',
            data: result
        };
    } catch (error) {
        if (error instanceof ZodError) {
            return {
                success: false,
                message: 'Error de validación',
                errors: error.flatten()
            };
        }
        return {
            success: false,
            message: 'Error al crear el paciente',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function getPatients() {
    try {
        const patients = await prisma.patient.findMany({
            select: {
                id: true,
                userId: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                },
                birthDate: true,
                gender: true,
                height: true,
                weight: true,
                createdAt: true,
                updatedAt: true
            }
        });
        return {
            success: true,
            data: patients
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error al obtener los pacientes',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
