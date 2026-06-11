import {z} from 'zod';

const optionalMacro = z
    .union([z.number().min(0), z.null()])
    .optional()
    .transform(value => (value === undefined ? undefined : value));

export const createFoodSchema = z.object({
    name: z.string().trim().min(1, 'El nombre es obligatorio'),
    groupId: z.string().trim().cuid('Grupo inválido'),
    proteinPer100g: optionalMacro,
    carbsPer100g: optionalMacro,
    fatPer100g: optionalMacro,
    caloriesPer100g: optionalMacro,
    density: z
        .union([z.number().positive('La densidad debe ser mayor a 0'), z.null()])
        .optional()
        .transform(value => (value === undefined ? undefined : value)),
    isDiscrete: z.boolean().optional(),
    maxPortionGrams: z
        .union([z.number().positive(), z.null()])
        .optional()
        .transform(value => (value === undefined ? undefined : value))
});

export type CreateFoodInput = z.infer<typeof createFoodSchema>;

export const updateFoodSchema = createFoodSchema;

export type UpdateFoodInput = z.infer<typeof updateFoodSchema>;

export const foodIdSchema = z.string().trim().cuid('ID de alimento inválido');

export type FoodIdInput = z.infer<typeof foodIdSchema>;
