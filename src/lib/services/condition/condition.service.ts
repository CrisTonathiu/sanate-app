'use server';

import {
    ConditionIdInput,
    conditionIdSchema,
    CreateConditionInput,
    createConditionSchema,
    UpdateConditionInput,
    updateConditionSchema
} from '@/lib/validations/condition.schema';
import {ZodError} from 'zod';
import {prisma} from '../../prisma';

export async function getAllConditions() {
    try {
        const conditions = await prisma.condition.findMany();
        return {success: true, data: conditions};
    } catch (error) {
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function createCondition(input: CreateConditionInput) {
    try {
        const validatedInput = createConditionSchema.parse(input);

        const result = await prisma.condition.create({
            data: {
                name: validatedInput.name
            }
        });

        return {success: true, data: result};
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

export async function updateCondition(input: UpdateConditionInput) {
    try {
        const validatedInput = updateConditionSchema.parse(input);

        const result = await prisma.condition.update({
            where: {
                id: validatedInput.id
            },
            data: {
                name: validatedInput.name,
                description: validatedInput.description
            }
        });

        return {success: true, data: result};
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

export async function deleteCondition(input: ConditionIdInput) {
    try {
        const validatedInput = conditionIdSchema.parse(input);

        const result = await prisma.condition.delete({
            where: {
                id: validatedInput
            }
        });

        return {success: true, data: result};
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
