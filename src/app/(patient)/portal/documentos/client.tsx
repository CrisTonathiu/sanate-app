'use client';

import {useCallback, useEffect, useState} from 'react';
import {
    FileText,
    Image,
    Upload,
    ChevronUp,
    ChevronDown,
    ArrowLeft,
    Calendar,
    FileType,
    Eye,
    Trash2,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
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
import Link from 'next/link';
import {uploadFileToSupabaseStorage} from '@/lib/services/supabase/storage.service';
import DocumentPreview from '@/components/widgets/patient-portal/DocumentPreview';
import {Document} from '@/lib/interface/patient-field-interface';

export default function PatientDocumentClient({
    patientId
}: {
    patientId: string;
}) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [showUpload, setShowUpload] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
        null
    );

    // Fetch documents on mount
    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await fetch(
                    `/api/patients/${patientId}/documents`
                );
                const result = await parseApiResponse(response);

                // if (!response.ok) {
                //     throw new Error(
                //         result.message || `HTTP ${response.status}`
                //     );
                // }

                if (result.success) {
                    const formattedDocuments = (result.data as Document[]).map(
                        (doc: Document) => ({
                            id: doc.id,
                            name: doc.name,
                            type: doc.type,
                            size: formatFileSize(doc.size),
                            uploadedAt: new Date(
                                doc.uploadedAt
                            ).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            }),
                            storagePath: doc.storagePath,
                            publicUrl: doc.publicUrl
                        })
                    );
                    setDocuments(formattedDocuments);
                }
            } catch (error) {
                console.error('Error fetching documents:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDocuments();
    }, [patientId]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            handleFiles(files);
            e.target.value = '';
        }
    };

    const formatFileSize = (bytes: number | string): string => {
        const bytesNum =
            typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
        if (bytesNum < 1024) return bytesNum + ' B';
        if (bytesNum < 1024 * 1024) return (bytesNum / 1024).toFixed(0) + ' KB';
        return (bytesNum / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const parseApiResponse = async (
        response: Response
    ): Promise<{success: boolean; data?: unknown; message?: string}> => {
        const text = await response.text();
        if (!text) {
            return {success: false, message: 'Empty response body'};
        }

        try {
            return JSON.parse(text);
        } catch (error) {
            return {
                success: false,
                message: `Invalid JSON response: ${text}`
            };
        }
    };

    const handleFiles = async (files: File[]) => {
        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(null);

        const successfulUploads: Document[] = [];
        const failedFiles: string[] = [];

        for (const file of files) {
            const maxSizeMB = 10;
            const maxSizeBytes = maxSizeMB * 1024 * 1024;

            if (file.size > maxSizeBytes) {
                failedFiles.push(`${file.name} (Excede ${maxSizeMB}MB)`);
                continue;
            }

            const result = await uploadFileToSupabaseStorage({
                bucket: 'patient-documents',
                file,
                pathPrefix: 'documents',
                generatePublicUrl: true
            });

            if (result.success) {
                // Save document metadata to database
                try {
                    const saveResponse = await fetch(
                        `/api/patients/${patientId}/documents`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                name: file.name,
                                type: file.type.includes('pdf')
                                    ? 'pdf'
                                    : 'image',
                                size: file.size,
                                storagePath: result.path,
                                publicUrl: result.publicUrl
                            })
                        }
                    );

                    const saveResult = await parseApiResponse(saveResponse);
                    console.log('Save result:', saveResult);
                    if (!saveResponse.ok || !saveResult.success) {
                        failedFiles.push(
                            `${file.name} (Error al guardar en base de datos 1: ${
                                saveResult.message || saveResponse.statusText
                            })`
                        );
                        continue;
                    }

                    const savedData = saveResult.data as {id: string};
                    if (!savedData || !savedData.id) {
                        failedFiles.push(
                            `${file.name} (Respuesta de guardado inválida)`
                        );
                        continue;
                    }

                    successfulUploads.push({
                        id: savedData.id,
                        name: file.name,
                        type: file.type.includes('pdf') ? 'pdf' : 'image',
                        size: formatFileSize(file.size),
                        uploadedAt: new Date().toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        }),
                        storagePath: result.path,
                        publicUrl: result.publicUrl
                    });
                } catch (error) {
                    console.error('Error saving document metadata:', error);
                    failedFiles.push(
                        `${file.name} (Error al guardar en base de datos 2)`
                    );
                }
            } else {
                failedFiles.push(`${file.name} (${result.message})`);
            }
        }

        if (successfulUploads.length > 0) {
            setDocuments(prev => [...successfulUploads, ...prev]);
            setUploadSuccess(
                `${successfulUploads.length} archivo(s) subido(s) exitosamente`
            );
        }

        if (failedFiles.length > 0) {
            setUploadError(`Error al subir: ${failedFiles.join(', ')}`);
        }

        setIsUploading(false);
    };

    const deleteDocument = async (id: string) => {
        const documentToDelete = documents.find(doc => doc.id === id);
        if (!documentToDelete) return;

        setDocumentToDelete(documentToDelete);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!documentToDelete) return;

        try {
            const response = await fetch(
                `/api/patients/${patientId}/documents/${documentToDelete.id}`,
                {
                    method: 'DELETE'
                }
            );

            const result = await parseApiResponse(response);
            if (!response.ok || !result.success) {
                setUploadError(
                    `No se pudo eliminar el documento: ${
                        result.message || response.statusText
                    }`
                );
                return;
            }

            setDocuments(prev =>
                prev.filter(doc => doc.id !== documentToDelete.id)
            );
            if (previewDoc?.id === documentToDelete.id) {
                setPreviewDoc(null);
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            setUploadError('Error al eliminar el documento. Intenta de nuevo.');
        } finally {
            setDeleteDialogOpen(false);
            setDocumentToDelete(null);
        }
    };

    const getFileIcon = (type: 'pdf' | 'image') => {
        return type === 'pdf' ? (
            <FileText className='h-5 w-5 text-amber-400' />
        ) : (
            <Image className='h-5 w-5 text-purple-400' />
        );
    };

    return (
        <main className='mx-auto max-w-4xl min-h-screen bg-background p-4 md:p-6 lg:p-8 space-y-6'>
            {/* Back Button */}
            <Link
                href='/portal'
                className='mb-6 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                <ArrowLeft className='h-4 w-4' />
                Regresar al portal
            </Link>

            {/* Header */}
            <div className=''>
                <h1 className='text-2xl font-semibold'>Mis documentos</h1>
                <p className='mt-2 text-muted-foreground'>
                    Todos los documentos que has subido o compartido con tu
                    nutricionista estarán aquí.
                </p>
            </div>

            {/* Stats Card */}
            <div className='mb-6 rounded-2xl bg-card p-5'>
                <div className='flex items-center justify-evenly'>
                    <div className='text-center'>
                        <p className='text-2xl font-bold text-foreground'>
                            {documents.length}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                            Archivos Totales
                        </p>
                    </div>
                    <div className='h-12 w-px bg-border' />
                    <div className='text-center'>
                        <p className='text-2xl font-bold text-foreground'>
                            {documents.filter(d => d.type === 'pdf').length}
                        </p>
                        <p className='text-xs text-muted-foreground'>PDFs</p>
                    </div>
                    <div className='h-12 w-px bg-border' />
                    <div className='text-center'>
                        <p className='text-2xl font-bold text-foreground'>
                            {documents.filter(d => d.type === 'image').length}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                            Imágenes
                        </p>
                    </div>
                </div>
            </div>

            {/* Upload Toggle Button */}
            <Button
                onClick={() => setShowUpload(!showUpload)}
                disabled={isUploading}
                className='mb-4 w-full rounded-xl bg-amber-500 py-6 text-base font-medium text-black hover:bg-amber-400 disabled:opacity-50'>
                <Upload className='mr-2 h-5 w-5' />
                Subir Documento
                {showUpload ? (
                    <ChevronUp className='ml-2 h-5 w-5' />
                ) : (
                    <ChevronDown className='ml-2 h-5 w-5' />
                )}
            </Button>

            {/* Success/Error Messages */}
            {uploadSuccess && (
                <div className='mb-4 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-700'>
                    <CheckCircle className='h-5 w-5 flex-shrink-0' />
                    <span>{uploadSuccess}</span>
                </div>
            )}
            {uploadError && (
                <div className='mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700'>
                    <AlertCircle className='h-5 w-5 flex-shrink-0' />
                    <span>{uploadError}</span>
                </div>
            )}

            {/* Upload Area */}
            <div
                className={`mb-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    showUpload ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                        isDragging
                            ? 'border-amber-400 bg-amber-400/10'
                            : 'border-muted-foreground/30 bg-card hover:border-amber-400/50'
                    } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20'>
                        <FileType className='h-7 w-7 text-amber-400' />
                    </div>
                    <p className='mb-2 text-sm font-medium text-foreground'>
                        {isUploading
                            ? 'Cargando archivos...'
                            : 'Arrastra y suelta tus archivos aquí'}
                    </p>
                    <p className='mb-4 text-xs text-muted-foreground'>
                        Soporta PDF, JPG, PNG hasta 10MB
                    </p>
                    <label className='cursor-pointer'>
                        <span className='rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 disabled:opacity-50'>
                            Examinar Archivos
                        </span>
                        <input
                            type='file'
                            multiple
                            disabled={isUploading}
                            accept='.pdf,.jpg,.jpeg,.png,.gif,.webp'
                            onChange={handleFileInput}
                            className='hidden'
                        />
                    </label>
                </div>
            </div>

            {/* Documents List */}
            <div className='rounded-2xl bg-card'>
                <div className='border-b border-border p-4'>
                    <h2 className='font-medium text-foreground'>
                        Cargas Recientes
                    </h2>
                </div>
                <div className='divide-y divide-border'>
                    {isLoading ? (
                        <div className='p-8 text-center'>
                            <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
                                <div className='h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-amber-400'></div>
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                Cargando documentos...
                            </p>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className='p-8 text-center'>
                            <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
                                <FileText className='h-6 w-6 text-muted-foreground' />
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                Sin documentos cargados aún
                            </p>
                        </div>
                    ) : (
                        documents.map(doc => (
                            <div
                                key={doc.id}
                                className='flex items-center gap-3 p-4 transition-colors hover:bg-muted/50'>
                                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted'>
                                    {getFileIcon(doc.type)}
                                </div>
                                <div className='min-w-0 flex-1'>
                                    <p className='truncate text-sm font-medium text-foreground'>
                                        {doc.name}
                                    </p>
                                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                                        <span>{doc.size}</span>
                                        <span>•</span>
                                        <span className='flex items-center gap-1'>
                                            <Calendar className='h-3 w-3' />
                                            {doc.uploadedAt}
                                        </span>
                                    </div>
                                </div>
                                <div className='flex items-center gap-1'>
                                    <button
                                        onClick={() => setPreviewDoc(doc)}
                                        className='rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                                        <Eye className='h-4 w-4' />
                                        <span className='sr-only'>
                                            Ver documento
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => deleteDocument(doc.id)}
                                        className='rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400'>
                                        <Trash2 className='h-4 w-4' />
                                        <span className='sr-only'>
                                            Eliminar documento
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer */}
            <p className='mt-6 text-center text-xs text-muted-foreground'>
                Tus documentos están encriptados y almacenados de forma segura
            </p>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar documento</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Deseas eliminar el documento &ldquo;
                            {documentToDelete?.name}&rdquo;? Esta acción no se
                            puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className='bg-red-500 hover:bg-red-600'>
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Document Preview Modal */}
            {previewDoc && (
                <DocumentPreview
                    previewDoc={previewDoc}
                    setPreviewDoc={setPreviewDoc}
                />
            )}
        </main>
    );
}
