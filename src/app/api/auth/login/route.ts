import {createClient} from '@/lib/supabase/server';

export async function POST(req: Request) {
    const body = await req.json();
    const {email, password} = body;

    const supabase = await createClient();

    const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return Response.json(
            {message: 'Correo o contraseña incorrectos.'},
            {status: 401}
        );
    }

    return Response.json({
        user: data.user
    });
}
