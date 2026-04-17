'use client';

import {Button} from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {Separator} from '@/components/ui/separator';
import {AnimatePresence, motion} from 'framer-motion';
import {
    ArrowLeft,
    Check,
    Copy,
    FileText,
    Loader2,
    Sparkles
} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';

export interface ProtocolTemplateOption {
    id: string;
    name: string;
    description?: string | null;
    updatedAt: string;
    weekPlanLength: number;
}

interface ProtocolStartDialogProps {
    open: boolean;
    templates: ProtocolTemplateOption[];
    isLoadingTemplates: boolean;
    isApplyingTemplate: boolean;
    templateError: string | null;
    onStartClean: () => void;
    onBrowseTemplates: () => Promise<void> | void;
    onRetryTemplates: () => Promise<void> | void;
    onApplyTemplate: (templateId: string) => Promise<void> | void;
}

type StartView = 'choice' | 'templates';

export default function ProtocolStartDialog({
    open,
    templates,
    isLoadingTemplates,
    isApplyingTemplate,
    templateError,
    onStartClean,
    onBrowseTemplates,
    onRetryTemplates,
    onApplyTemplate
}: ProtocolStartDialogProps) {
    const [view, setView] = useState<StartView>('choice');

    useEffect(() => {
        if (open) {
            setView('choice');
        }
    }, [open]);

    const sortedTemplates = useMemo(
        () =>
            [...templates].sort(
                (left, right) =>
                    new Date(right.updatedAt).getTime() -
                    new Date(left.updatedAt).getTime()
            ),
        [templates]
    );

    const handleShowTemplates = async () => {
        setView('templates');
        await onBrowseTemplates();
    };

    return (
        <Dialog open={open} onOpenChange={() => undefined}>
            <DialogContent
                showCloseButton={false}
                onEscapeKeyDown={event => event.preventDefault()}
                onInteractOutside={event => event.preventDefault()}
                className='overflow-hidden rounded-3xl border-border bg-background p-0 sm:max-w-2xl'>
                <div className='relative overflow-hidden px-6 pb-5 pt-6'>
                    <div className='absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent' />
                    <div className='relative'>
                        <DialogHeader>
                            <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground'>
                                <Sparkles className='h-6 w-6' />
                            </div>
                            <DialogTitle className='text-xl font-bold text-foreground'>
                                {view === 'choice'
                                    ? '¿Cómo quieres iniciar este protocolo?'
                                    : 'Selecciona una plantilla'}
                            </DialogTitle>
                            <DialogDescription className='text-sm text-muted-foreground'>
                                {view === 'choice'
                                    ? 'Puedes comenzar desde cero o reutilizar una plantilla guardada para adelantar el plan semanal.'
                                    : 'Las plantillas rellenan el flujo con una configuración ya guardada y puedes ajustarla antes de terminar.'}
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                <Separator className='bg-border/50' />

                <div className='px-6 pb-6 pt-5'>
                    <AnimatePresence mode='wait'>
                        {view === 'choice' ? (
                            <motion.div
                                key='choice'
                                initial={{opacity: 0, x: -12}}
                                animate={{opacity: 1, x: 0}}
                                exit={{opacity: 0, x: 12}}
                                className='grid gap-4 sm:grid-cols-2'>
                                <button
                                    type='button'
                                    onClick={onStartClean}
                                    className='group rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5'>
                                    <div className='mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground'>
                                        <FileText className='h-5 w-5' />
                                    </div>
                                    <div className='space-y-2'>
                                        <div className='text-base font-semibold text-foreground'>
                                            Protocolo limpio
                                        </div>
                                        <p className='text-sm text-muted-foreground'>
                                            Empieza con los valores por defecto
                                            y define el plan desde cero para
                                            este paciente.
                                        </p>
                                    </div>
                                </button>

                                <button
                                    type='button'
                                    onClick={handleShowTemplates}
                                    className='group rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5'>
                                    <div className='mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground'>
                                        <Copy className='h-5 w-5' />
                                    </div>
                                    <div className='space-y-2'>
                                        <div className='text-base font-semibold text-foreground'>
                                            Usar plantilla
                                        </div>
                                        <p className='text-sm text-muted-foreground'>
                                            Reutiliza un protocolo base ya
                                            guardado y continúa editándolo antes
                                            de terminar.
                                        </p>
                                    </div>
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key='templates'
                                initial={{opacity: 0, x: 12}}
                                animate={{opacity: 1, x: 0}}
                                exit={{opacity: 0, x: -12}}
                                className='space-y-4'>
                                <div className='flex items-center justify-between gap-3'>
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        onClick={() => setView('choice')}
                                        className='h-9 rounded-xl px-3'>
                                        <ArrowLeft className='mr-2 h-4 w-4' />
                                        Volver
                                    </Button>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        onClick={onStartClean}
                                        className='h-9 rounded-xl'>
                                        Empezar limpio
                                    </Button>
                                </div>

                                {isLoadingTemplates ? (
                                    <div className='flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20'>
                                        <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                                            <Loader2 className='h-4 w-4 animate-spin' />
                                            Cargando plantillas...
                                        </div>
                                    </div>
                                ) : templateError ? (
                                    <div className='rounded-2xl border border-destructive/20 bg-destructive/5 p-4'>
                                        <p className='text-sm font-medium text-foreground'>
                                            No se pudieron cargar las
                                            plantillas.
                                        </p>
                                        <p className='mt-1 text-sm text-muted-foreground'>
                                            {templateError}
                                        </p>
                                        <Button
                                            type='button'
                                            variant='outline'
                                            onClick={onRetryTemplates}
                                            className='mt-4 h-9 rounded-xl'>
                                            Reintentar
                                        </Button>
                                    </div>
                                ) : sortedTemplates.length === 0 ? (
                                    <div className='rounded-2xl border border-dashed border-border bg-secondary/20 p-6 text-center'>
                                        <p className='text-sm font-medium text-foreground'>
                                            Aún no tienes plantillas guardadas.
                                        </p>
                                        <p className='mt-1 text-sm text-muted-foreground'>
                                            Puedes empezar con un protocolo
                                            limpio y guardar una plantilla al
                                            final del flujo.
                                        </p>
                                    </div>
                                ) : (
                                    <div className='max-h-[420px] space-y-3 overflow-y-auto pr-1'>
                                        {sortedTemplates.map(template => (
                                            <div
                                                key={template.id}
                                                className='rounded-2xl border border-border bg-card p-4'>
                                                <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                                                    <div className='space-y-2'>
                                                        <div>
                                                            <h4 className='text-sm font-semibold text-foreground'>
                                                                {template.name}
                                                            </h4>
                                                            {template.description ? (
                                                                <p className='mt-1 text-sm text-muted-foreground'>
                                                                    {
                                                                        template.description
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                        <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                                                            <span className='rounded-full bg-secondary px-2.5 py-1'>
                                                                {
                                                                    template.weekPlanLength
                                                                }{' '}
                                                                días en plan
                                                                semanal
                                                            </span>
                                                            <span>
                                                                Actualizada{' '}
                                                                {new Date(
                                                                    template.updatedAt
                                                                ).toLocaleDateString(
                                                                    'es-MX'
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        type='button'
                                                        onClick={() =>
                                                            onApplyTemplate(
                                                                template.id
                                                            )
                                                        }
                                                        disabled={
                                                            isApplyingTemplate
                                                        }
                                                        className='h-10 rounded-xl px-5'>
                                                        {isApplyingTemplate ? (
                                                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                                        ) : (
                                                            <Check className='mr-2 h-4 w-4' />
                                                        )}
                                                        Usar plantilla
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}
