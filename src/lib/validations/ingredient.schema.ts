import {z} from 'zod';

export const createIngredientSchema = z.object({
    name: z.string().min(1, 'Ingredient name is required'),
    description: z.string().optional()
});

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;

export const ingredientIdSchema = z.string().cuid('Invalid ingredient ID');

export type IngredientIdInput = z.infer<typeof ingredientIdSchema>;

export const createRecipeIngredientSchema = z.object({
    recipeId: z.string().cuid('Invalid recipe ID'),
    ingredientId: z.string().cuid('Invalid ingredient ID'),
    grams: z.number().positive('Grams must be a positive number')
});

export type CreateRecipeIngredientInput = z.infer<
    typeof createRecipeIngredientSchema
>;
