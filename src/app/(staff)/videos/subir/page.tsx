'use client';

import {useState, useRef} from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Upload,
    Video,
    X,
    CheckCircle,
    AlertCircle,
    FileVideo,
    PlayCircle,
    Clock,
    Tag
} from 'lucide-react';
import {uploadFileToSupabaseStorage} from '@/lib/services/supabase/storage.service';

interface UploadState {
    file: File | null;
    title: string;
    description: string;
    category: string;
    isUploading: boolean;
    progress: number;
    error: string | null;
    success: boolean;
}

const categories = [
    'Básicos',
    'Planificación',
    'Recetas',
    'Bienestar',
    'Ejercicio',
    'Suplementos'
];

export default function VideosUploadPage() {
    const [uploadState, setUploadState] = useState<UploadState>({
        file: null,
        title: '',
        description: '',
        category: '',
        isUploading: false,
        progress: 0,
        error: null,
        success: false
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

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
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('video/')) {
                setUploadState(prev => ({...prev, file, error: null}));
            } else {
                setUploadState(prev => ({
                    ...prev,
                    error: 'Por favor selecciona un archivo de video válido'
                }));
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('video/')) {
                setUploadState(prev => ({...prev, file, error: null}));
            } else {
                setUploadState(prev => ({
                    ...prev,
                    error: 'Por favor selecciona un archivo de video válido'
                }));
            }
        }
    };

    const removeFile = () => {
        setUploadState(prev => ({...prev, file: null}));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleInputChange = (field: keyof UploadState, value: string) => {
        setUploadState(prev => ({...prev, [field]: value, error: null}));
    };

    const validateForm = () => {
        if (!uploadState.file)
            return 'Por favor selecciona un archivo de video';
        if (!uploadState.title.trim()) return 'El título es obligatorio';
        if (!uploadState.description.trim())
            return 'La descripción es obligatoria';
        if (!uploadState.category) return 'Por favor selecciona una categoría';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setUploadState(prev => ({...prev, error: validationError}));
            return;
        }

        setUploadState(prev => ({
            ...prev,
            isUploading: true,
            progress: 0,
            error: null
        }));

        // Simulate upload progress
        const progressInterval = setInterval(() => {
            setUploadState(prev => {
                const newProgress = Math.min(
                    prev.progress + Math.random() * 15,
                    90
                );
                return {...prev, progress: newProgress};
            });
        }, 200);

        try {
            const file = uploadState.file;
            if (!file) {
                throw new Error('No se encontró el archivo de video.');
            }

            const result = await uploadFileToSupabaseStorage({
                bucket: 'videos',
                file,
                pathPrefix: 'video',
                generatePublicUrl: true
            });

            clearInterval(progressInterval);

            if (!result.success) {
                throw new Error(result.message || 'Error al subir el video.');
            }

            // Save video metadata to database
            const saveResponse = await fetch('/api/videos', {
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
                    'Error al guardar el video en la base de datos.'
                );
            }

            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                progress: 100,
                success: true
            }));

            // Reset form after success
            setTimeout(() => {
                setUploadState({
                    file: null,
                    title: '',
                    description: '',
                    category: '',
                    isUploading: false,
                    progress: 0,
                    error: null,
                    success: false
                });
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }, 2000);
        } catch (error) {
            clearInterval(progressInterval);
            setUploadState(prev => ({
                ...prev,
                isUploading: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Error al subir el video. Por favor intenta de nuevo.'
            }));
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <main className='min-h-screen bg-background px-4 py-6 md:px-6 lg:px-8'>
            <div className='mx-auto max-w-4xl'>
                {/* Back Button */}
                <Link
                    href='/videos'
                    className='mb-6 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                    <ArrowLeft className='h-4 w-4' />
                    Volver al panel
                </Link>

                {/* Header */}
                <div className='mb-8'>
                    <h1 className='text-2xl font-semibold text-foreground md:text-3xl'>
                        Subir Video Educativo
                    </h1>
                    <p className='mt-1 text-sm text-muted-foreground'>
                        Comparte contenido educativo con tus pacientes
                    </p>
                </div>

                {/* Upload Form */}
                <form onSubmit={handleSubmit} className='space-y-6'>
                    {/* File Upload Section */}
                    <div className='rounded-2xl bg-card p-6'>
                        <h2 className='mb-4 text-lg font-semibold text-foreground'>
                            Archivo de Video
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
                                    accept='video/*'
                                    onChange={handleFileSelect}
                                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                                />
                                <div className='flex flex-col items-center gap-4'>
                                    <div className='flex h-16 w-16 items-center justify-center rounded-full bg-accent/20'>
                                        <Upload className='h-8 w-8 text-accent-foreground' />
                                    </div>
                                    <div>
                                        <p className='text-sm font-medium text-foreground'>
                                            Arrastra y suelta tu video aquí
                                        </p>
                                        <p className='mt-1 text-xs text-muted-foreground'>
                                            o haz clic para seleccionar un
                                            archivo
                                        </p>
                                        <p className='mt-2 text-xs text-muted-foreground'>
                                            MP4, MOV, AVI hasta 500MB
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className='rounded-xl bg-muted/50 p-4'>
                                <div className='flex items-center gap-4'>
                                    <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20'>
                                        <FileVideo className='h-6 w-6 text-accent-foreground' />
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-sm font-medium text-foreground truncate'>
                                            {uploadState.file.name}
                                        </p>
                                        <p className='text-xs text-muted-foreground'>
                                            {formatFileSize(
                                                uploadState.file.size
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={removeFile}
                                        className='flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground'>
                                        <X className='h-4 w-4' />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Video Details */}
                    <div className='rounded-2xl bg-card p-6'>
                        <h2 className='mb-4 text-lg font-semibold text-foreground'>
                            Detalles del Video
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
                                    className='w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400'
                                    placeholder='Ingresa el título del video'
                                    disabled={uploadState.isUploading}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className='block text-sm font-medium text-foreground mb-2'>
                                    Descripción *
                                </label>
                                <textarea
                                    value={uploadState.description}
                                    onChange={e =>
                                        handleInputChange(
                                            'description',
                                            e.target.value
                                        )
                                    }
                                    rows={4}
                                    className='w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none'
                                    placeholder='Describe el contenido del video y qué aprenderán los espectadores'
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
                                    className='w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400'
                                    disabled={uploadState.isUploading}>
                                    <option value=''>
                                        Seleccionar categoría
                                    </option>
                                    {categories.map(category => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
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
                                    ¡Video subido exitosamente! Los pacientes
                                    podrán verlo pronto.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Upload Progress */}
                    {uploadState.isUploading && (
                        <div className='rounded-xl bg-card p-6'>
                            <div className='flex items-center gap-4 mb-4'>
                                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-accent/20'>
                                    <Video className='h-5 w-5 text-accent-foreground animate-pulse' />
                                </div>
                                <div className='flex-1'>
                                    <p className='text-sm font-medium text-foreground'>
                                        Subiendo video...
                                    </p>
                                    <p className='text-xs text-muted-foreground'>
                                        Procesando archivo, por favor espera
                                    </p>
                                </div>
                            </div>
                            <div className='w-full bg-muted rounded-full h-2'>
                                <div
                                    className='bg-accent-foreground h-2 rounded-full transition-all duration-300'
                                    style={{
                                        width: `${uploadState.progress}%`
                                    }}></div>
                            </div>
                            <p className='text-xs text-muted-foreground mt-2 text-right'>
                                {Math.round(uploadState.progress)}%
                            </p>
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
                                    <Video className='h-4 w-4 animate-pulse' />
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
                                    Subir Video
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <p className='mt-8 text-center text-xs text-muted-foreground'>
                    Los videos se procesarán y estarán disponibles para los
                    pacientes en breve
                </p>
            </div>
        </main>
    );
}
