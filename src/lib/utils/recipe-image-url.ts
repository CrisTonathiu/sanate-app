export function getSafeRecipeImageSrc(
    value?: string | null
): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    if (trimmed.startsWith('data:image/')) {
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed);

        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch {
        return null;
    }

    return null;
}

/** The PDF renderer (@react-pdf) can only draw JPEG and PNG images. */
export const RECIPE_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'] as const;

export const RECIPE_IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png';

export const RECIPE_IMAGE_FORMAT_ERROR =
    'Formato no permitido. Sube una imagen JPG o PNG.';

export function isAllowedRecipeImageType(mimeType: string): boolean {
    return (RECIPE_IMAGE_MIME_TYPES as readonly string[]).includes(
        mimeType.toLowerCase()
    );
}
