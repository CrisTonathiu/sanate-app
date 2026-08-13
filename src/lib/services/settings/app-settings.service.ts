import {prisma} from '@/lib/prisma';
import {
    APP_SETTINGS_ID,
    UpdateAppSettingsInput,
    updateAppSettingsSchema
} from '@/lib/validations/app-settings.schema';
import {ZodError} from 'zod';

const settingsSelect = {
    id: true,
    mixMainMeals: true,
    updatedById: true,
    createdAt: true,
    updatedAt: true
} as const;

export type AppSettingsDTO = {
    id: string;
    mixMainMeals: boolean;
    updatedById: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export async function getAppSettings(): Promise<AppSettingsDTO> {
    return prisma.appSettings.upsert({
        where: {id: APP_SETTINGS_ID},
        create: {
            id: APP_SETTINGS_ID,
            mixMainMeals: false
        },
        update: {},
        select: settingsSelect
    });
}

export async function updateAppSettings(
    input: UpdateAppSettingsInput,
    updatedById?: string
) {
    try {
        const validatedInput = updateAppSettingsSchema.parse(input);

        const settings = await prisma.appSettings.upsert({
            where: {id: APP_SETTINGS_ID},
            create: {
                id: APP_SETTINGS_ID,
                mixMainMeals: validatedInput.mixMainMeals,
                updatedById: updatedById ?? null
            },
            update: {
                mixMainMeals: validatedInput.mixMainMeals,
                updatedById: updatedById ?? null
            },
            select: settingsSelect
        });

        return {success: true as const, data: settings};
    } catch (error) {
        if (error instanceof ZodError) {
            return {
                success: false as const,
                message: 'Error de validación',
                errors: error.flatten()
            };
        }

        return {
            success: false as const,
            message: 'No se pudieron guardar los ajustes'
        };
    }
}
