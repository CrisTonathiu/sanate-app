'use server';

import {
    CreatePatientInput,
    createPatientSchema
} from '../../validations/patient.schema';
import {ZodError} from 'zod';
import {prisma} from '../../prisma';
import {PatientProfileDTO} from '../../dto/PatientDTO';

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
                    whatsappNumber: validatedInput.phone || null,
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
                    height: validatedInput.height ?? null,
                    initialWeight: validatedInput.initialWeight ?? null
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
                initialWeight: true,
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

export async function getPatientProfile(patientId: string) {
    try {
        const patient = await prisma.patient.findUnique({
            where: {id: patientId},
            select: {
                id: true,
                birthDate: true,
                gender: true,
                height: true,
                initialWeight: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        whatsappNumber: true,
                        role: true,
                        updatedAt: true,
                        lastLoginAt: true,
                        isActive: true
                    }
                },
                vitals: {
                    orderBy: {recordedAt: 'desc'},
                    take: 1,
                    select: {
                        weightKg: true,
                        bodyFatPercentage: true,
                        muscleMassKg: true,
                        bloodPressureSystolic: true,
                        bloodPressureDiastolic: true,
                        heartRate: true,
                        glucoseMgDl: true,
                        cholesterolMgDl: true,
                        recordedAt: true
                    }
                }
            }
        });

        if (!patient) {
            return {
                success: false,
                message: 'Paciente no encontrado'
            };
        }

        return {
            success: true,
            data: {
                ...patient,
                firstName: patient.user.firstName,
                lastName: patient.user.lastName,
                email: patient.user.email,
                phone: patient.user.phone,
                whatsappNumber: patient.user.whatsappNumber,
                role: patient.user.role,
                updatedAt: patient.user.updatedAt,
                lastLoginAt: patient.user.lastLoginAt,
                isActive: patient.user.isActive,
                vital: patient.vitals[0] ?? null
            }
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error al obtener el paciente',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

type UpdatePatientProfileInput = Pick<
    PatientProfileDTO,
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'phone'
    | 'birthDate'
    | 'gender'
    | 'height'
    | 'vital'
>;

export async function updatePatientProfile(
    patientId: string,
    input: UpdatePatientProfileInput
) {
    try {
        const patient = await prisma.patient.findUnique({
            where: {id: patientId},
            select: {
                id: true,
                userId: true,
                vitals: {
                    orderBy: {recordedAt: 'desc'},
                    take: 1,
                    select: {id: true}
                }
            }
        });

        if (!patient) {
            return {
                success: false,
                message: 'Paciente no encontrado'
            };
        }

        const normalizedGender =
            input.gender === 'MALE' || input.gender === 'FEMALE'
                ? input.gender
                : undefined;

        const hasVitalsToUpdate =
            input.vital?.weightKg !== undefined ||
            input.vital?.bloodPressureSystolic !== undefined ||
            input.vital?.bloodPressureDiastolic !== undefined ||
            input.vital?.heartRate !== undefined;

        const result = await prisma.$transaction(async tx => {
            const updatedUser = await tx.user.update({
                where: {id: patient.userId},
                data: {
                    firstName: input.firstName,
                    lastName: input.lastName,
                    email: input.email ?? '',
                    phone: input.phone || null
                }
            });

            const updatedPatient = await tx.patient.update({
                where: {id: patientId},
                data: {
                    birthDate: input.birthDate
                        ? new Date(input.birthDate)
                        : null,
                    ...(normalizedGender ? {gender: normalizedGender} : {}),
                    height: input.height ?? null
                }
            });

            let updatedVital = null;
            if (hasVitalsToUpdate) {
                const latestVitalId = patient.vitals[0]?.id;

                if (latestVitalId) {
                    updatedVital = await tx.patientVital.update({
                        where: {id: latestVitalId},
                        data: {
                            weightKg: input.vital?.weightKg ?? null,
                            bloodPressureSystolic:
                                input.vital?.bloodPressureSystolic ?? null,
                            bloodPressureDiastolic:
                                input.vital?.bloodPressureDiastolic ?? null,
                            heartRate: input.vital?.heartRate ?? null
                        }
                    });
                } else {
                    updatedVital = await tx.patientVital.create({
                        data: {
                            patientId,
                            weightKg: input.vital?.weightKg ?? null,
                            bloodPressureSystolic:
                                input.vital?.bloodPressureSystolic ?? null,
                            bloodPressureDiastolic:
                                input.vital?.bloodPressureDiastolic ?? null,
                            heartRate: input.vital?.heartRate ?? null
                        }
                    });
                }
            }

            return {
                user: updatedUser,
                patient: updatedPatient,
                vital: updatedVital
            };
        });

        return {
            success: true,
            message: 'Perfil del paciente actualizado exitosamente',
            data: result
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error al actualizar el perfil del paciente',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function deletePatient(patientId: string) {
    try {
        await prisma.$transaction(async tx => {
            const patient = await tx.patient.findUnique({
                where: {id: patientId},
                select: {userId: true}
            });

            if (!patient) {
                throw new Error('Paciente no encontrado');
            }

            // Delete all related records first (to avoid FK constraint issues)
            await tx.patientVital.deleteMany({
                where: {patientId}
            });

            await tx.patientCondition.deleteMany({
                where: {patientId}
            });

            await tx.patientAllergy.deleteMany({
                where: {patientId}
            });

            await tx.patientFoodDislike.deleteMany({
                where: {patientId}
            });

            await tx.patientNote.deleteMany({
                where: {patientId}
            });

            await tx.consultation.deleteMany({
                where: {patientId}
            });

            // Delete patient record
            await tx.patient.delete({
                where: {id: patientId}
            });

            // Finally delete the user
            await tx.user.delete({
                where: {id: patient.userId}
            });
        });

        return {
            success: true,
            message: 'Paciente eliminado exitosamente'
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error al eliminar el paciente',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
