import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {uploadAvatarForUser} from '@/lib/services/user-avatar.service';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return Response.json(
            {success: false, message: 'No autorizado'},
            {status: 401}
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!(file instanceof File)) {
            return Response.json(
                {success: false, message: 'Archivo de avatar requerido'},
                {status: 400}
            );
        }

        if (!file.type.startsWith('image/')) {
            return Response.json(
                {success: false, message: 'Solo se permiten imágenes'},
                {status: 400}
            );
        }

        if (file.size > MAX_AVATAR_SIZE_BYTES) {
            return Response.json(
                {success: false, message: 'El avatar no debe exceder 5MB'},
                {status: 400}
            );
        }

        const result = await uploadAvatarForUser({
            userId: currentUser.id,
            file
        });

        if (!result.success) {
            return Response.json(
                {success: false, message: result.message, error: result.error},
                {status: 500}
            );
        }

        return Response.json(
            {
                success: true,
                message: result.message,
                avatarUrl: result.avatarUrl
            },
            {status: 200}
        );
    } catch (error) {
        return Response.json(
            {
                success: false,
                message: 'Error al subir el avatar',
                error:
                    error instanceof Error ? error.message : 'Error desconocido'
            },
            {status: 500}
        );
    }
}
