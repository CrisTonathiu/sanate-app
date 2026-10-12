'use client';

import Link from 'next/link';
import {ArrowLeft, Calendar, Download, Eye, FileText} from 'lucide-react';
import type {ExerciseItem} from '@/lib/services/exercise.service';
import {
    buildExerciseDownloadUrl,
    EXERCISE_CATEGORIES,
    EXERCISE_CATEGORY_LABELS,
    formatExerciseFileSize
} from '@/lib/config/exercise-config';

export default function PatientExercisesClient({
    exercises
}: {
    exercises: ExerciseItem[];
}) {
    return (
        <main className='min-h-screen bg-background px-4 py-6 md:px-6 lg:px-8'>
            <div className='mx-auto max-w-6xl'>
                {/* Back Button */}
                <Link
                    href='/portal'
                    className='mb-6 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                    <ArrowLeft className='h-4 w-4' />
                    Regresar
                </Link>

                {/* Header */}
                <div className='mb-6'>
                    <h1 className='text-2xl font-semibold text-foreground md:text-3xl'>
                        Ejercicios
                    </h1>
                    <p className='mt-1 text-sm text-muted-foreground'>
                        Descarga las rutinas y guías de ejercicio que te
                        interesen
                    </p>
                </div>

                {/* Category Cards */}
                <div className='grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-2'>
                    {EXERCISE_CATEGORIES.map(category => {
                        const categoryExercises = exercises.filter(
                            exercise => exercise.category === category
                        );

                        return (
                            <section
                                key={category}
                                className='min-w-0 overflow-hidden rounded-2xl bg-card'>
                                <div className='flex items-center justify-between gap-3 border-b border-border p-4'>
                                    <h2 className='font-medium text-foreground'>
                                        {EXERCISE_CATEGORY_LABELS[category]}
                                    </h2>
                                    <span className='flex-shrink-0 rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-accent-foreground'>
                                        {categoryExercises.length}{' '}
                                        {categoryExercises.length === 1
                                            ? 'PDF'
                                            : 'PDFs'}
                                    </span>
                                </div>

                                <div className='divide-y divide-border'>
                                    {categoryExercises.length === 0 ? (
                                        <div className='p-8 text-center'>
                                            <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
                                                <FileText className='h-6 w-6 text-muted-foreground' />
                                            </div>
                                            <p className='text-sm text-muted-foreground'>
                                                Aún no hay ejercicios en esta
                                                categoría
                                            </p>
                                        </div>
                                    ) : (
                                        categoryExercises.map(exercise => (
                                            <div
                                                key={exercise.id}
                                                className='flex items-center gap-3 px-3 py-4 transition-colors hover:bg-muted/50 sm:px-4'>
                                                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted'>
                                                    <FileText className='h-5 w-5 text-amber-400' />
                                                </div>
                                                <div className='min-w-0 flex-1'>
                                                    <p className='line-clamp-2 break-words text-sm font-medium text-foreground sm:line-clamp-1'>
                                                        {exercise.title}
                                                    </p>
                                                    {exercise.description && (
                                                        <p className='line-clamp-2 break-words text-xs text-muted-foreground'>
                                                            {
                                                                exercise.description
                                                            }
                                                        </p>
                                                    )}
                                                    <div className='mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground'>
                                                        <span>
                                                            {formatExerciseFileSize(
                                                                exercise.size
                                                            )}
                                                        </span>
                                                        <span>•</span>
                                                        <span className='flex items-center gap-1'>
                                                            <Calendar className='h-3 w-3' />
                                                            {
                                                                exercise.uploadedAt
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className='flex flex-shrink-0 items-center gap-1'>
                                                    <a
                                                        href={
                                                            exercise.publicUrl
                                                        }
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                        className='rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                                                        <Eye className='h-4 w-4' />
                                                        <span className='sr-only'>
                                                            Ver PDF
                                                        </span>
                                                    </a>
                                                    <a
                                                        href={buildExerciseDownloadUrl(
                                                            exercise.publicUrl,
                                                            exercise.title
                                                        )}
                                                        className='rounded-lg bg-accent p-2 text-accent-foreground transition-colors hover:bg-accent/80'>
                                                        <Download className='h-4 w-4' />
                                                        <span className='sr-only'>
                                                            Descargar PDF
                                                        </span>
                                                    </a>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
