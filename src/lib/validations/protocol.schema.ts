import {z} from 'zod';

export const createProtocolSchema = z.object({
    title: z
        .string()
        .min(3, 'El nombre del protocolo debe tener al menos 3 caracteres'),
    weekCount: z.number().optional(),
    patientId: z.string().cuid('ID de paciente no válido'),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional()
});

export type CreateProtocolInput = z.infer<typeof createProtocolSchema>;

export const protocolIdSchema = z.string().cuid('ID de protocolo no válido');

export type ProtocolIdInput = z.infer<typeof protocolIdSchema>;

export const updateProtocolStatusSchema = z.object({
    protocolId: protocolIdSchema,
    status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED'])
});

export type UpdateProtocolStatusInput = z.infer<
    typeof updateProtocolStatusSchema
>;
