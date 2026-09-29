import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {prisma} from '@/lib/prisma';
import {updateProfileSchema} from '@/lib/validations/profile.schema';

export async function PATCH(request: Request) {
    const user = await getCurrentUser();

    if (!user) {
        return Response.json(
            {success: false, message: 'No autorizado'},
            {status: 401}
        );
    }

    const body = await request.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);

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

    const updated = await prisma.user.update({
        where: {id: user.id},
        data: {
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName
        },
        select: {firstName: true, lastName: true}
    });

    return Response.json({success: true, data: updated});
}
