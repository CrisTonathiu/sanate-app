'use client';

import {useState, useRef} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {
    ArrowLeft,
    Upload,
    X,
    CheckCircle,
    AlertCircle,
    FileText
} from 'lucide-react';
import {uploadFileToSupabaseStorage} from '@/lib/services/supabase/storage.service';
import {
    EXERCISE_CATEGORIES,
    EXERCISE_CATEGORY_LABELS,
    EXERCISE_MAX_SIZE_BYTES,
    EXERCISE_MAX_SIZE_MB,
    EXERCISES_BUCKET,
    EXERCISES_PATH_PREFIX,
    formatExerciseFileSize,
    isPdfFile
} from '@/lib/config/exercise-config';

interface UploadState {
    file: File | null;
    title: string;
    description: string;
    category: string;
    isUploading: boolean;
    error: string | null;
    success: boolean;
}

const inputClassName =
    'w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400';

export default function ExerciseUploadClient() {
    const router = useRouter();
    const [uploadState, setUploadState] = useState<UploadState>({
        file: null,
        title: '',
        description: '',
        category: '',
        isUploading: false,
        error: null,
        success: false
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const selectFile = (file: File) => {
        if (!isPdfFile(file)) {
            setUploadState(prev => ({
                ...prev,
                error: 'Por favor selecciona un archivo PDF válido'
            }));
            return;
        }

        if (file.size > EXERCISE_MAX_SIZE_BYTES) {
            setUploadState(prev => ({
                ...prev,
                error: `El archivo no debe exceder ${EXERCISE_MAX_SIZE_MB}MB`
            }));
            return;
        }

        setUploadState(prev => ({
            ...prev,
            file,
            // Prefill the title from the file name to save typing.
            title: prev.title || file.name.replace(/\.pdf$/i, ''),
            error: null
        }));
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            selectFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            selectFile(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setUploadState(prev => ({...prev, file: null}));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleInputChange = (
        field: 'title' | 'description' | 'category',
        value: string
    ) => {
        setUploadState(prev => ({...prev, [field]: value, error: null}));
    };

    const validateForm = () => {
        if (!uploadState.file) return 'Por favor selecciona un archivo PDF';
        if (!uploadState.title.trim()) return 'El título es obligatorio';
        if (!uploadState.category) return 'Por favor selecciona una categoría';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        const file = uploadState.file;
        if (validationError || !file) {
            setUploadState(prev => ({...prev, error: validationError}));
            return;
        }

        setUploadState(prev => ({...prev, isUploading: true, error: null}));

        try {
            const result = await uploadFileToSupabaseStorage({
                bucket: EXERCISES_BUCKET,
                file,
                pathPrefix: EXERCISES_PATH_PREFIX,
                generatePublicUrl: true
            });

            if (!result.success) {
                throw new Error(result.message || 'Error al subir el PDF.');
            }

            const saveResponse = await fetch('/api/exercises', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: uploadState.title,
                    description: uploadState.description,
                    category: uploadState.category,
                    fileName: file.name,
                    size: file.size,
                    storagePath: result.path,
                    publicUrl: result.publicUrl
                })
            });

            if (!saveResponse.ok) {
                throw new Error(
                    'Error al guardar el ejercicio en la base de datos.'
                );
            }

            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                success: true
            }));

            setTimeout(() => {
                router.push('/ejercicios');
                router.refresh();
            }, 1200);
        } catch (error) {
            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Error al subir el ejercicio. Por favor intenta de nuevo.'
            }));
        }
    };

    return (
        <main className='min-h-screen bg-background px-4 py-6 md:px-6 lg:px-8'>
            <div className='mx-auto max-w-4xl'>
                {/* Back Button */}
                <Link
                    href='/ejercicios'
                    className='mb-6 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                    <ArrowLeft className='h-4 w-4' />
                    Volver a ejercicios
                </Link>

                {/* Header */}
                <div className='mb-8'>
                    <h1 className='text-2xl font-semibold text-foreground md:text-3xl'>
                        Subir Ejercicio
                    </h1>
                    <p className='mt-1 text-sm text-muted-foreground'>
                        El PDF estará disponible para todos los pacientes en el
                        portal
                    </p>
                </div>

                {/* Upload Form */}
                <form onSubmit={handleSubmit} className='space-y-6'>
                    {/* File Upload Section */}
                    <div className='rounded-2xl bg-card p-6'>
                        <h2 className='mb-4 text-lg font-semibold text-foreground'>
                            Archivo PDF
                        </h2>

                        {!uploadState.file ? (
                            <div
                                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                                    dragActive
                                        ? 'border-accent bg-accent/5'
                                        : 'border-muted-foreground/25 hover:border-accent/50'
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}>
                                <input
                                    ref={fileInputRef}
                                    type='file'
                                    accept='application/pdf,.pdf'
                                    onChange={handleFileSelect}
                                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                                />
                                <div className='flex flex-col items-center gap-4'>
                                    <div className='flex h-16 w-16 items-center justify-center rounded-full bg-accent/20'>
                                        <Upload className='h-8 w-8 text-accent-foreground' />
                                    </div>
                                    <div>
                                        <p className='text-sm font-medium text-foreground'>
                                            Arrastra y suelta tu PDF aquí
                                        </p>
                                        <p className='mt-1 text-xs text-muted-foreground'>
                                            o haz clic para seleccionar un
                                            archivo
                                        </p>
                                        <p className='mt-2 text-xs text-muted-foreground'>
                                            PDF hasta {EXERCISE_MAX_SIZE_MB}MB
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className='rounded-xl bg-muted/50 p-4'>
                                <div className='flex items-center gap-4'>
                                    <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20'>
                                        <FileText className='h-6 w-6 text-accent-foreground' />
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-sm font-medium text-foreground truncate'>
                                            {uploadState.file.name}
                                        </p>
                                        <p className='text-xs text-muted-foreground'>
                                            {formatExerciseFileSize(
                                                uploadState.file.size
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={removeFile}
                                        disabled={uploadState.isUploading}
                                        className='flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground'>
                                        <X className='h-4 w-4' />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Exercise Details */}
                    <div className='rounded-2xl bg-card p-6'>
                        <h2 className='mb-4 text-lg font-semibold text-foreground'>
                            Detalles del Ejercicio
                        </h2>

                        <div className='space-y-4'>
                            {/* Title */}
                            <div>
                                <label className='block text-sm font-medium text-foreground mb-2'>
                                    Título *
                                </label>
                                <input
                                    type='text'
                                    value={uploadState.title}
                                    onChange={e =>
                                        handleInputChange(
                                            'title',
                                            e.target.value
                                        )
                                    }
                                    className={inputClassName}
                                    placeholder='Ingresa el título del ejercicio'
                                    disabled={uploadState.isUploading}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className='block text-sm font-medium text-foreground mb-2'>
                                    Categoría *
                                </label>
                                <select
                                    value={uploadState.category}
                                    onChange={e =>
                                        handleInputChange(
                                            'category',
                                            e.target.value
                                        )
                                    }
                                    className={inputClassName}
                                    disabled={uploadState.isUploading}>
                                    <option value=''>
                                        Seleccionar categoría
                                    </option>
                                    {EXERCISE_CATEGORIES.map(category => (
                                        <option key={category} value={category}>
                                            {EXERCISE_CATEGORY_LABELS[category]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className='block text-sm font-medium text-foreground mb-2'>
                                    Descripción
                                </label>
                                <textarea
                                    value={uploadState.description}
                                    onChange={e =>
                                        handleInputChange(
                                            'description',
                                            e.target.value
                                        )
                                    }
                                    rows={3}
                                    className={`${inputClassName} resize-none`}
                                    placeholder='Describe brevemente el ejercicio (opcional)'
                                    disabled={uploadState.isUploading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {uploadState.error && (
                        <div className='rounded-xl bg-red-500/10 border border-red-500/20 p-4'>
                            <div className='flex items-center gap-3'>
                                <AlertCircle className='h-5 w-5 text-red-400 flex-shrink-0' />
                                <p className='text-sm text-red-400'>
                                    {uploadState.error}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {uploadState.success && (
                        <div className='rounded-xl bg-green-500/10 border border-green-500/20 p-4'>
                            <div className='flex items-center gap-3'>
                                <CheckCircle className='h-5 w-5 text-green-400 flex-shrink-0' />
                                <p className='text-sm text-green-400'>
                                    ¡Ejercicio subido exitosamente! Ya está
                                    disponible en el portal.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className='flex justify-end'>
                        <button
                            type='submit'
                            disabled={
                                uploadState.isUploading || uploadState.success
                            }
                            className='flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed'>
                            {uploadState.isUploading ? (
                                <>
                                    <Upload className='h-4 w-4 animate-pulse' />
                                    Subiendo...
                                </>
                            ) : uploadState.success ? (
                                <>
                                    <CheckCircle className='h-4 w-4' />
                                    Completado
                                </>
                            ) : (
                                <>
                                    <Upload className='h-4 w-4' />
                                    Subir Ejercicio
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
