'use server';

import {createClient} from '@/lib/supabase/server';
import {CreateUserInput, createUserSchema} from '../validations/user.schema';
import {prisma} from '../prisma';
import {z, ZodError} from 'zod';

const claimUserSchema = z.object({
    email: z.string().email('Correo electrónico no válido'),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
});

export async function createUser(input: CreateUserInput) {
    try {
        // Validate input with Zod
        const validatedInput = createUserSchema.parse(input);

        const user = await prisma.user.create({
            data: {
                firstName: validatedInput.firstName,
                lastName: validatedInput.lastName,
                email: validatedInput.email,
                phone: validatedInput.phone,
                whatsappNumber: validatedInput.whatsappNumber || null,
                role: validatedInput.role,
                isClaimed: false
            }
        });

        return {
            success: true,
            message: 'Usuario creado exitosamente',
            data: user
        };
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
            message: 'Error al crear el usuario',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function claimUser(input: unknown) {
    try {
        const validatedInput = claimUserSchema.parse(input);

        const user = await prisma.user.findUnique({
            where: {email: validatedInput.email},
            select: {
                email: true,
                role: true,
                isClaimed: true
            }
        });

        if (!user) {
            return {
                success: false,
                message:
                    'No se encontró un usuario invitado con ese correo electrónico'
            };
        }

        if (user?.isClaimed) {
            return {
                success: false,
                message: 'Este usuario ya fue reclamado'
            };
        }

        if (user.role !== 'PATIENT') {
            return {
                success: false,
                message: 'Solo los pacientes invitados pueden registrarse aquí'
            };
        }

        const supabase = await createClient();
        const {error} = await supabase.auth.signUp({
            email: validatedInput.email,
            password: validatedInput.password
        });

        if (error) {
            return {
                success: false,
                message: error.message
            };
        }

        // @ts-ignore
        await prisma.user.update({
            where: {email: validatedInput.email},
            data: {isClaimed: true}
        });

        return {
            success: true,
            message: 'Registro exitoso. Ya puedes iniciar sesión'
        };
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
            message: 'Error al reclamar el usuario',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                whatsappNumber: true,
                role: true,
                createdAt: true,
                lastLoginAt: true,
                isActive: true,
                isClaimed: true
            }
        });
        return {
            success: true,
            data: users
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error al obtener los usuarios',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function updateUserAvatarUrl(userId: string, avatarUrl: string) {
    try {
        const user = await prisma.user.update({
            where: {id: userId},
            data: {avatarUrl}
        });

        return {
            success: true,
            data: user
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error al actualizar el avatar del usuario',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
