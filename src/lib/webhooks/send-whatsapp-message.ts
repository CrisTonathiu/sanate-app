import twilio from 'twilio';

function twilioClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    if (!accountSid || !authToken) {
        throw new Error(
            'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be configured'
        );
    }

    return twilio(accountSid, authToken);
}

/** Sends an outbound WhatsApp message (Twilio From/To from the inbound webhook). */
export async function sendWhatsAppMessage(input: {
    from: string;
    to: string;
    body: string;
}): Promise<void> {
    const from = input.from.trim();
    const to = input.to.trim();
    if (!from || !to) {
        throw new Error('Missing Twilio WhatsApp from/to addresses');
    }

    await twilioClient().messages.create({
        from,
        to,
        body: input.body
    });
}
