import {uploadFileToSupabaseStorage} from '@/lib/services/supabase/storage.service';
import {updateUserAvatarUrl} from './user.service';

export interface UploadAvatarResult {
    success: boolean;
    message: string;
    avatarUrl?: string;
    user?: {
        id: string;
        avatarUrl: string | null;
    };
    error?: string;
}

export async function uploadAvatarForUser({
    userId,
    file
}: {
    userId: string;
    file: File;
}): Promise<UploadAvatarResult> {
    if (!file.type.startsWith('image/')) {
        return {
            success: false,
            message: 'Solo se permiten imágenes para el avatar',
            error: 'Unsupported file type'
        };
    }

    const bucket = process.env.SUPABASE_AVATAR_BUCKET || 'avatars';
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExtension}`;

    const uploadResult = await uploadFileToSupabaseStorage({
        bucket,
        file,
        pathPrefix: 'avatars',
        fileName,
        upsert: true,
        generatePublicUrl: true
    });

    if (!uploadResult.success || !uploadResult.publicUrl) {
        return {
            success: false,
            message: 'No se pudo subir el avatar',
            error: 'Upload failed'
        };
    }

    const updateResult = await updateUserAvatarUrl(
        userId,
        uploadResult.publicUrl
    );

    if (!updateResult.success) {
        return {
            success: false,
            message: 'El avatar se subió, pero no se pudo guardar en el perfil',
            error: 'Update failed'
        };
    }

    return {
        success: true,
        message: 'Avatar actualizado correctamente',
        avatarUrl: uploadResult.publicUrl
    };
}
