import {z} from 'zod';

const ingredientUnitSchema = z.enum([
    'GRAM',
    'PIECE',
    'CUP',
    'TBSP',
    'TSP',
    'ML',
    'OZ'
]);

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
    quantity: z.number().positive().optional(),
    unit: ingredientUnitSchema.optional(),
    grams: z.number().positive().optional()
});

export type CreateRecipeIngredientInput = z.infer<
    typeof createRecipeIngredientSchema
>;
