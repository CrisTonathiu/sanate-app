import {requireRole} from '@/lib/auth/requireRole';
import {createAdminClient} from '@/lib/supabase/admin';
import {
    isAllowedRecipeImageType,
    RECIPE_IMAGE_FORMAT_ERROR
} from '@/lib/utils/recipe-image-url';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const BUCKET_NAME =
    process.env.SUPABASE_RECIPE_IMAGES_BUCKET || 'recipe-images';

export async function POST(request: Request) {
    console.log('[uploads/recipes] POST request received');
    await requireRole('ADMIN');
    console.log('[uploads/recipes] Role check passed (ADMIN)');

    try {
        const formData = await request.formData();
        const file = formData.get('file');
        console.log('[uploads/recipes] formData parsed');

        if (!(file instanceof File)) {
            console.warn('[uploads/recipes] Missing file in formData');
            return Response.json(
                {success: false, message: 'Archivo de imagen requerido'},
                {status: 400}
            );
        }

        console.log('[uploads/recipes] File metadata', {
            name: file.name,
            type: file.type,
            size: file.size
        });

        if (!isAllowedRecipeImageType(file.type)) {
            console.warn('[uploads/recipes] Invalid file type', {
                type: file.type
            });
            return Response.json(
                {success: false, message: RECIPE_IMAGE_FORMAT_ERROR},
                {status: 400}
            );
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            console.warn('[uploads/recipes] File exceeds max size', {
                size: file.size,
                maxSize: MAX_FILE_SIZE_BYTES
            });
            return Response.json(
                {success: false, message: 'La imagen no debe exceder 5MB'},
                {status: 400}
            );
        }

        // Derive the extension from the validated MIME type, not the name.
        const fileExtension = file.type === 'image/png' ? 'png' : 'jpg';
        const filePath = `recipes/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
        console.log('[uploads/recipes] Uploading to Supabase bucket', {
            bucket: BUCKET_NAME,
            filePath
        });

        const supabase = createAdminClient();
        const {error: uploadError} = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('[uploads/recipes] Supabase upload failed', {
                message: uploadError.message
            });
            return Response.json(
                {
                    success: false,
                    message: 'No se pudo subir la imagen',
                    error: uploadError.message
                },
                {status: 500}
            );
        }

        const {data: publicUrlData} = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        console.log('[uploads/recipes] Upload succeeded', {
            bucket: BUCKET_NAME,
            filePath,
            imageUrl: publicUrlData.publicUrl
        });

        return Response.json(
            {
                success: true,
                message: 'Imagen subida exitosamente',
                data: {
                    imageUrl: publicUrlData.publicUrl,
                    path: filePath,
                    bucket: BUCKET_NAME
                }
            },
            {status: 200}
        );
    } catch (error) {
        console.error('[uploads/recipes] Unexpected error', error);
        return Response.json(
            {
                success: false,
                message: 'Error al subir la imagen',
                error:
                    error instanceof Error ? error.message : 'Error desconocido'
            },
            {status: 500}
        );
    }
}
