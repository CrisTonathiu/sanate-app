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
        const protocol = await prisma.protocol.create({
            data: {
                title: validatedInput.title,
                weekCount: validatedInput.weekCount || 1,
                patientId: validatedInput.patientId,
                status: validatedInput.status || 'ACTIVE'
            }
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
        const protocol = await prisma.protocol.update({
            where: {id: validatedInput.protocolId},
            data: {status: validatedInput.status}
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
