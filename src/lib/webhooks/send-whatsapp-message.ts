import {splitWhatsAppBody} from '@/lib/webhooks/split-whatsapp-body';

const GRAPH_API_VERSION = 'v21.0';

function whatsappCredentials(): {accessToken: string; phoneNumberId: string} {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    if (!accessToken || !phoneNumberId) {
        throw new Error(
            'WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be configured'
        );
    }

    return {accessToken, phoneNumberId};
}

/** Sends an outbound WhatsApp message via the Cloud API. */
export async function sendWhatsAppMessage(input: {
    to: string;
    body: string;
}): Promise<void> {
    const to = input.to.trim();
    if (!to) {
        throw new Error('Missing WhatsApp recipient number');
    }

    const {accessToken, phoneNumberId} = whatsappCredentials();
    const parts = splitWhatsAppBody(input.body);

    for (const body of parts) {
        const response = await fetch(
            `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to,
                    type: 'text',
                    text: {body}
                })
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Failed to send WhatsApp message (${response.status}): ${errorBody}`
            );
        }
    }
}
