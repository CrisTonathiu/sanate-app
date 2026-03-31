'use server';

import {prisma} from '@/lib/prisma';
import {
    CreateRecipeIngredientInput,
    createRecipeIngredientSchema
} from '@/lib/validations/ingredient.schema';
import {ZodError} from 'zod';

export async function addIngredientToRecipe(
    input: CreateRecipeIngredientInput
) {
    try {
        const validatedInput = createRecipeIngredientSchema.parse(input);

        const recipe = await prisma.recipe.findUnique({
            where: {id: validatedInput.recipeId}
        });

        if (!recipe) {
            return {
                success: false,
                message: 'Receta no encontrada'
            };
        }

        const ingredient = await prisma.ingredient.findUnique({
            where: {id: validatedInput.ingredientId}
        });

        if (!ingredient) {
            return {
                success: false,
                message: 'Ingrediente no encontrado'
            };
        }

        const recipeIngredientData = {
            recipeId: validatedInput.recipeId,
            ingredientId: validatedInput.ingredientId,
            quantity:
                validatedInput.quantity && validatedInput.quantity > 0
                    ? validatedInput.quantity
                    : validatedInput.unit === 'GRAM'
                      ? validatedInput.grams && validatedInput.grams > 0
                          ? validatedInput.grams
                          : 100
                      : 1,
            unit: validatedInput.unit ?? 'GRAM',
            grams:
                validatedInput.grams && validatedInput.grams > 0
                    ? validatedInput.grams
                    : 100
        } as unknown as Parameters<
            typeof prisma.recipeIngredient.create
        >[0]['data'];

        await prisma.recipeIngredient.create({
            data: recipeIngredientData
        });

        return {
            success: true,
            message: 'Ingrediente agregado a la receta exitosamente'
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
            message: 'Error al agregar el ingrediente a la receta',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function removeIngredientFromRecipe(
    recipeId: string,
    ingredientId: string
) {
    try {
        await prisma.recipeIngredient.delete({
            where: {
                recipeId_ingredientId: {
                    recipeId,
                    ingredientId
                }
            }
        });

        return {
            success: true,
            message: 'Ingrediente removido de la receta exitosamente'
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error al remover el ingrediente de la receta'
        };
    }
}
