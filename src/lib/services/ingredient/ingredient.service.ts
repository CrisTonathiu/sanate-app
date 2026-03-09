'use server';

import {prisma} from '@/lib/prisma';

import {
    CreateIngredientInput,
    createIngredientSchema,
    IngredientIdInput,
    ingredientIdSchema
} from '@/lib/validations/ingredient.schema';

import {ZodError} from 'zod';

export async function getAllIngredients() {
    try {
        const ingredients = await prisma.ingredient.findMany();
        return {success: true, data: ingredients};
    } catch (error) {
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function createIngredient(input: CreateIngredientInput) {
    try {
        const validatedInput = createIngredientSchema.parse(input);
        const ingredient = await prisma.ingredient.create({
            data: {
                name: validatedInput.name,
                description: validatedInput.description
            }
        });
        return {success: true, data: ingredient};
    } catch (error) {
        if (error instanceof ZodError) {
            return {success: false, error: error.message, data: null};
        }
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function deleteIngredient(input: IngredientIdInput) {
    try {
        const validatedInput = ingredientIdSchema.parse(input);
        await prisma.ingredient.delete({
            where: {
                id: validatedInput
            }
        });
        return {success: true, data: null};
    } catch (error) {
        if (error instanceof ZodError) {
            return {success: false, error: error.message, data: null};
        }
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}
