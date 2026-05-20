import {
    parseTwilioWhatsAppWebhook,
    parseWhatsAppWebhook,
    type ParsedWhatsAppMessage
} from '@/lib/webhooks/parse-whatsapp-webhook';
import twilio from 'twilio';

/**
 * WhatsApp Cloud API calls this once with GET to verify the callback URL.
 * @see https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (!verifyToken) {
        console.error(
            '[whatsapp/webhook] Missing WHATSAPP_WEBHOOK_VERIFY_TOKEN'
        );
        return Response.json(
            {error: {message: 'Webhook verify token is not configured'}},
            {status: 500}
        );
    }

    if (
        mode === 'subscribe' &&
        token === verifyToken &&
        typeof challenge === 'string' &&
        challenge.length > 0
    ) {
        return new Response(challenge, {
            status: 200,
            headers: {'Content-Type': 'text/plain'}
        });
    }

    return Response.json({error: {message: 'Forbidden'}}, {status: 403});
}

export async function POST(request: Request) {
    try {
        const raw = await request.text();

        if (!raw.trim()) {
            return Response.json(
                {error: {message: 'Empty request body'}},
                {status: 400}
            );
        }

        const contentType = request.headers.get('content-type') ?? '';
        let messages: ParsedWhatsAppMessage[];

        if (contentType.includes('application/x-www-form-urlencoded')) {
            messages = parseTwilioWhatsAppWebhook(new URLSearchParams(raw));
        } else if (raw.trimStart().startsWith('{')) {
            let body: unknown;
            try {
                body = JSON.parse(raw);
            } catch {
                const preview = raw.slice(0, 120).replace(/\s+/g, ' ');
                console.error('[whatsapp/webhook] Body is not JSON', {preview});

                return Response.json(
                    {
                        error: {
                            message:
                                'Body is not valid JSON. Meta sends application/json; plain text often means a proxy page (e.g. ngrok browser warning), a wrong URL, or a client not sending JSON.'
                        }
                    },
                    {status: 400}
                );
            }

            messages = parseWhatsAppWebhook(body);
        } else if (raw.includes('=')) {
            messages = parseTwilioWhatsAppWebhook(new URLSearchParams(raw));
        } else {
            const preview = raw.slice(0, 120).replace(/\s+/g, ' ');
            console.error('[whatsapp/webhook] Unrecognized body format', {
                preview,
                contentType
            });

            return Response.json(
                {
                    error: {
                        message:
                            'Unrecognized webhook body. Expected Meta JSON or Twilio form-urlencoded.'
                    }
                },
                {status: 400}
            );
        }

        const twiml = new twilio.twiml.MessagingResponse();

        for (const {phoneNumber, message, media} of messages) {
            console.log('[whatsapp/webhook] incoming message', {
                phoneNumber,
                message,
                media
            });
            twiml.message(`You said: ${message ?? '(no text)'}`);
        }

        return new Response(twiml.toString(), {
            status: 200,
            headers: {'Content-Type': 'text/xml'}
        });
    } catch (error) {
        console.error('[whatsapp/webhook] Failed to process webhook', error);

        return Response.json(
            {
                error: {
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Failed to process WhatsApp webhook'
                }
            },
            {status: 400}
        );
    }
}
