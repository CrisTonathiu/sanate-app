import {z} from 'zod';

export const createPatientSchema = z.object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    email: z.email('Correo electrónico no válido'),
    phone: z.string().optional(),
    whatsappNumber: z.string().optional(),
    birthDate: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    height: z.coerce.number().min(1, 'La altura debe ser mayor a 0').optional(),
    initialWeight: z.coerce
        .number()
        .min(1, 'El peso debe ser mayor a 0')
        .optional()
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const patientIdSchema = z.string().cuid('Invalid patient ID');

export type PatientIdInput = z.infer<typeof patientIdSchema>;

export const createPatientAllergySchema = z.object({
    patientId: patientIdSchema,
    allergyId: z.string().min(1, 'Allergy ID is required'),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'SEVERE']).optional(),
    notes: z.string().optional()
});

export type CreatePatientAllergyInput = z.infer<
    typeof createPatientAllergySchema
>;

export const createPatientConditionSchema = z.object({
    patientId: patientIdSchema,
    conditionId: z.string().min(1, 'Condition ID is required'),
    diagnosedAt: z.string().optional(),
    notes: z.string().optional()
});

export type CreatePatientConditionInput = z.infer<
    typeof createPatientConditionSchema
>;

export const createPatientFoodDislikeSchema = z.object({
    patientId: patientIdSchema,
    foodId: z.string().min(1, 'Food ID is required'),
    notes: z.string().optional()
});

export type CreatePatientFoodDislikeInput = z.infer<
    typeof createPatientFoodDislikeSchema
>;
