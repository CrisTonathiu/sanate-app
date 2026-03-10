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
    quantity: z.number().positive('Quantity must be a positive number'),
    unit: z.string().min(1, 'Unit is required')
});

export type CreateRecipeIngredientInput = z.infer<
    typeof createRecipeIngredientSchema
>;
