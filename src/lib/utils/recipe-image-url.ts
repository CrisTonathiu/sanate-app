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
