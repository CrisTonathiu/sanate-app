import {verifySendEmailHook} from '@/lib/auth/verify-send-email-hook';
import {sendAuthEmail} from '@/lib/services/email/auth-email.service';

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

    try {
        const {user, email_data} = verifySendEmailHook(
            payload,
            request.headers,
            hookSecret
        );

        const {error} = await sendAuthEmail({
            email: user.email,
            emailActionType: email_data.email_action_type,
            tokenHash: email_data.token_hash,
            redirectTo: email_data.redirect_to,
            token: email_data.token
        });

        if (error) {
            console.error('[auth/send-email-hook] Resend error', error);
            return Response.json(
                {error: {message: error.message}},
                {status: 500}
            );
        }

        return Response.json({});
    } catch (error) {
        console.error('[auth/send-email-hook] Failed to process hook', error);

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
