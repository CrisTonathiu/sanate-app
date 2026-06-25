import {createClient} from '@/lib/supabase/server';
import {prisma} from '@/lib/prisma';
import {NextResponse} from 'next/server';

function getErrorRedirectPath(next: string) {
    if (next.startsWith('/restablecer-contrasena')) {
        return '/restablecer-contrasena';
    }

    if (next.startsWith('/recuperar-contrasena')) {
        return '/recuperar-contrasena';
    }

    return '/registro';
}

export async function GET(request: Request) {
    const {searchParams, origin} = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/portal';
    const errorDescription = searchParams.get('error_description');
    const errorRedirectPath = getErrorRedirectPath(next);
    const isRecoveryFlow = next.startsWith('/restablecer-contrasena');

    if (errorDescription) {
        return NextResponse.redirect(
            `${origin}${errorRedirectPath}?error=${encodeURIComponent(errorDescription)}`
        );
    }

    if (!code) {
        const invalidLinkMessage = isRecoveryFlow
            ? 'Enlace de recuperación inválido'
            : 'Enlace de confirmación inválido';

        return NextResponse.redirect(
            `${origin}${errorRedirectPath}?error=${encodeURIComponent(invalidLinkMessage)}`
        );
    }

    const supabase = await createClient();
    const {data, error} = await supabase.auth.exchangeCodeForSession(code);
    console.log('data', data);
    console.log('error', error);
    if (error || !data.user?.email) {
        const failureMessage = isRecoveryFlow
            ? 'No se pudo validar el enlace de recuperación'
            : error?.message || 'No se pudo confirmar la cuenta';

        return NextResponse.redirect(
            `${origin}${errorRedirectPath}?error=${encodeURIComponent(failureMessage)}`
        );
    }

    if (!isRecoveryFlow) {
        const email = data.user.email.trim();

        await prisma.user.updateMany({
            where: {
                email,
                isClaimed: false
            },
            data: {isClaimed: true}
        });
    }

    return NextResponse.redirect(`${origin}${next}`);
}
