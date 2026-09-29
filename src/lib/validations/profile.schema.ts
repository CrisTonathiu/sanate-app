import {z} from 'zod';

export const updateProfileSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z
        .string()
        .trim()
        .min(2, 'El apellido debe tener al menos 2 caracteres')
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
