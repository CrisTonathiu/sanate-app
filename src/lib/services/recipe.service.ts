import {
    CreateRecipeInput,
    createRecipeSchema
} from '../validations/recipe.schema';
import {prisma} from '../prisma';
import {ZodError} from 'zod';

export async function createRecipe(
    input: CreateRecipeInput,
    nutritionistId: string
) {
    try {
        const validatedInput = createRecipeSchema.parse(input);

        const result = await prisma.$transaction(async tx => {
            const recipe = await tx.recipe.create({
                data: {
                    title: validatedInput.title,
                    description: validatedInput.description,
                    instructions: validatedInput.instructions,
                    mealType: validatedInput.mealType
                }
            });
            return recipe;
        });
        return {
            success: true,
            message: 'Receta creada exitosamente',
            data: result
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
            message: 'Error al crear el paciente',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
