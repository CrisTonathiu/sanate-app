import type {WhatsAppWebhookMedia} from '@/lib/webhooks/parse-whatsapp-webhook';

const GRAPH_API_VERSION = 'v21.0';

function whatsappAccessToken(): string {
    const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
    if (!token) {
        throw new Error('WHATSAPP_ACCESS_TOKEN must be configured');
    }

    return token;
}

/** Downloads a WhatsApp Cloud API image and returns a data URL for OpenAI vision. */
export async function fetchWhatsAppImageAsDataUrl(
    media: WhatsAppWebhookMedia
): Promise<string> {
    if (media.type !== 'image') {
        throw new Error('Media is not an image');
    }

    const accessToken = whatsappAccessToken();

    const mediaResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${media.id}`,
        {headers: {Authorization: `Bearer ${accessToken}`}}
    );
    if (!mediaResponse.ok) {
        throw new Error(`Failed to resolve WhatsApp media URL (${mediaResponse.status})`);
    }

    const mediaInfo = (await mediaResponse.json()) as {url?: string};
    if (!mediaInfo.url) {
        throw new Error('WhatsApp media response did not include a url');
    }

    const response = await fetch(mediaInfo.url, {
        headers: {Authorization: `Bearer ${accessToken}`}
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
