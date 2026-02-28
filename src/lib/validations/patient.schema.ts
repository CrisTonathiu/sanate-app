import {z} from 'zod';

export const createPatientSchema = z.object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    email: z.email('Correo electrónico no válido'),
    phone: z.string().optional(),
    whatsappNumber: z.string().optional(),
    birthDate: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    height: z.coerce.number().min(1, 'La altura debe ser mayor a 0').optional(),
    weight: z.coerce.number().min(1, 'El peso debe ser mayor a 0').optional()
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
