import {z} from 'zod';

export const createPatientNoteSchema = z.object({
    title: z.string().trim().optional(),
    content: z.string().trim().min(1, 'El contenido es requerido'),
    transcript: z.string().trim().optional(),
    summary: z.string().trim().optional()
});
