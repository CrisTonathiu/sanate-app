import {createClient} from '@/lib/supabase/server';
import {getAuthCallbackUrl} from '@/lib/auth/auth-urls';

export async function POST(req: Request) {
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!email) {
        return Response.json(
            {message: 'Ingresa tu correo electrónico'},
            {status: 400}
        );
    }

    const supabase = await createClient();

    const {error} = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthCallbackUrl('/restablecer-contrasena')
    });

    if (error) {
        return Response.json(
            {message: 'No se pudo enviar el correo de recuperación'},
            {status: 500}
        );
    }

    return Response.json({success: true});
}
