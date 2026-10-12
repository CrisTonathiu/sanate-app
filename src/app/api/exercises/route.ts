import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {
    EXERCISE_MAX_SIZE_BYTES,
    EXERCISE_MAX_SIZE_MB,
    EXERCISES_PATH_PREFIX,
    isExerciseCategory
} from '@/lib/config/exercise-config';

export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const title = typeof body.title === 'string' ? body.title.trim() : '';
        const category =
            typeof body.category === 'string' ? body.category.trim() : '';
        const description =
            typeof body.description === 'string' ? body.description.trim() : '';
        const fileName =
            typeof body.fileName === 'string' ? body.fileName.trim() : '';
        const storagePath =
            typeof body.storagePath === 'string' ? body.storagePath : '';
        const publicUrl =
            typeof body.publicUrl === 'string' ? body.publicUrl : '';
        const size = Number(body.size) || 0;

        if (!title || !category || !fileName || !storagePath || !publicUrl) {
            return NextResponse.json(
                {success: false, message: 'Faltan campos obligatorios'},
                {status: 400}
            );
        }

        if (!isExerciseCategory(category)) {
            return NextResponse.json(
                {success: false, message: 'Categoría no válida'},
                {status: 400}
            );
        }

        if (
            !fileName.toLowerCase().endsWith('.pdf') ||
            !storagePath.startsWith(`${EXERCISES_PATH_PREFIX}/`)
        ) {
            return NextResponse.json(
                {success: false, message: 'El archivo debe ser un PDF'},
                {status: 400}
            );
        }

        if (size > EXERCISE_MAX_SIZE_BYTES) {
            return NextResponse.json(
                {
                    success: false,
                    message: `El archivo no debe exceder ${EXERCISE_MAX_SIZE_MB}MB`
                },
                {status: 400}
            );
        }

        const exercise = await prisma.exercise.create({
            data: {
                title,
                description: description || null,
                category,
                fileName,
                size,
                storagePath,
                publicUrl,
                uploadedBy: {
                    connect: {id: currentUser.id}
                }
            }
        });

        return NextResponse.json(
            {
                success: true,
                data: {id: exercise.id},
                message: 'Ejercicio guardado correctamente'
            },
            {status: 201}
        );
    } catch (error) {
        console.error('Error saving exercise:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error al guardar el ejercicio'
            },
            {status: 500}
        );
    }
}
