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

function inferTwilioMediaType(
    contentType: string
): WhatsAppWebhookMedia['type'] {
    if (contentType.startsWith('image/')) {
        return 'image';
    }
    if (contentType.startsWith('video/')) {
        return 'video';
    }
    if (contentType.startsWith('audio/')) {
        return 'audio';
    }
    if (contentType.includes('sticker')) {
        return 'sticker';
    }

    return 'document';
}

function twilioPhoneNumber(params: URLSearchParams): string | null {
    const waId = params.get('WaId')?.trim();
    if (waId) {
        return waId;
    }

    const from = params.get('From')?.trim();
    if (!from) {
        return null;
    }

    return from.replace(/^whatsapp:/i, '').replace(/^\+/, '') || null;
}

/** Twilio WhatsApp sends application/x-www-form-urlencoded. */
export function parseTwilioWhatsAppWebhook(
    params: URLSearchParams
): ParsedWhatsAppMessage[] {
    const smsStatus = params.get('SmsStatus');
    if (smsStatus && smsStatus !== 'received') {
        return [];
    }

    const phoneNumber = twilioPhoneNumber(params);
    const messageId =
        params.get('MessageSid')?.trim() ||
        params.get('SmsMessageSid')?.trim() ||
        '';

    if (!phoneNumber || !messageId) {
        return [];
    }

    const body = params.get('Body')?.trim() || null;
    const numMedia = Number.parseInt(params.get('NumMedia') ?? '0', 10);

    let media: WhatsAppWebhookMedia | null = null;
    if (numMedia > 0) {
        const mimeType = params.get('MediaContentType0')?.trim() ?? '';
        const mediaUrl = params.get('MediaUrl0')?.trim() ?? '';

        if (mediaUrl) {
            media = {
                type: inferTwilioMediaType(mimeType),
                id: mediaUrl,
                mimeType: mimeType || null,
                sha256: null,
                caption: body,
                filename: null
            };
        }
    }

    return [
        {
            phoneNumber,
            message: body,
            media,
            messageId,
            timestamp: ''
        }
    ];
}
