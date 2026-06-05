import {z} from 'zod';

const optionalRecommendationText = z
    .string()
    .trim()
    .max(10000)
    .optional()
    .transform(value => (value && value.length > 0 ? value : undefined));

export const createProtocolSchema = z.object({
    title: z
        .string()
        .min(3, 'El nombre del protocolo debe tener al menos 3 caracteres'),
    weekCount: z.number().optional(),
    patientId: z.string().cuid('ID de paciente no válido'),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
    generalRecommendations: optionalRecommendationText,
    tips: optionalRecommendationText,
    hydrationRecommendations: optionalRecommendationText,
    supplementRecommendations: optionalRecommendationText
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
