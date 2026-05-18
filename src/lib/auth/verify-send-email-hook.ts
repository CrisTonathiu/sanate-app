import crypto from 'crypto';

const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

type SendEmailHookPayload = {
    user: {
        email: string;
        user_metadata?: Record<string, unknown>;
    };
    email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
        token_new: string;
        token_hash_new: string;
    };
};

function getHookSecretBytes(secret: string) {
    const normalized = secret.startsWith('v1,whsec_')
        ? secret.slice('v1,whsec_'.length)
        : secret;

    return Buffer.from(normalized, 'base64');
}

function parseWebhookHeaders(headers: Headers) {
    return {
        id: headers.get('webhook-id') ?? '',
        timestamp: headers.get('webhook-timestamp') ?? '',
        signature: headers.get('webhook-signature') ?? ''
    };
}

function isTimestampValid(timestamp: string) {
    const webhookTime = Number.parseInt(timestamp, 10);

    if (!Number.isFinite(webhookTime)) {
        return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return Math.abs(now - webhookTime) <= WEBHOOK_TOLERANCE_SECONDS;
}

export function verifySendEmailHook(
    payload: string,
    headers: Headers,
    secret: string
): SendEmailHookPayload {
    const {id, timestamp, signature} = parseWebhookHeaders(headers);

    if (!id || !timestamp || !signature) {
        throw new Error('Missing webhook headers');
    }

    if (!isTimestampValid(timestamp)) {
        throw new Error('Webhook timestamp is outside tolerance');
    }

    const signedContent = `${id}.${timestamp}.${payload}`;
    const secretBytes = getHookSecretBytes(secret);
    const expected = crypto
        .createHmac('sha256', secretBytes)
        .update(signedContent)
        .digest('base64');

    const isValid = signature.split(' ').some((versionedSignature) => {
        const [version, providedSignature] = versionedSignature.split(',', 2);

        if (version !== 'v1' || !providedSignature) {
            return false;
        }

        const expectedBuffer = Buffer.from(expected);
        const providedBuffer = Buffer.from(providedSignature);

        if (expectedBuffer.length !== providedBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
    });

    if (!isValid) {
        throw new Error('Invalid webhook signature');
    }

    return JSON.parse(payload) as SendEmailHookPayload;
}
