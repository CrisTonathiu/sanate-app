import {createClient} from '@/lib/supabase/server';
import {prisma} from '@/lib/prisma';
import {NextResponse} from 'next/server';

export async function GET(request: Request) {
    const {searchParams, origin} = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/portal';
    const errorDescription = searchParams.get('error_description');

    if (errorDescription) {
        return NextResponse.redirect(
            `${origin}/registro?error=${encodeURIComponent(errorDescription)}`
        );
    }

    if (!code) {
        return NextResponse.redirect(
            `${origin}/registro?error=${encodeURIComponent('Enlace de confirmación inválido')}`
        );
    }

    const supabase = await createClient();
    const {data, error} = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user?.email) {
        return NextResponse.redirect(
            `${origin}/registro?error=${encodeURIComponent(
                error?.message || 'No se pudo confirmar la cuenta'
            )}`
        );
    }

    const email = data.user.email.trim();

    await prisma.user.updateMany({
        where: {
            email,
            isClaimed: false
        },
        data: {isClaimed: true}
    });

    return NextResponse.redirect(`${origin}${next}`);
}
