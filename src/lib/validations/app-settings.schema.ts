import {z} from 'zod';

export const APP_SETTINGS_ID = 'default';

export const updateAppSettingsSchema = z
    .object({
        mixMainMeals: z.boolean().optional(),
        autoGenerateRecipeInstructions: z.boolean().optional()
    })
    .refine(input => Object.values(input).some(value => value !== undefined), {
        message: 'Se requiere al menos un ajuste'
    });

export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsSchema>;
