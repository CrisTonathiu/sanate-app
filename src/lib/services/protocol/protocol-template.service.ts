'use server';

import {prisma} from '@/lib/prisma';
import {
    CreateProtocolTemplateInput,
    createProtocolTemplateSchema
} from '@/lib/validations/protocol-template.schema';

export async function createProtocolTemplate(
    input: CreateProtocolTemplateInput
) {
    try {
        const validationResult = createProtocolTemplateSchema.safeParse(input);

        if (!validationResult.success) {
            console.log(
                '[protocol-template.create] validation error:',
                JSON.stringify(validationResult.error.flatten(), null, 2)
            );

            return {
                success: false,
                message: 'Error de validación',
                errors: validationResult.error.flatten()
            };
        }

        const validatedInput = validationResult.data;
        console.log(
            '[protocol-template.create] validated input:',
            validatedInput.name,
            validatedInput.createdById
        );

        const protocolTemplate = await prisma.protocolTemplate.create({
            data: {
                name: validatedInput.name,
                description: validatedInput.description,
                createdById: validatedInput.createdById,
                weeklyPlan: validatedInput.weeklyPlan,
                planCalories: validatedInput.planCalories,
                macroPercents: validatedInput.macroPercents,
                enabledMeals: validatedInput.enabledMeals,
                mealPercentages: validatedInput.mealPercentages,
                macroMealPercentages: validatedInput.macroMealPercentages
            }
        });

        return {
            success: true,
            message: 'Plantilla de protocolo creada exitosamente',
            data: protocolTemplate
        };
    } catch (error) {
        console.log('[protocol-template.create] unexpected error:', error);

        return {
            success: false,
            message: 'Error al crear la plantilla de protocolo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function getProtocolTemplates(createdById: string) {
    try {
        const protocolTemplates = await prisma.protocolTemplate.findMany({
            where: {createdById},
            orderBy: {updatedAt: 'desc'}
        });

        return {
            success: true,
            data: protocolTemplates
        };
    } catch (error) {
        return {
            success: false,
            message: 'Error al obtener las plantillas de protocolo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
