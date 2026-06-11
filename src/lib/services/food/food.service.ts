'use server';

import {prisma} from '@/lib/prisma';
import {
    CreateFoodInput,
    createFoodSchema,
    FoodIdInput,
    foodIdSchema,
    UpdateFoodInput,
    updateFoodSchema
} from '@/lib/validations/food.schema';
import {ZodError} from 'zod';

const foodInclude = {
    group: {
        select: {
            id: true,
            name: true
        }
    }
} as const;

export async function getAllFoods() {
    try {
        const foods = await prisma.food.findMany({
            include: foodInclude,
            orderBy: {
                name: 'asc'
            }
        });

        return {success: true, data: foods};
    } catch (error) {
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function getAllFoodGroups() {
    try {
        const groups = await prisma.foodGroup.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return {success: true, data: groups};
    } catch (error) {
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function createFood(input: CreateFoodInput) {
    try {
        const validatedInput = createFoodSchema.parse(input);

        const group = await prisma.foodGroup.findUnique({
            where: {id: validatedInput.groupId}
        });

        if (!group) {
            return {
                success: false,
                message: 'Grupo de alimentos no encontrado'
            };
        }

        const food = await prisma.food.create({
            data: {
                name: validatedInput.name,
                groupId: validatedInput.groupId,
                proteinPer100g: validatedInput.proteinPer100g ?? null,
                carbsPer100g: validatedInput.carbsPer100g ?? null,
                fatPer100g: validatedInput.fatPer100g ?? null,
                caloriesPer100g: validatedInput.caloriesPer100g ?? null,
                density: validatedInput.density ?? null,
                isDiscrete: validatedInput.isDiscrete ?? false,
                maxPortionGrams: validatedInput.maxPortionGrams ?? null
            },
            include: foodInclude
        });

        return {
            success: true,
            message: 'Alimento creado exitosamente',
            data: food
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
            message: 'Error al crear el alimento',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function getFoodById(foodId: FoodIdInput) {
    try {
        const validatedId = foodIdSchema.parse(foodId);
        const food = await prisma.food.findUnique({
            where: {id: validatedId},
            include: foodInclude
        });

        if (!food) {
            return {
                success: false,
                message: 'Alimento no encontrado'
            };
        }

        return {
            success: true,
            message: 'Alimento obtenido exitosamente',
            data: food
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
            message: 'Error al obtener el alimento',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function updateFood(foodId: FoodIdInput, input: UpdateFoodInput) {
    try {
        const validatedId = foodIdSchema.parse(foodId);
        const validatedInput = updateFoodSchema.parse(input);

        const existing = await prisma.food.findUnique({
            where: {id: validatedId}
        });

        if (!existing) {
            return {
                success: false,
                message: 'Alimento no encontrado'
            };
        }

        const group = await prisma.foodGroup.findUnique({
            where: {id: validatedInput.groupId}
        });

        if (!group) {
            return {
                success: false,
                message: 'Grupo de alimentos no encontrado'
            };
        }

        const food = await prisma.food.update({
            where: {id: validatedId},
            data: {
                name: validatedInput.name,
                groupId: validatedInput.groupId,
                proteinPer100g: validatedInput.proteinPer100g ?? null,
                carbsPer100g: validatedInput.carbsPer100g ?? null,
                fatPer100g: validatedInput.fatPer100g ?? null,
                caloriesPer100g: validatedInput.caloriesPer100g ?? null,
                density: validatedInput.density ?? null,
                isDiscrete: validatedInput.isDiscrete ?? false,
                maxPortionGrams: validatedInput.maxPortionGrams ?? null
            },
            include: foodInclude
        });

        return {
            success: true,
            message: 'Alimento actualizado exitosamente',
            data: food
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
            message: 'Error al actualizar el alimento',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function deleteFood(foodId: FoodIdInput) {
    try {
        const validatedId = foodIdSchema.parse(foodId);

        const food = await prisma.food.findUnique({
            where: {id: validatedId},
            include: {
                _count: {
                    select: {
                        ingredients: true
                    }
                }
            }
        });

        if (!food) {
            return {
                success: false,
                message: 'Alimento no encontrado'
            };
        }

        if (food._count.ingredients > 0) {
            return {
                success: false,
                message:
                    'No se puede eliminar: el alimento está vinculado a recetas'
            };
        }

        await prisma.$transaction([
            prisma.patientFoodDislike.deleteMany({
                where: {foodId: validatedId}
            }),
            prisma.foodEquivalent.deleteMany({
                where: {
                    OR: [
                        {foodId: validatedId},
                        {equivalentFoodId: validatedId}
                    ]
                }
            }),
            prisma.food.delete({
                where: {id: validatedId}
            })
        ]);

        return {
            success: true,
            message: 'Alimento eliminado exitosamente'
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
            message: 'Error al eliminar el alimento',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
