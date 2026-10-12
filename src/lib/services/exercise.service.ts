import type {ExerciseCategory} from '@prisma/client';
import {prisma} from '../prisma';

export interface ExerciseItem {
    id: string;
    title: string;
    description: string | null;
    category: ExerciseCategory;
    fileName: string;
    size: number;
    publicUrl: string;
    uploadedAt: string;
}

function formatUploadedAt(createdAt: Date): string {
    return createdAt.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export async function fetchExercises(): Promise<ExerciseItem[]> {
    const exercises = await prisma.exercise.findMany({
        orderBy: [{category: 'asc'}, {createdAt: 'desc'}]
    });

    return exercises.map(exercise => ({
        id: exercise.id,
        title: exercise.title,
        description: exercise.description,
        category: exercise.category,
        fileName: exercise.fileName,
        size: exercise.size,
        publicUrl: exercise.publicUrl,
        uploadedAt: formatUploadedAt(exercise.createdAt)
    }));
}
