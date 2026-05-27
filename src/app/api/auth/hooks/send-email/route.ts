import {verifySendEmailHook} from '@/lib/auth/verify-send-email-hook';
import {sendAuthEmail} from '@/lib/services/email/auth-email.service';

function maskEmail(email: string) {
    const at = email.indexOf('@');
    if (at <= 1) return '***';
    return `${email.slice(0, 1)}***${email.slice(at - 1)}`;
}

export async function POST(request: Request) {
    const hookSecret = process.env.SEND_EMAIL_HOOK_SECRET;

    if (!hookSecret) {
        console.error('[auth/send-email-hook] Missing SEND_EMAIL_HOOK_SECRET');
        return Response.json(
            {error: {message: 'Hook secret is not configured'}},
            {status: 500}
        );
    }

    const payload = await request.text();
    const requestId =
        globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

    console.log('[auth/send-email-hook] Received hook', {
        requestId,
        method: 'POST',
        payloadLength: payload.length,
        contentType: request.headers.get('content-type'),
        hasSignatureHeader:
            Boolean(request.headers.get('x-supabase-signature')) ||
            Boolean(request.headers.get('x-webhook-signature')),
        userAgent: request.headers.get('user-agent')
    });

    try {
        const {user, email_data} = verifySendEmailHook(
            payload,
            request.headers,
            hookSecret
        );

        console.log('[auth/send-email-hook] Verified hook; sending email', {
            requestId,
            email: maskEmail(user.email),
            emailActionType: email_data.email_action_type,
            redirectTo: email_data.redirect_to
        });

        const {error} = await sendAuthEmail({
            email: user.email,
            emailActionType: email_data.email_action_type,
            tokenHash: email_data.token_hash,
            redirectTo: email_data.redirect_to,
            token: email_data.token
        });

        if (error) {
            console.error('[auth/send-email-hook] Resend error', {
                requestId,
                message: error.message,
                name: (error as unknown as {name?: string})?.name
            });
            return Response.json(
                {error: {message: error.message}},
                {status: 500}
            );
        }

        console.log('[auth/send-email-hook] Email sent', {requestId});
        return Response.json({});
    } catch (error) {
        console.error('[auth/send-email-hook] Failed to process hook', {
            requestId,
            error
        });

        return Response.json(
            {
                error: {
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Failed to process send email hook'
                }
            },
            {status: 401}
        );
    }
}
