import {z} from 'zod';

export const createConsultationSchema = z.object({
    patientId: z.string().cuid('Invalid patient ID'),
    nutritionistId: z.string().cuid('Invalid nutritionist ID'),
    reason: z.string().optional(),
    diagnosis: z.string().optional(),
    treatmentPlan: z.string().optional(),
    notes: z.string().optional(),
    followUpAt: z.string().optional()
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;

export const consultationIdSchema = z.string().cuid('Invalid consultation ID');

export type ConsultationIdInput = z.infer<typeof consultationIdSchema>;
