import {createAdminClient} from '@/lib/supabase/admin';

export type SupabaseUploadResult =
    | {
          success: true;
          bucket: string;
          path: string;
          contentType: string;
          publicUrl?: string;
          signedUrl?: string;
      }
    | {
          success: false;
          message: string;
          error?: string;
      };

export interface SupabaseUploadParams {
    bucket: string;
    file: File;
    pathPrefix?: string;
    fileName?: string;
    upsert?: boolean;
    generatePublicUrl?: boolean;
    signedUrlExpiresInSeconds?: number;
}

export async function uploadFileToSupabaseStorage(
    params: SupabaseUploadParams
): Promise<SupabaseUploadResult> {
    const {
        bucket,
        file,
        pathPrefix = 'uploads',
        fileName,
        upsert = false,
        generatePublicUrl = true,
        signedUrlExpiresInSeconds
    } = params;

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const safeFileName = fileName
        ? fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
        : `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
    const normalizedPrefix = pathPrefix.replace(/^\/+|\/+$/g, '');
    const filePath = normalizedPrefix
        ? `${normalizedPrefix}/${safeFileName}`
        : safeFileName;

    const supabase = createAdminClient();

    const {error: uploadError} = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            contentType: file.type,
            upsert
        });

    if (uploadError) {
        return {
            success: false,
            message: 'No se pudo subir el archivo',
            error: uploadError.message
        };
    }

    const result: SupabaseUploadResult = {
        success: true,
        bucket,
        path: filePath,
        contentType: file.type
    };

    if (generatePublicUrl) {
        const publicUrlResponse = await supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        if (!publicUrlResponse.data?.publicUrl) {
            return {
                success: false,
                message: 'No se pudo generar la URL pública del archivo',
                error: 'Public URL response missing from Supabase'
            };
        }

        result.publicUrl = publicUrlResponse.data.publicUrl;
    }

    if (signedUrlExpiresInSeconds && signedUrlExpiresInSeconds > 0) {
        const signedUrlResponse = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, signedUrlExpiresInSeconds);

        if (signedUrlResponse.error) {
            return {
                success: false,
                message: 'No se pudo generar la URL firmada del archivo',
                error: signedUrlResponse.error.message
            };
        }

        result.signedUrl = signedUrlResponse.data.signedUrl;
    }

    return result;
}
