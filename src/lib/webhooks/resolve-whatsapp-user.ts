import {prisma} from '@/lib/prisma';

export type WhatsAppUserLookupResult =
    | {status: 'active'; userId: string; firstName: string}
    | {status: 'inactive'}
    | {status: 'not_found'};

function toPhoneDigits(phone: string): string {
    return phone.replace(/\D/g, '');
}

function phonesMatch(incomingDigits: string, stored: string | null): boolean {
    if (!stored) {
        return false;
    }

    const storedDigits = toPhoneDigits(stored);
    if (!storedDigits) {
        return false;
    }

    if (incomingDigits === storedDigits) {
        return true;
    }

    const shorter =
        incomingDigits.length <= storedDigits.length
            ? incomingDigits
            : storedDigits;
    const longer =
        incomingDigits.length > storedDigits.length
            ? incomingDigits
            : storedDigits;

    return shorter.length >= 10 && longer.endsWith(shorter);
}

export async function resolveWhatsAppUser(
    phoneNumber: string
): Promise<WhatsAppUserLookupResult> {
    const incomingDigits = toPhoneDigits(phoneNumber);
    const last10 = incomingDigits.slice(-10);

    if (last10.length < 10) {
        return {status: 'not_found'};
    }

    const candidates = await prisma.user.findMany({
        where: {
            role: 'PATIENT',
            deletedAt: null,
            OR: [
                {whatsappNumber: {contains: last10}},
                {phone: {contains: last10}}
            ]
        },
        select: {
            id: true,
            firstName: true,
            isActive: true,
            phone: true,
            whatsappNumber: true
        }
    });

    const matched = candidates.filter(
        user =>
            phonesMatch(incomingDigits, user.whatsappNumber) ||
            phonesMatch(incomingDigits, user.phone)
    );

    if (matched.length === 0) {
        return {status: 'not_found'};
    }

    if (matched.length > 1) {
        console.warn('[whatsapp/webhook] Multiple users matched phone', {
            phoneNumber,
            userIds: matched.map(user => user.id)
        });
    }

    const user = matched[0];

    if (!user.isActive) {
        return {status: 'inactive'};
    }

    return {
        status: 'active',
        userId: user.id,
        firstName: user.firstName
    };
}

export function replyForWhatsAppUserLookup(
    lookup: WhatsAppUserLookupResult
): string {
    switch (lookup.status) {
        case 'active':
            return '';
        case 'inactive':
            return 'Tu cuenta no está activa. Contacta a tu nutrióloga para reactivarla.';
        case 'not_found':
            return 'No encontramos tu número registrado. Si eres paciente de Zanate, pide a tu nutrióloga que actualice tu teléfono en el sistema.';
    }
}
