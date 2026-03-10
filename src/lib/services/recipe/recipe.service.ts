'use server';

import {
    CreateRecipeInput,
    createRecipeSchema,
    RecipeIdInput,
    recipeIdSchema
} from '../../validations/recipe.schema';
import {prisma} from '../../prisma';
import {ZodError} from 'zod';

export async function getAllRecipes() {
    try {
        const recipes = await prisma.recipe.findMany();
        return {
            success: true,
            message: 'Recetas obtenidas exitosamente',
            data: recipes
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error al obtener las recetas',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function getRecipeById(recipeId: RecipeIdInput) {
    try {
        const validatedRecipeId = recipeIdSchema.parse(recipeId);
        const recipe = await prisma.recipe.findUnique({
            where: {id: validatedRecipeId}
        });
        if (!recipe) {
            return {
                success: false,
                message: 'Receta no encontrada'
            };
        }
        return {
            success: true,
            message: 'Receta obtenida exitosamente',
            data: recipe
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
            message: 'Error al obtener la receta',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function createRecipe(input: CreateRecipeInput) {
    try {
        const validatedInput = createRecipeSchema.parse(input);

        const recipe = await prisma.recipe.create({
            data: {
                title: validatedInput.title,
                description: validatedInput.description,
                instructions: validatedInput.instructions,
                mealType: validatedInput.mealType
            }
        });
        return {
            success: true,
            message: 'Receta creada exitosamente',
            data: recipe
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
            message: 'Error al crear la receta',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function updateRecipe(
    recipeId: RecipeIdInput,
    input: Partial<CreateRecipeInput>
) {
    try {
        const validatedInput = createRecipeSchema.partial().parse(input);
        const validatedRecipeId = recipeIdSchema.parse(recipeId);

        const recipe = await prisma.recipe.update({
            where: {id: validatedRecipeId},
            data: {
                title: validatedInput.title,
                description: validatedInput.description,
                instructions: validatedInput.instructions,
                mealType: validatedInput.mealType
            }
        });
        return {
            success: true,
            message: 'Receta actualizada exitosamente',
            data: recipe
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
            message: 'Error al actualizar la receta',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function deleteRecipe(input: RecipeIdInput) {
    try {
        const validatedInput = recipeIdSchema.parse(input);
        await prisma.recipe.delete({
            where: {id: validatedInput}
        });
        return {
            success: true,
            message: 'Receta eliminada exitosamente'
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error al eliminar la receta',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
