/** Twilio WhatsApp (and Programmable Messaging) max body length per send. */
export const WHATSAPP_BODY_MAX_LENGTH = 1600;

/**
 * Splits a long reply into chunks that fit Twilio's per-message limit.
 * Prefers paragraph, line, then word boundaries.
 */
export function splitWhatsAppBody(
    body: string,
    maxLength = WHATSAPP_BODY_MAX_LENGTH
): string[] {
    const trimmed = body.trim();
    if (!trimmed) {
        return [];
    }

    if (trimmed.length <= maxLength) {
        return [trimmed];
    }

    const chunks: string[] = [];
    let remaining = trimmed;

    while (remaining.length > maxLength) {
        let splitAt = remaining.lastIndexOf('\n\n', maxLength);
        if (splitAt < maxLength * 0.4) {
            splitAt = remaining.lastIndexOf('\n', maxLength);
        }
        if (splitAt < maxLength * 0.4) {
            splitAt = remaining.lastIndexOf(' ', maxLength);
        }
        if (splitAt <= 0) {
            splitAt = maxLength;
        }

        const chunk = remaining.slice(0, splitAt).trim();
        if (chunk) {
            chunks.push(chunk);
        }
        remaining = remaining.slice(splitAt).trim();
    }

    if (remaining) {
        chunks.push(remaining);
    }

    return chunks;
}
