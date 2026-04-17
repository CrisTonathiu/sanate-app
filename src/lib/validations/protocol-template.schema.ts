import {z} from 'zod';

const optionalTrimmedStringSchema = z.preprocess(value => {
    if (typeof value !== 'string') {
        return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
}, z.string().trim().optional());

const optionalUrlSchema = z.preprocess(value => {
    if (typeof value !== 'string') {
        return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
}, z.string().url().optional());

const optionalNumberSchema = z.preprocess(value => {
    if (value === null || value === undefined || value === '') {
        return undefined;
    }

    return value;
}, z.number().finite().optional());

const mealIngredientPortionSchema = z.object({
    ingredientId: z.string().cuid().optional(),
    ingredientName: optionalTrimmedStringSchema,
    baseQuantity: optionalNumberSchema,
    targetQuantity: optionalNumberSchema,
    baseGrams: z.number().finite(),
    targetGrams: z.number().finite(),
    unit: optionalTrimmedStringSchema,
    baseCalories: optionalNumberSchema,
    baseProtein: optionalNumberSchema,
    baseCarbs: optionalNumberSchema,
    baseFat: optionalNumberSchema
});

const mealSlotSchema = z.object({
    id: z.string(),
    recipeName: z.string(),
    description: optionalTrimmedStringSchema,
    imageUrl: optionalUrlSchema,
    calories: z.number().finite(),
    protein: z.number().finite(),
    carbs: optionalNumberSchema,
    fat: optionalNumberSchema,
    portionMultiplier: optionalNumberSchema,
    isRealistic: z.boolean().optional(),
    warnings: z.array(z.string()).optional(),
    ingredientPortions: z.array(mealIngredientPortionSchema).optional()
});

const dayMealsSchema = z.object({
    day: z.string().trim().min(1),
    smoothie: mealSlotSchema.optional(),
    breakfast: mealSlotSchema.optional(),
    snack1: mealSlotSchema.optional(),
    snack2: mealSlotSchema.optional(),
    lunch: mealSlotSchema.optional(),
    dinner: mealSlotSchema.optional(),
    drinks: mealSlotSchema.optional()
});

export const createProtocolTemplateSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, 'El nombre de la plantilla debe tener al menos 3 caracteres'),
    description: optionalTrimmedStringSchema,
    createdById: z.string().min(1, 'ID de usuario no válido'),
    weeklyPlan: z
        .array(dayMealsSchema)
        .min(1, 'La plantilla debe incluir al menos un día'),
    planCalories: z.number().nonnegative().optional(),
    macroPercents: z.record(z.string(), z.number().finite()).optional(),
    enabledMeals: z.record(z.string(), z.boolean()).optional(),
    mealPercentages: z.record(z.string(), z.number().finite()).optional(),
    macroMealPercentages: z
        .record(z.string(), z.record(z.string(), z.number().finite()))
        .optional()
});

export type CreateProtocolTemplateInput = z.infer<
    typeof createProtocolTemplateSchema
>;
