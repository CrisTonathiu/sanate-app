import {z} from 'zod';

export const patientNoteStatusSchema = z.enum(['DRAFT', 'SAVED']);

export const createPatientNoteSchema = z.object({
    title: z.string().trim().optional(),
    content: z.string().trim().min(1, 'El contenido es requerido'),
    transcript: z.string().trim().optional(),
    summary: z.string().trim().optional(),
    status: patientNoteStatusSchema.optional()
});

export const updatePatientNoteSchema = z.object({
    title: z.string().trim().optional(),
    content: z.string().trim().min(1, 'El contenido es requerido').optional(),
    transcript: z.string().trim().optional(),
    summary: z.string().trim().optional(),
    status: patientNoteStatusSchema.optional()
});
