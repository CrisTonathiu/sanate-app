import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {createAdminClient} from '@/lib/supabase/admin';
import {EXERCISES_BUCKET} from '@/lib/config/exercise-config';

export async function DELETE(
    _request: NextRequest,
    {params}: {params: Promise<{exerciseId: string}>}
) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                {success: false, message: 'Unauthorized'},
                {status: 401}
            );
        }

        if (currentUser.role === 'PATIENT') {
            return NextResponse.json(
                {success: false, message: 'Forbidden'},
                {status: 403}
            );
        }

        const {exerciseId} = await params;

        const exercise = await prisma.exercise.findUnique({
            where: {id: exerciseId}
        });

        if (!exercise) {
            return NextResponse.json(
                {success: false, message: 'Ejercicio no encontrado'},
                {status: 404}
            );
        }

        await prisma.exercise.delete({where: {id: exerciseId}});

        // The record is already gone for patients; a leftover file is harmless.
        const {error: removeError} = await createAdminClient()
            .storage.from(EXERCISES_BUCKET)
            .remove([exercise.storagePath]);

        if (removeError) {
            console.error('Error removing exercise file:', removeError.message);
        }

        return NextResponse.json({
            success: true,
            message: 'Ejercicio eliminado correctamente'
        });
    } catch (error) {
        console.error('Error deleting exercise:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error al eliminar el ejercicio'
            },
            {status: 500}
        );
    }
}
