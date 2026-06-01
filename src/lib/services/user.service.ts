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

const CLAIM_USER_LOG_PREFIX = '[user.claim]';

function getZodValidationMessage(error: ZodError): string {
    const {fieldErrors, formErrors} = error.flatten();
    const errorsByField = fieldErrors as Partial<
        Record<keyof z.infer<typeof claimUserSchema>, string[]>
    >;
    const passwordMessage = errorsByField.password?.[0];
    if (passwordMessage) return passwordMessage;

    const firstFieldMessage = Object.values(fieldErrors)
        .flat()
        .find((msg): msg is string => typeof msg === 'string');
    if (firstFieldMessage) return firstFieldMessage;

    if (formErrors[0]) return formErrors[0];

    return 'Error de validación';
}

function getAppUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function getAuthCallbackUrl() {
    return `${getAppUrl()}/auth/callback?next=/portal`;
}

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
        console.log(CLAIM_USER_LOG_PREFIX, 'claimUser:start');

        const validatedInput = claimUserSchema.parse(input);

        console.log(CLAIM_USER_LOG_PREFIX, 'claimUser:validated', {
            email: validatedInput.email
        });

        const user = await prisma.user.findUnique({
            where: {email: validatedInput.email},
            select: {
                email: true,
                role: true,
                isClaimed: true
            }
        });

        console.log(CLAIM_USER_LOG_PREFIX, 'claimUser:lookup', {
            found: Boolean(user),
            role: user?.role,
            isClaimed: user?.isClaimed
        });

        if (!user) {
            console.warn(CLAIM_USER_LOG_PREFIX, 'claimUser:abort', 'user not found', {
                email: validatedInput.email
            });
            return {
                success: false,
                message:
                    'No se encontró un usuario invitado con ese correo electrónico'
            };
        }

        if (user?.isClaimed) {
            console.warn(CLAIM_USER_LOG_PREFIX, 'claimUser:abort', 'already claimed', {
                email: validatedInput.email
            });
            return {
                success: false,
                message: 'Este usuario ya fue reclamado'
            };
        }

        if (user.role !== 'PATIENT') {
            console.warn(CLAIM_USER_LOG_PREFIX, 'claimUser:abort', 'invalid role', {
                email: validatedInput.email,
                role: user.role
            });
            return {
                success: false,
                message: 'Solo los pacientes invitados pueden registrarse aquí'
            };
        }

        const supabase = await createClient();
        console.log(CLAIM_USER_LOG_PREFIX, 'claimUser:signUp', {
            email: validatedInput.email,
            emailRedirectTo: getAuthCallbackUrl()
        });

        const {error} = await supabase.auth.signUp({
            email: validatedInput.email,
            password: validatedInput.password,
            options: {
                emailRedirectTo: getAuthCallbackUrl()
            }
        });

        if (error) {
            console.warn(CLAIM_USER_LOG_PREFIX, 'claimUser:signUpFailed', {
                email: validatedInput.email,
                message: error.message
            });
            return {
                success: false,
                message: error.message
            };
        }

        console.log(CLAIM_USER_LOG_PREFIX, 'claimUser:success', {
            email: validatedInput.email
        });

        return {
            success: true,
            message:
                'Registro exitoso. Revisa tu correo para confirmar tu cuenta.'
        };
    } catch (error) {
        if (error instanceof ZodError) {
            const validationMessage = getZodValidationMessage(error);
            console.warn(CLAIM_USER_LOG_PREFIX, 'claimUser:validationFailed', {
                message: validationMessage,
                errors: error.flatten()
            });
            return {
                success: false,
                message: validationMessage,
                errors: error.flatten()
            };
        }

        console.error(CLAIM_USER_LOG_PREFIX, 'claimUser:error', error);

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
