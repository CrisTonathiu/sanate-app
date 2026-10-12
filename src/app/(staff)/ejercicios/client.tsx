'use client';

import {useState} from 'react';
import Link from 'next/link';
import {AlertCircle, Calendar, Eye, FileText, Plus, Trash2} from 'lucide-react';
import {motion} from 'framer-motion';
import {Button} from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import type {ExerciseItem} from '@/lib/services/exercise.service';
import {
    formatExerciseFileSize,
    getExerciseCategoryLabel
} from '@/lib/config/exercise-config';

export default function ExercisesClient({
    initialExercises
}: {
    initialExercises: ExerciseItem[];
}) {
    const [exercises, setExercises] = useState(initialExercises);
    const [exerciseToDelete, setExerciseToDelete] =
        useState<ExerciseItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const confirmDelete = async () => {
        if (!exerciseToDelete) return;

        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/exercises/${exerciseToDelete.id}`,
                {method: 'DELETE'}
            );

            if (!response.ok) {
                throw new Error('Delete failed');
            }

            setExercises(prev =>
                prev.filter(exercise => exercise.id !== exerciseToDelete.id)
            );
        } catch (err) {
            console.error('Error deleting exercise:', err);
            setError('No se pudo eliminar el ejercicio. Intenta de nuevo.');
        } finally {
            setIsDeleting(false);
            setExerciseToDelete(null);
        }
    };

    return (
        <main className='relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6'>
            {/* Header */}
            <motion.div
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className='mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                            Ejercicios
                        </h1>
                        <p className='mt-1 text-sm text-muted-foreground'>
                            PDFs disponibles para todos los pacientes en el
                            portal
                        </p>
                    </div>
                    <Button
                        asChild
                        className='h-11 px-5 rounded-xl font-medium shadow-lg shadow-primary/25'>
                        <Link href='/ejercicios/subir'>
                            <Plus className='h-4 w-4' />
                            Subir Ejercicio
                        </Link>
                    </Button>
                </div>
            </motion.div>

            {error && (
                <div className='rounded-xl bg-red-500/10 border border-red-500/20 p-4'>
                    <div className='flex items-center gap-3'>
                        <AlertCircle className='h-5 w-5 text-red-400 flex-shrink-0' />
                        <p className='text-sm text-red-400'>{error}</p>
                    </div>
                </div>
            )}

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {exercises.length === 0 ? (
                    <div className='col-span-full rounded-2xl bg-card p-8 text-center'>
                        <FileText className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                        <p className='text-sm font-medium text-foreground'>
                            No hay ejercicios subidos aún
                        </p>
                        <p className='mt-1 text-xs text-muted-foreground'>
                            Usa el botón «Subir Ejercicio» para agregar un PDF
                        </p>
                    </div>
                ) : (
                    exercises.map(exercise => (
                        <div
                            key={exercise.id}
                            className='flex flex-col rounded-2xl bg-card p-4 shadow-sm'>
                            <div className='mb-3 flex items-center gap-3'>
                                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted'>
                                    <FileText className='h-5 w-5 text-amber-400' />
                                </div>
                                <div className='min-w-0 flex-1'>
                                    <h2 className='truncate text-sm font-semibold text-foreground'>
                                        {exercise.title}
                                    </h2>
                                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                                        <span>
                                            {formatExerciseFileSize(
                                                exercise.size
                                            )}
                                        </span>
                                        <span>•</span>
                                        <span className='flex items-center gap-1'>
                                            <Calendar className='h-3 w-3' />
                                            {exercise.uploadedAt}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {exercise.description && (
                                <p className='mb-4 text-xs text-muted-foreground line-clamp-3'>
                                    {exercise.description}
                                </p>
                            )}
                            <div className='mt-auto flex items-center justify-between gap-3'>
                                <span className='truncate rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-accent-foreground'>
                                    {getExerciseCategoryLabel(
                                        exercise.category
                                    )}
                                </span>
                                <div className='flex items-center gap-1'>
                                    <a
                                        href={exercise.publicUrl}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                                        <Eye className='h-4 w-4' />
                                        <span className='sr-only'>Ver PDF</span>
                                    </a>
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setExerciseToDelete(exercise)
                                        }
                                        className='rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400'>
                                        <Trash2 className='h-4 w-4' />
                                        <span className='sr-only'>
                                            Eliminar ejercicio
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AlertDialog
                open={exerciseToDelete !== null}
                onOpenChange={open => {
                    if (!open && !isDeleting) setExerciseToDelete(null);
                }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar ejercicio</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Deseas eliminar &ldquo;{exerciseToDelete?.title}
                            &rdquo;? Los pacientes ya no podrán descargarlo.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={event => {
                                event.preventDefault();
                                confirmDelete();
                            }}
                            disabled={isDeleting}
                            className='bg-red-500 hover:bg-red-600'>
                            {isDeleting ? 'Eliminando...' : 'Eliminar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}
