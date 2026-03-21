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
        const recipes = await prisma.recipe.findMany({
            include: {
                ingredients: {
                    include: {
                        ingredient: true
                    }
                },
                extraIngredients: true,
                steps: {
                    orderBy: {
                        stepNumber: 'asc'
                    }
                }
            }
        });
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
            where: {id: validatedRecipeId},
            include: {
                ingredients: {
                    include: {
                        ingredient: true
                    }
                },
                extraIngredients: true,
                steps: {
                    orderBy: {
                        stepNumber: 'asc'
                    }
                }
            }
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
        const recipe = await prisma.$transaction(async tx => {
            // 1. Crear receta
            const newRecipe = await tx.recipe.create({
                data: {
                    title: validatedInput.title,
                    mealType: validatedInput.mealType
                }
            });

            // 2. Procesar ingredientes
            for (const item of validatedInput.ingredients) {
                // 🔹 Upsert ingredient (evita duplicados)
                const ingredient = await tx.ingredient.upsert({
                    where: {name: item.foodId},
                    update: {},
                    create: {name: item.foodId}
                });

                // 🔹 Crear relación con gramos
                await tx.recipeIngredient.create({
                    data: {
                        recipeId: newRecipe.id,
                        ingredientId: ingredient.id,
                        grams: item.grams
                    }
                });
            }

            // 3. Procesar extra ingredientes
            if ((validatedInput.extraIngredients ?? []).length > 0) {
                await tx.recipeExtraIngredient.createMany({
                    data: (validatedInput.extraIngredients ?? []).map(item => ({
                        recipeId: newRecipe.id,
                        name: item.name
                    }))
                });
            }

            // 4. Procesar pasos
            if ((validatedInput.steps ?? []).length > 0) {
                await tx.recipeStep.createMany({
                    data: (validatedInput.steps ?? []).map((step, index) => ({
                        recipeId: newRecipe.id,
                        stepNumber: index + 1,
                        instruction: step.instruction
                    }))
                });
            }

            return newRecipe;
        });

        // 2. Procesar ingredientes
        return {
            success: true,
            message: 'Receta creada exitosamente',
            data: recipe
        };
    } catch (error) {
        if (error instanceof ZodError) {
            console.error('Validation error:', error);
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

        const recipe = await prisma.$transaction(async tx => {
            const updatedRecipe = await tx.recipe.update({
                where: {id: validatedRecipeId},
                data: {
                    title: validatedInput.title,
                    mealType: validatedInput.mealType
                }
            });

            if (validatedInput.extraIngredients !== undefined) {
                await tx.recipeExtraIngredient.deleteMany({
                    where: {recipeId: validatedRecipeId}
                });

                if (validatedInput.extraIngredients.length > 0) {
                    await tx.recipeExtraIngredient.createMany({
                        data: validatedInput.extraIngredients.map(item => ({
                            recipeId: validatedRecipeId,
                            name: item.name
                        }))
                    });
                }
            }

            if (validatedInput.steps !== undefined) {
                await tx.recipeStep.deleteMany({
                    where: {recipeId: validatedRecipeId}
                });

                if (validatedInput.steps.length > 0) {
                    await tx.recipeStep.createMany({
                        data: validatedInput.steps.map((step, index) => ({
                            recipeId: validatedRecipeId,
                            stepNumber: index + 1,
                            instruction: step.instruction
                        }))
                    });
                }
            }

            return updatedRecipe;
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
