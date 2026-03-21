import {z} from 'zod';
import {MealType} from '@prisma/client';

export const createRecipeSchema = z.object({
    title: z.string(),
    mealType: z.nativeEnum(MealType),
    ingredients: z.array(
        z.object({
            foodId: z.string(),
            grams: z.number()
        })
    ),
    extraIngredients: z
        .array(
            z.object({
                name: z.string().trim().min(1)
            })
        )
        .optional(),
    steps: z
        .array(
            z.object({
                instruction: z.string().trim().min(1)
            })
        )
        .optional()
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;

export const recipeIdSchema = z.string().cuid();

export type RecipeIdInput = z.infer<typeof recipeIdSchema>;
