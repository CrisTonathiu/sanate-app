import {z} from 'zod';

export const ingredientGroupColorSchema = z
    .string()
    .trim()
    .min(1, 'El color es obligatorio');

export const createIngredientGroupSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'El nombre es obligatorio')
        .max(80, 'El nombre es demasiado largo'),
    color: ingredientGroupColorSchema,
    foodIds: z
        .array(z.string().trim().cuid('Alimento inválido'))
        .min(1, 'Agrega al menos un alimento al grupo')
});

export type CreateIngredientGroupInput = z.infer<
    typeof createIngredientGroupSchema
>;

export const updateIngredientGroupSchema = createIngredientGroupSchema;

export type UpdateIngredientGroupInput = z.infer<
    typeof updateIngredientGroupSchema
>;

export const ingredientGroupIdSchema = z
    .string()
    .trim()
    .cuid('ID de grupo inválido');

export type IngredientGroupIdInput = z.infer<typeof ingredientGroupIdSchema>;
