'use server';

import {prisma} from '@/lib/prisma';
import {
    CreateIngredientGroupInput,
    createIngredientGroupSchema,
    IngredientGroupIdInput,
    ingredientGroupIdSchema,
    UpdateIngredientGroupInput,
    updateIngredientGroupSchema
} from '@/lib/validations/ingredient-group.schema';
import {ZodError} from 'zod';

const groupInclude = {
    items: {
        include: {
            food: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: {
            food: {
                name: 'asc' as const
            }
        }
    },
    _count: {
        select: {
            items: true,
            dislikedBy: true
        }
    }
} as const;

export async function getAllIngredientGroups() {
    try {
        const groups = await prisma.ingredientGroup.findMany({
            include: groupInclude,
            orderBy: {
                name: 'asc'
            }
        });

        return {success: true, data: groups};
    } catch {
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function getIngredientGroupById(groupId: IngredientGroupIdInput) {
    try {
        const validatedId = ingredientGroupIdSchema.parse(groupId);
        const group = await prisma.ingredientGroup.findUnique({
            where: {id: validatedId},
            include: groupInclude
        });

        if (!group) {
            return {
                success: false,
                message: 'Grupo no encontrado'
            };
        }

        return {
            success: true,
            message: 'Grupo obtenido exitosamente',
            data: group
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
            message: 'Error al obtener el grupo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

async function assertFoodsExist(foodIds: string[]) {
    const uniqueIds = [...new Set(foodIds)];
    const count = await prisma.food.count({
        where: {
            id: {
                in: uniqueIds
            }
        }
    });

    return count === uniqueIds.length;
}

export async function createIngredientGroup(input: CreateIngredientGroupInput) {
    try {
        const validatedInput = createIngredientGroupSchema.parse(input);

        const foodsExist = await assertFoodsExist(validatedInput.foodIds);
        if (!foodsExist) {
            return {
                success: false,
                message: 'Uno o más alimentos no existen'
            };
        }

        const existing = await prisma.ingredientGroup.findFirst({
            where: {
                name: {
                    equals: validatedInput.name,
                    mode: 'insensitive'
                }
            }
        });

        if (existing) {
            return {
                success: false,
                message: 'Ya existe un grupo con ese nombre'
            };
        }

        const uniqueFoodIds = [...new Set(validatedInput.foodIds)];
        const group = await prisma.ingredientGroup.create({
            data: {
                name: validatedInput.name,
                color: validatedInput.color,
                items: {
                    create: uniqueFoodIds.map(foodId => ({foodId}))
                }
            },
            include: groupInclude
        });

        return {
            success: true,
            message: 'Grupo creado exitosamente',
            data: group
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
            message: 'Error al crear el grupo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function updateIngredientGroup(
    groupId: IngredientGroupIdInput,
    input: UpdateIngredientGroupInput
) {
    try {
        const validatedId = ingredientGroupIdSchema.parse(groupId);
        const validatedInput = updateIngredientGroupSchema.parse(input);

        const existing = await prisma.ingredientGroup.findUnique({
            where: {id: validatedId}
        });

        if (!existing) {
            return {
                success: false,
                message: 'Grupo no encontrado'
            };
        }

        const foodsExist = await assertFoodsExist(validatedInput.foodIds);
        if (!foodsExist) {
            return {
                success: false,
                message: 'Uno o más alimentos no existen'
            };
        }

        const duplicate = await prisma.ingredientGroup.findFirst({
            where: {
                name: {
                    equals: validatedInput.name,
                    mode: 'insensitive'
                },
                NOT: {id: validatedId}
            }
        });

        if (duplicate) {
            return {
                success: false,
                message: 'Ya existe un grupo con ese nombre'
            };
        }

        const uniqueFoodIds = [...new Set(validatedInput.foodIds)];
        const group = await prisma.ingredientGroup.update({
            where: {id: validatedId},
            data: {
                name: validatedInput.name,
                color: validatedInput.color,
                items: {
                    deleteMany: {},
                    create: uniqueFoodIds.map(foodId => ({foodId}))
                }
            },
            include: groupInclude
        });

        return {
            success: true,
            message: 'Grupo actualizado exitosamente',
            data: group
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
            message: 'Error al actualizar el grupo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function deleteIngredientGroup(groupId: IngredientGroupIdInput) {
    try {
        const validatedId = ingredientGroupIdSchema.parse(groupId);

        const group = await prisma.ingredientGroup.findUnique({
            where: {id: validatedId}
        });

        if (!group) {
            return {
                success: false,
                message: 'Grupo no encontrado'
            };
        }

        await prisma.ingredientGroup.delete({
            where: {id: validatedId}
        });

        return {
            success: true,
            message: 'Grupo eliminado exitosamente'
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
            message: 'Error al eliminar el grupo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
