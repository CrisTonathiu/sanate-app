import {z} from 'zod';

export const APP_SETTINGS_ID = 'default';

export const updateAppSettingsSchema = z.object({
    mixMainMeals: z.boolean()
});

export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsSchema>;
