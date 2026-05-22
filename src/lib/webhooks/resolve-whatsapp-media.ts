import type {WhatsAppWebhookMedia} from '@/lib/webhooks/parse-whatsapp-webhook';

function twilioBasicAuthHeader(): string {
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    if (!accountSid || !authToken) {
        throw new Error(
            'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be configured'
        );
    }

    return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
}

/** Downloads a Twilio WhatsApp image and returns a data URL for OpenAI vision. */
export async function fetchWhatsAppImageAsDataUrl(
    media: WhatsAppWebhookMedia
): Promise<string> {
    if (media.type !== 'image') {
        throw new Error('Media is not an image');
    }

    const response = await fetch(media.id, {
        headers: {Authorization: twilioBasicAuthHeader()}
    });
    if (!response.ok) {
        throw new Error(`Failed to download WhatsApp image (${response.status})`);
    }

    const bytes = await response.arrayBuffer();
    const mimeType =
        media.mimeType?.trim() ||
        response.headers.get('content-type')?.split(';')[0]?.trim() ||
        'image/jpeg';

    const base64 = Buffer.from(bytes).toString('base64');
    return `data:${mimeType};base64,${base64}`;
}
