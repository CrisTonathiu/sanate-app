'use server';

import {Prisma} from '@prisma/client';
import {createPatientInTransaction} from '@/lib/services/patient/patient.service';
import {
    CreatePatientInput,
    createPatientSchema
} from '@/lib/validations/patient.schema';
import {sendPatientInviteEmail} from '@/lib/services/email/patient-invite.service';
import {prisma} from '../../prisma';
import {ZodError} from 'zod';

type PatientIntakeData = Record<string, unknown>;

function normalizeKey(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function toNonEmptyString(value: unknown): string | undefined {
    if (typeof value === 'string') {
        const trimmedValue = value.trim();
        return trimmedValue || undefined;
    }

    if (Array.isArray(value)) {
        const trimmedValues = value
            .filter((entry): entry is string => typeof entry === 'string')
            .map(entry => entry.trim())
            .filter(Boolean);

        return trimmedValues.length > 0 ? trimmedValues.join(', ') : undefined;
    }

    return undefined;
}

function findValue(
    data: PatientIntakeData,
    candidateKeys: string[]
): unknown | undefined {
    const normalizedCandidates = candidateKeys.map(normalizeKey);
    const entries = Object.entries(data).map(([key, value]) => ({
        normalizedKey: normalizeKey(key),
        value
    }));

    for (const entry of entries) {
        if (normalizedCandidates.includes(entry.normalizedKey)) {
            return entry.value;
        }
    }

    for (const entry of entries) {
        if (
            normalizedCandidates.some(candidate =>
                entry.normalizedKey.includes(candidate)
            )
        ) {
            return entry.value;
        }
    }

    return undefined;
}

function readStringValue(
    data: PatientIntakeData,
    candidateKeys: string[]
): string | undefined {
    return toNonEmptyString(findValue(data, candidateKeys));
}

function readNumberValue(
    data: PatientIntakeData,
    candidateKeys: string[]
): number | undefined {
    const stringValue = readStringValue(data, candidateKeys);

    if (!stringValue) {
        return undefined;
    }

    const normalizedValue = Number(stringValue.replace(/,/g, '.'));
    return Number.isFinite(normalizedValue) ? normalizedValue : undefined;
}

function splitFullName(fullName: string | undefined) {
    if (!fullName) {
        return {firstName: undefined, lastName: undefined};
    }

    const parts = fullName.split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return {firstName: undefined, lastName: undefined};
    }

    if (parts.length === 1) {
        return {firstName: parts[0], lastName: undefined};
    }

    return {
        firstName: parts.slice(0, -1).join(' '),
        lastName: parts.at(-1)
    };
}

function convertAgeToBirthDate(age: number): string | undefined {
    if (!Number.isFinite(age) || age <= 0) {
        return undefined;
    }

    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - age);

    return birthDate.toISOString().slice(0, 10);
}

function readBirthDateValue(data: PatientIntakeData): string | undefined {
    const birthDate = readStringValue(data, [
        'birthdate',
        'fechanacimiento',
        'fecha de nacimiento',
        'nacimiento'
    ]);

    if (birthDate) {
        return birthDate;
    }

    const age = readNumberValue(data, ['edad', 'age']);
    return age ? convertAgeToBirthDate(age) : undefined;
}

function readGenderValue(
    data: PatientIntakeData
): CreatePatientInput['gender'] | undefined {
    const genderValue = readStringValue(data, ['sexo', 'gender']);

    if (!genderValue) {
        return undefined;
    }

    const normalizedGender = normalizeKey(genderValue);

    if (
        normalizedGender.includes('masculino') ||
        normalizedGender.includes('hombre') ||
        normalizedGender.includes('male')
    ) {
        return 'MALE';
    }

    if (
        normalizedGender.includes('femenino') ||
        normalizedGender.includes('mujer') ||
        normalizedGender.includes('female')
    ) {
        return 'FEMALE';
    }

    return undefined;
}

function extractPatientInput(data: PatientIntakeData): CreatePatientInput {
    const email = readStringValue(data, [
        'email',
        'correo',
        'correoelectronico'
    ]);
    const fullName = readStringValue(data, ['nombrecompleto']);
    const splitName = splitFullName(fullName);
    const phone = readStringValue(data, [
        'phone',
        'telefono',
        'numerodetelefono',
        'celular'
    ]);
    const birthDate = readBirthDateValue(data);
    const gender = readGenderValue(data);
    const height = readNumberValue(data, [
        'height',
        'altura',
        'estatura',
        'estaturametros'
    ]);
    const initialWeight = readNumberValue(data, ['weight', 'peso', 'pesokg']);

    return {
        firstName: splitName.firstName ?? '',
        lastName: splitName.lastName ?? '',
        email: email ?? '',
        phone,
        birthDate,
        gender,
        height,
        initialWeight
    };
}

export async function createPatientIntake(input: any) {
    try {
        const payload = (input ?? {}) as PatientIntakeData;
        const extractedPatient = extractPatientInput(payload);

        const intake = await prisma.patientIntake.create({
            data: {
                data: payload as Prisma.InputJsonValue,
                email: extractedPatient.email || null,
                firstName: extractedPatient.firstName || null,
                lastName: extractedPatient.lastName || null,
                phone: extractedPatient.phone || null
            }
        });

        return {
            success: true,
            message: 'Patient intake created successfully',
            data: intake
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error creating patient intake',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function getPendingPatientIntakes() {
    try {
        const intakes = await prisma.patientIntake.findMany({
            where: {processed: false},
            orderBy: {createdAt: 'desc'}
        });

        return {
            success: true,
            data: intakes ?? []
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error fetching patient intakes',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function acceptPatientIntake(
    intakeId: string,
    nutritionistId: string
) {
    try {
        const intake = await prisma.patientIntake.findUnique({
            where: {id: intakeId}
        });

        if (!intake) {
            return {
                success: false,
                message: 'Patient intake not found'
            };
        }

        if (intake.processed) {
            return {
                success: false,
                message: 'Patient intake already processed'
            };
        }

        const patientInput = extractPatientInput(
            intake.data as unknown as PatientIntakeData
        );
        const validatedInput = createPatientSchema.parse(patientInput);

        const result = await prisma.$transaction(async tx => {
            const created = await createPatientInTransaction(
                tx,
                validatedInput,
                nutritionistId
            );

            const updatedIntake = await tx.patientIntake.update({
                where: {id: intakeId},
                data: {
                    processed: true,
                    patientId: created.patient.id
                }
            });

            return {
                ...created,
                intake: updatedIntake
            };
        });

        let emailSent = false;
        let emailError: string | undefined;

        try {
            await sendPatientInviteEmail({
                patientId: result.patient.id,
                patientEmail: result.user.email,
                firstName: result.user.firstName
            });
            emailSent = true;
        } catch (error) {
            emailError =
                error instanceof Error ? error.message : 'Unknown email error';
        }

        return {
            success: true,
            message: emailSent
                ? 'Patient intake accepted successfully'
                : 'Patient intake accepted, but invite email could not be sent',
            data: result,
            emailSent,
            emailError
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
            message: 'Error accepting patient intake',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
