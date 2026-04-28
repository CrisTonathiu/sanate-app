import {FileText, Image as IconImage, X} from 'lucide-react';
import {Document} from '@/lib/interface/patient-field-interface';
import Image from 'next/image';
import {DocumentViewer} from 'react-documents';

interface DocumentPreviewProps {
    previewDoc: Document;
    setPreviewDoc: (doc: Document | null) => void;
}

const getFileIcon = (type: 'pdf' | 'image') => {
    return type === 'pdf' ? (
        <FileText className='h-5 w-5 text-amber-400' />
    ) : (
        <IconImage className='h-5 w-5 text-purple-400' />
    );
};

export default function DocumentPreview({
    previewDoc,
    setPreviewDoc
}: DocumentPreviewProps) {
    const handleDownload = async () => {
        if (!previewDoc.publicUrl) return;

        try {
            const response = await fetch(previewDoc.publicUrl);
            if (!response.ok) {
                throw new Error(`Download failed: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = previewDoc.name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            window.open(previewDoc.publicUrl, '_blank');
        }
    };

    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm'
            onClick={() => setPreviewDoc(null)}>
            <div
                className='relative w-full max-w-3xl overflow-hidden rounded-2xl bg-card'
                onClick={e => e.stopPropagation()}>
                {/* Modal Header */}

                <div className='flex items-center justify-between border-b border-border p-4'>
                    <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-muted'>
                            {getFileIcon(previewDoc.type)}
                        </div>
                        <div>
                            <p className='text-sm font-medium text-foreground'>
                                {previewDoc.name}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                                {previewDoc.size}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setPreviewDoc(null)}
                        className='rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                        <X className='h-5 w-5' />
                        <span className='sr-only'>Cerrar vista previa</span>
                    </button>
                </div>

                {/* Modal Content */}
                <div className='flex min-h-[300px] items-center justify-center bg-muted/30 md:min-h-[400px]'>
                    {previewDoc.type === 'image' ? (
                        <div className='relative aspect-video w-full overflow-hidden bg-muted'>
                            {previewDoc.publicUrl ? (
                                <Image
                                    src={previewDoc.publicUrl}
                                    alt={previewDoc.name}
                                    className='w-full h-full object-contain'
                                    fill
                                    unoptimized
                                />
                            ) : (
                                <div className='flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground'>
                                    Vista previa de imagen no disponible
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className='w-full max-w-4xl h-[500px] bg-muted overflow-hidden'>
                            {previewDoc.publicUrl ? (
                                <DocumentViewer
                                    url={previewDoc.publicUrl}
                                    viewer='pdf'
                                    className='w-full h-full'
                                />
                            ) : (
                                <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
                                    Vista previa del PDF no disponible
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className='flex items-center justify-end gap-3 border-t border-border p-4'>
                    <button
                        onClick={() => setPreviewDoc(null)}
                        className='rounded-xl bg-muted px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80'>
                        Cerrar
                    </button>
                    <button
                        onClick={handleDownload}
                        className='rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-amber-400'>
                        Descargar
                    </button>
                </div>
            </div>
        </div>
    );
}
