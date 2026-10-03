export type WhatsAppWebhookMedia = {
    type: 'image' | 'video' | 'audio' | 'document' | 'sticker';
    id: string;
    mimeType: string | null;
    sha256: string | null;
    caption: string | null;
    filename: string | null;
};

export type ParsedWhatsAppMessage = {
    phoneNumber: string;
    message: string | null;
    media: WhatsAppWebhookMedia | null;
    messageId: string;
    timestamp: string;
};

type CloudApiMediaField = {
    id: string;
    mime_type?: string;
    sha256?: string;
    caption?: string;
    filename?: string;
};

type CloudApiMessage = {
    id: string;
    from: string;
    timestamp: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | string;
    text?: {body: string};
    image?: CloudApiMediaField;
    video?: CloudApiMediaField;
    audio?: CloudApiMediaField;
    document?: CloudApiMediaField;
    sticker?: CloudApiMediaField;
};

function mediaFromCloudApiMessage(
    message: CloudApiMessage
): WhatsAppWebhookMedia | null {
    const type = message.type;
    if (
        type !== 'image' &&
        type !== 'video' &&
        type !== 'audio' &&
        type !== 'document' &&
        type !== 'sticker'
    ) {
        return null;
    }

    const field = message[type];
    if (!field) {
        return null;
    }

    return {
        type,
        id: field.id,
        mimeType: field.mime_type ?? null,
        sha256: field.sha256 ?? null,
        caption: field.caption ?? null,
        filename: field.filename ?? null
    };
}

/** WhatsApp Cloud API sends a JSON payload with entry[].changes[].value.messages[]. */
export function parseWhatsAppCloudWebhook(body: unknown): ParsedWhatsAppMessage[] {
    const entries = (body as {entry?: unknown[]})?.entry;
    if (!Array.isArray(entries)) {
        return [];
    }

    const parsed: ParsedWhatsAppMessage[] = [];

    for (const entry of entries) {
        const changes = (entry as {changes?: unknown[]})?.changes;
        if (!Array.isArray(changes)) {
            continue;
        }

        for (const change of changes) {
            const messages = (change as {value?: {messages?: CloudApiMessage[]}})
                ?.value?.messages;
            if (!Array.isArray(messages)) {
                continue;
            }

            for (const message of messages) {
                if (!message?.from || !message?.id) {
                    continue;
                }

                parsed.push({
                    phoneNumber: message.from.trim(),
                    message: message.text?.body?.trim() || null,
                    media: mediaFromCloudApiMessage(message),
                    messageId: message.id,
                    timestamp: message.timestamp ?? ''
                });
            }
        }
    }

    return parsed;
}
