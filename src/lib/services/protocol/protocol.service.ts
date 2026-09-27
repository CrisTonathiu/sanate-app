'use server';

import {
    CreateProtocolInput,
    createProtocolSchema,
    ProtocolIdInput,
    protocolIdSchema,
    UpdateProtocolStatusInput,
    updateProtocolStatusSchema
} from '@/lib/validations/protocol.schema';
import {prisma} from '@/lib/prisma';
import {ZodError} from 'zod';
import {Update} from 'next/dist/build/swc/types';

export async function getProtocolById(input: ProtocolIdInput) {
    try {
        const validatedId = protocolIdSchema.parse(input);
        const protocol = await prisma.protocol.findUnique({
            where: {id: validatedId}
        });

        if (!protocol) {
            return {success: false, message: 'Protocolo no encontrado'};
        }

        return {success: true, protocol};
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
            message: 'Error al obtener el protocolo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function createProtocol(input: CreateProtocolInput) {
    try {
        const validatedInput = createProtocolSchema.parse(input);
        const status = validatedInput.status || 'ACTIVE';
        const protocol = await prisma.$transaction(async tx => {
            // Only one ACTIVE protocol per patient
            if (status === 'ACTIVE' && validatedInput.patientId) {
                await tx.protocol.updateMany({
                    where: {
                        patientId: validatedInput.patientId,
                        status: 'ACTIVE'
                    },
                    data: {status: 'COMPLETED'}
                });
            }

            return tx.protocol.create({
                data: {
                    title: validatedInput.title,
                    weekCount: validatedInput.weekCount || 1,
                    patientId: validatedInput.patientId,
                    status
                }
            });
        });

        return {success: true, protocol};
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
            message: 'Error al crear el protocolo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function updateProtocol(input: UpdateProtocolStatusInput) {
    try {
        const validatedInput = updateProtocolStatusSchema.parse(input);
        const protocol = await prisma.$transaction(async tx => {
            const updated = await tx.protocol.update({
                where: {id: validatedInput.protocolId},
                data: {status: validatedInput.status}
            });

            // Only one ACTIVE protocol per patient
            if (updated.status === 'ACTIVE' && updated.patientId) {
                await tx.protocol.updateMany({
                    where: {
                        patientId: updated.patientId,
                        status: 'ACTIVE',
                        id: {not: updated.id}
                    },
                    data: {status: 'COMPLETED'}
                });
            }

            return updated;
        });

        return {success: true, protocol};
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
            message: 'Error al actualizar el protocolo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
