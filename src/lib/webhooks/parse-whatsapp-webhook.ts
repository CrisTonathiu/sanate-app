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

type MediaPayload = {
    id?: string;
    mime_type?: string;
    sha256?: string;
    caption?: string;
    filename?: string;
};

type IncomingMessage = {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: {body?: string};
    image?: MediaPayload;
    video?: MediaPayload;
    audio?: MediaPayload;
    document?: MediaPayload;
    sticker?: MediaPayload;
};

type WebhookChange = {
    value?: {
        messages?: IncomingMessage[];
    };
};

type WebhookEntry = {
    changes?: WebhookChange[];
};

type WhatsAppWebhookBody = {
    entry?: WebhookEntry[];
};

const MEDIA_FIELDS = [
    {type: 'image' as const, key: 'image'},
    {type: 'video' as const, key: 'video'},
    {type: 'audio' as const, key: 'audio'},
    {type: 'document' as const, key: 'document'},
    {type: 'sticker' as const, key: 'sticker'}
] as const;

function parseMedia(
    message: IncomingMessage
): WhatsAppWebhookMedia | null {
    for (const {type, key} of MEDIA_FIELDS) {
        const payload = message[key];
        if (!payload?.id) {
            continue;
        }

        return {
            type,
            id: payload.id,
            mimeType: payload.mime_type ?? null,
            sha256: payload.sha256 ?? null,
            caption: payload.caption ?? null,
            filename: payload.filename ?? null
        };
    }

    return null;
}

function parseMessageText(message: IncomingMessage): string | null {
    if (message.type === 'text') {
        return message.text?.body?.trim() || null;
    }

    const media = parseMedia(message);
    return media?.caption?.trim() || null;
}

function parseIncomingMessage(
    message: IncomingMessage
): ParsedWhatsAppMessage | null {
    if (!message.from || !message.id) {
        return null;
    }

    const media = parseMedia(message);

    return {
        phoneNumber: message.from,
        message: parseMessageText(message),
        media,
        messageId: message.id,
        timestamp: message.timestamp
    };
}

export function parseWhatsAppWebhook(
    body: unknown
): ParsedWhatsAppMessage[] {
    const payload = body as WhatsAppWebhookBody;
    const parsed: ParsedWhatsAppMessage[] = [];

    for (const entry of payload.entry ?? []) {
        for (const change of entry.changes ?? []) {
            for (const message of change.value?.messages ?? []) {
                const result = parseIncomingMessage(message);
                if (result) {
                    parsed.push(result);
                }
            }
        }
    }

    return parsed;
}

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

/** Twilio WhatsApp sends application/x-www-form-urlencoded (not Meta JSON). */
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
