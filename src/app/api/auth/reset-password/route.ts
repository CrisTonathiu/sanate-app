import {createClient} from '@/lib/supabase/server';

export async function POST(req: Request) {
    const body = await req.json();
    const password =
        typeof body.password === 'string' ? body.password : '';

    if (password.length < 8) {
        return Response.json(
            {message: 'La contraseña debe tener al menos 8 caracteres'},
            {status: 400}
        );
    }

    const supabase = await createClient();

    const {
        data: {user},
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return Response.json(
            {
                message:
                    'El enlace de recuperación no es válido o expiró. Solicita uno nuevo.'
            },
            {status: 401}
        );
    }

    const {error} = await supabase.auth.updateUser({password});

    if (error) {
        return Response.json(
            {message: 'No se pudo actualizar la contraseña'},
            {status: 500}
        );
    }

    await supabase.auth.signOut();

    return Response.json({success: true});
}
