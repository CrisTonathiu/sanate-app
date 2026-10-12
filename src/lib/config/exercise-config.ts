import type {ExerciseCategory} from '@prisma/client';

export const EXERCISES_BUCKET = 'exercises';
export const EXERCISES_PATH_PREFIX = 'exercise';
export const EXERCISE_MAX_SIZE_MB = 30;
export const EXERCISE_MAX_SIZE_BYTES = EXERCISE_MAX_SIZE_MB * 1024 * 1024;

// Keyed by the Prisma enum so a new category fails to compile until labeled.
export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
    PRINCIPIANTE: 'Principiante',
    AVANZADO: 'Avanzado'
};

export const EXERCISE_CATEGORIES = Object.keys(
    EXERCISE_CATEGORY_LABELS
) as ExerciseCategory[];

export function isExerciseCategory(value: unknown): value is ExerciseCategory {
    return EXERCISE_CATEGORIES.includes(value as ExerciseCategory);
}

export function getExerciseCategoryLabel(category: ExerciseCategory): string {
    return EXERCISE_CATEGORY_LABELS[category];
}

export function isPdfFile(file: {name: string; type: string}): boolean {
    return (
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf')
    );
}

export function formatExerciseFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Supabase serves the file as an attachment when `download` is present.
export function buildExerciseDownloadUrl(
    publicUrl: string,
    title: string
): string {
    const safeTitle = title.replace(/[\\/:*?"<>|]/g, ' ').trim() || 'ejercicio';
    const separator = publicUrl.includes('?') ? '&' : '?';
    return `${publicUrl}${separator}download=${encodeURIComponent(`${safeTitle}.pdf`)}`;
}
