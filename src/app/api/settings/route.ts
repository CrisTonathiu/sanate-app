import {requireRole} from '@/lib/auth/requireRole';
import {
    getAppSettings,
    updateAppSettings
} from '@/lib/services/settings/app-settings.service';
import {updateAppSettingsSchema} from '@/lib/validations/app-settings.schema';
import {ZodError} from 'zod';

export async function GET() {
    await requireRole('ADMIN');

    const settings = await getAppSettings();

    return Response.json({success: true, data: settings});
}

export async function PATCH(request: Request) {
    const user = await requireRole('ADMIN');

    try {
        const body = await request.json();
        const validatedInput = updateAppSettingsSchema.parse(body);
        const result = await updateAppSettings(validatedInput, user.id);

        return Response.json(result, {status: result.success ? 200 : 400});
    } catch (error) {
        if (error instanceof ZodError) {
            return Response.json(
                {
                    success: false,
                    message: 'Error de validación',
                    errors: error.flatten()
                },
                {status: 400}
            );
        }

        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'Error al actualizar la configuración'
            },
            {status: 500}
        );
    }
}
