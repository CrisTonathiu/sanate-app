import {z} from 'zod';

export const createRecipeSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    instructions: z.string(),
    mealType: z.enum(['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'])
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;

export const recipeIdSchema = z.string().cuid();

export type RecipeIdInput = z.infer<typeof recipeIdSchema>;
