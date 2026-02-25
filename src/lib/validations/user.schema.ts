import {z} from 'zod';

export const createUserSchema = z.object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    email: z.email('Correo electrónico no válido'),
    phone: z
        .string()
        .min(10, 'El número de teléfono debe tener al menos 10 dígitos'),
    whatsappNumber: z
        .string()
        .min(10, 'El número de WhatsApp debe tener al menos 10 dígitos')
        .optional(),
    role: z.enum(['ADMIN', 'NUTRITIONIST', 'PATIENT'], {
        message: 'Rol no válido'
    })
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
