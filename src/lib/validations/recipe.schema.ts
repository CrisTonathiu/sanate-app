import {z} from 'zod';
import {MealType} from '@prisma/client';
import {getSafeRecipeImageSrc} from '@/lib/utils/recipe-image-url';

const optionalRecipeImageUrlSchema = z.preprocess(value => {
    if (typeof value !== 'string') {
        return undefined;
    }

    return getSafeRecipeImageSrc(value) ?? undefined;
}, z.string().url().optional());

const ingredientUnitSchema = z.enum([
    'GRAM',
    'PIECE',
    'CUP',
    'TBSP',
    'TSP',
    'ML',
    'OZ'
]);

export const createRecipeSchema = z.object({
    title: z.string(),
    imageUrl: optionalRecipeImageUrlSchema,
    mealType: z.nativeEnum(MealType),
    ingredients: z.array(
        z.object({
            foodId: z.string().trim().cuid('Invalid food ID'),
            quantity: z.number().positive().optional(),
            unit: ingredientUnitSchema.optional(),
            grams: z.number().positive().optional()
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
