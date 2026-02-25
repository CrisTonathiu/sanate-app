'use server';

import {CreateUserInput, createUserSchema} from '../validations/user.schema';
import {ZodError} from 'zod';
import {prisma} from '../prisma';

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
                role: validatedInput.role
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
                isActive: true
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
