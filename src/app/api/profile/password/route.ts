import {createClient} from '@/lib/supabase/server';
import {changePasswordSchema} from '@/lib/validations/profile.schema';

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
        return Response.json(
            {
                success: false,
                message:
                    parsed.error.issues[0]?.message ?? 'Error de validación'
            },
            {status: 400}
        );
    }

    const {currentPassword, newPassword} = parsed.data;

    if (currentPassword === newPassword) {
        return Response.json(
            {
                success: false,
                message: 'La nueva contraseña debe ser distinta a la actual'
            },
            {status: 400}
        );
    }

    const supabase = await createClient();

    const {
        data: {user},
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
        return Response.json(
            {success: false, message: 'No autorizado'},
            {status: 401}
        );
    }

    const {error: signInError} = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
    });

    if (signInError) {
        return Response.json(
            {success: false, message: 'La contraseña actual es incorrecta'},
            {status: 400}
        );
    }

    const {error} = await supabase.auth.updateUser({password: newPassword});

    if (error) {
        return Response.json(
            {success: false, message: 'No se pudo actualizar la contraseña'},
            {status: 500}
        );
    }

    return Response.json({success: true});
}
