import {
    classifyWhatsAppIntent,
    enrichClassifiedWhatsAppIntent,
    replyForWhatsAppIntent
} from '@/lib/webhooks/classify-whatsapp-intent';
import {
    replyForWhatsAppUserLookup,
    resolveWhatsAppUser
} from '@/lib/webhooks/resolve-whatsapp-user';
import {parseWhatsAppCloudWebhook} from '@/lib/webhooks/parse-whatsapp-webhook';
import {sendWhatsAppMessage} from '@/lib/webhooks/send-whatsapp-message';
import {after} from 'next/server';

const MENU_ANALYSIS_ACK =
    '🔍 Analizando el menú con tu plan semanal. Te respondo en unos segundos...';

export function GET(request: Request) {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const verifyToken = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && verifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
        return new Response(challenge ?? '', {status: 200});
    }

    return new Response('Forbidden', {status: 403});
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

        const body = JSON.parse(raw);
        const messages = parseWhatsAppCloudWebhook(body);

        for (const parsed of messages) {
            const lookup = await resolveWhatsAppUser(parsed.phoneNumber);

            if (lookup.status !== 'active') {
                console.log('[whatsapp/webhook] user lookup failed', {
                    phoneNumber: parsed.phoneNumber,
                    status: lookup.status
                });
                await sendWhatsAppMessage({
                    to: parsed.phoneNumber,
                    body: replyForWhatsAppUserLookup(lookup)
                });
                continue;
            }

            const classified = await enrichClassifiedWhatsAppIntent(
                classifyWhatsAppIntent(parsed),
                lookup.userId
            );

            console.log('[whatsapp/webhook] incoming message', {
                phoneNumber: parsed.phoneNumber,
                userId: lookup.userId,
                message: parsed.message,
                media: parsed.media,
                intent: classified.intent,
                meal: classified.meal,
                todayMeal: classified.todayMeal
                    ? {
                          id: classified.todayMeal.id,
                          name: classified.todayMeal.name,
                          image: classified.todayMeal.image
                      }
                    : null,
                weekPlanDays: classified.weekPlan?.length ?? 0
            });

            const isMenuPhotoAnalysis =
                classified.intent === 'MENU_ANALYSIS' &&
                parsed.media?.type === 'image';

            if (isMenuPhotoAnalysis) {
                await sendWhatsAppMessage({
                    to: parsed.phoneNumber,
                    body: MENU_ANALYSIS_ACK
                });

                after(async () => {
                    try {
                        const reply = await replyForWhatsAppIntent(classified, {
                            media: parsed.media
                        });
                        await sendWhatsAppMessage({
                            to: parsed.phoneNumber,
                            body: reply
                        });
                    } catch (error) {
                        console.error(
                            '[whatsapp/webhook] MENU_ANALYSIS async failed',
                            error instanceof Error ? error.message : error
                        );

                        try {
                            await sendWhatsAppMessage({
                                to: parsed.phoneNumber,
                                body: 'No pude analizar la foto del menú. Intenta enviar una imagen más clara o vuelve a intentar en un momento.'
                            });
                        } catch (sendError) {
                            console.error(
                                '[whatsapp/webhook] Failed to send MENU_ANALYSIS error reply',
                                sendError instanceof Error
                                    ? sendError.message
                                    : sendError
                            );
                        }
                    }
                });

                continue;
            }

            await sendWhatsAppMessage({
                to: parsed.phoneNumber,
                body: await replyForWhatsAppIntent(classified, {media: parsed.media})
            });
        }

        return Response.json({success: true});
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
