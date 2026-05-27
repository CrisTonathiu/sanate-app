import {createElement} from 'react';
import {AuthEmail} from '@/emails/templates/auth-email';
import {
    buildSupabaseAuthVerifyUrl,
    type AuthEmailActionType
} from '@/lib/auth/build-verify-url';
import {resend} from '@/lib/config/resend';
import {prisma} from '@/lib/prisma';

type SendAuthEmailInput = {
    email: string;
    emailActionType: AuthEmailActionType | string;
    tokenHash: string;
    redirectTo: string;
    token?: string;
};

type AuthEmailCopy = {
    subject: string;
    title: string;
    body: string;
    ctaLabel: string;
};

function getFromEmailByActionType(emailActionType: AuthEmailActionType) {
    if (emailActionType === 'signup' || emailActionType === 'recovery') {
        return 'Zanate <noreply@zanate.mx>';
    }

    return process.env.RESEND_FROM_EMAIL || 'Zanate <hola@zanate.mx>';
}

function getSupabaseUrl() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL environment variable'
        );
    }

    return supabaseUrl;
}

function getAuthEmailCopy(
    emailActionType: AuthEmailActionType,
    firstName?: string | null
): AuthEmailCopy {
    const greeting = firstName?.trim() ? `${firstName.trim()}, ` : '';

    const copyByAction: Record<string, AuthEmailCopy> = {
        signup: {
            subject: 'Confirma tu cuenta en Zanate',
            title: 'Confirma tu correo',
            body: `${greeting}gracias por registrarte en Zanate. Confirma tu correo para activar tu cuenta y acceder al portal.`,
            ctaLabel: 'Confirmar cuenta'
        },
        recovery: {
            subject: 'Restablece tu contraseña en Zanate',
            title: 'Restablecer contraseña',
            body: `${greeting}recibimos una solicitud para restablecer tu contraseña. Usa el enlace para crear una nueva.`,
            ctaLabel: 'Restablecer contraseña'
        },
        magiclink: {
            subject: 'Tu enlace de acceso a Zanate',
            title: 'Iniciar sesión',
            body: `${greeting}usa este enlace para iniciar sesión en Zanate.`,
            ctaLabel: 'Iniciar sesión'
        },
        invite: {
            subject: 'Invitación a Zanate',
            title: 'Has sido invitado',
            body: `${greeting}te invitaron a unirte a Zanate. Acepta la invitación para continuar.`,
            ctaLabel: 'Aceptar invitación'
        },
        email_change: {
            subject: 'Confirma el cambio de correo en Zanate',
            title: 'Confirmar cambio de correo',
            body: `${greeting}confirma el cambio de correo de tu cuenta de Zanate.`,
            ctaLabel: 'Confirmar cambio'
        },
        email_change_new: {
            subject: 'Confirma tu nuevo correo en Zanate',
            title: 'Confirmar nuevo correo',
            body: `${greeting}confirma tu nueva dirección de correo en Zanate.`,
            ctaLabel: 'Confirmar correo'
        },
        reauthentication: {
            subject: 'Confirma tu identidad en Zanate',
            title: 'Verificación de seguridad',
            body: `${greeting}confirma tu identidad para continuar con esta acción en Zanate.`,
            ctaLabel: 'Confirmar identidad'
        }
    };

    return (
        copyByAction[emailActionType] ?? {
            subject: 'Acción requerida en Zanate',
            title: 'Continuar en Zanate',
            body: `${greeting}usa el enlace para continuar.`,
            ctaLabel: 'Continuar'
        }
    );
}

export async function sendAuthEmail({
    email,
    emailActionType,
    tokenHash,
    redirectTo,
    token
}: SendAuthEmailInput) {
    const dbUser = await prisma.user.findUnique({
        where: {email},
        select: {firstName: true}
    });

    const copy = getAuthEmailCopy(
        emailActionType as AuthEmailActionType,
        dbUser?.firstName
    );
    const confirmUrl = buildSupabaseAuthVerifyUrl(getSupabaseUrl(), {
        token_hash: tokenHash,
        email_action_type: emailActionType,
        redirect_to: redirectTo
    });

    return resend.emails.send({
        from: getFromEmailByActionType(emailActionType as AuthEmailActionType),
        to: email,
        subject: copy.subject,
        react: createElement(AuthEmail, {
            title: copy.title,
            body: copy.body,
            confirmUrl,
            ctaLabel: copy.ctaLabel,
            token
        })
    });
}
