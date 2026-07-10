'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {Textarea} from '@/components/ui/textarea';
import AddPatientDialog from '@/components/widgets/AddPatientDialog';
import {useNoteRecorder} from '@/hooks/use-note-recorder';
import {
    useCreatePatientNote,
    useSummarizeTranscript,
    useTranscribeNoteAudio
} from '@/hooks/use-patient-notes';
import {useGetPatients} from '@/hooks/use-patients';
import {cn} from '@/lib/utils';
import {motion} from 'framer-motion';
import {
    AlertTriangle,
    ArrowLeft,
    FileText,
    Loader2,
    Mic,
    Save,
    Sparkles,
    Square,
    UserPlus
} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {useCallback, useEffect, useRef, useState} from 'react';
import {toast} from 'sonner';

export default function ClientPage() {
    const router = useRouter();
    const transcriptScrollRef = useRef<HTMLDivElement>(null);
    const {data: patients = [], refetch: refetchPatients} = useGetPatients();
    const {mutateAsync: summarizeTranscript, isPending: isSummarizing} =
        useSummarizeTranscript();
    const {mutateAsync: transcribeAudio, isPending: isTranscribing} =
        useTranscribeNoteAudio();
    const {mutateAsync: createNote, isPending: isSaving} =
        useCreatePatientNote();

    const {
        status,
        isRecording,
        audioBlob,
        recorderError,
        transcript: speechTranscript,
        liveTranscript,
        interimTranscript,
        speechError,
        startRecording,
        stopRecording,
        resetRecording
    } = useNoteRecorder();

    const [transcript, setTranscript] = useState('');
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [patientId, setPatientId] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(
        null
    );
    const [showAddPatient, setShowAddPatient] = useState(false);
    const [hasProcessedRecording, setHasProcessedRecording] = useState(false);

    const isProcessing = isSummarizing || isTranscribing;

    const hasUnsavedWork =
        !isSaved &&
        (isRecording ||
            !!audioBlob ||
            !!transcript.trim() ||
            !!summary.trim() ||
            !!title.trim());

    const handleGenerateSummary = useCallback(
        async (transcriptText: string) => {
            const result = await summarizeTranscript(transcriptText);
            setSummary(result);

            if (!title.trim()) {
                const preview = result.split('\n')[0]?.slice(0, 60);
                setTitle(preview || 'Nota de voz');
            }

            return result;
        },
        [summarizeTranscript, title]
    );

    const handleProcessRecording = useCallback(async () => {
        if (!audioBlob || hasProcessedRecording) return;

        setHasProcessedRecording(true);

        try {
            const liveText = liveTranscript.trim() || speechTranscript.trim();

            if (liveText) {
                setTranscript(liveText);
                await handleGenerateSummary(liveText);
                toast.success('Resumen generado a partir de la transcripción');
                return;
            }

            const result = await transcribeAudio(audioBlob);
            setTranscript(result.transcript);
            setSummary(result.summary);

            if (!title.trim()) {
                const preview = result.summary.split('\n')[0]?.slice(0, 60);
                setTitle(preview || 'Nota de voz');
            }

            toast.success('Audio transcrito y resumen generado');
        } catch (error) {
            setHasProcessedRecording(false);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Error al procesar la grabación'
            );
        }
    }, [
        audioBlob,
        hasProcessedRecording,
        liveTranscript,
        speechTranscript,
        title,
        transcribeAudio,
        handleGenerateSummary
    ]);

    useEffect(() => {
        if (
            status === 'stopped' &&
            audioBlob &&
            !hasProcessedRecording &&
            !isProcessing
        ) {
            void handleProcessRecording();
        }
    }, [
        status,
        audioBlob,
        hasProcessedRecording,
        isProcessing,
        handleProcessRecording
    ]);

    useEffect(() => {
        const container = transcriptScrollRef.current;
        if (!isRecording || !container) return;

        const distanceFromBottom =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight;
        const isNearBottom = distanceFromBottom < 48;

        if (isNearBottom) {
            container.scrollTop = container.scrollHeight;
        }
    }, [speechTranscript, interimTranscript, isRecording]);

    useEffect(() => {
        if (!hasUnsavedWork) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedWork]);

    const requestNavigation = (href: string) => {
        if (hasUnsavedWork) {
            setPendingNavigation(href);
            setShowExitDialog(true);
            return;
        }
        router.push(href);
    };

    const handleDiscardAndLeave = () => {
        resetRecording();
        setTranscript('');
        setSummary('');
        setTitle('');
        setHasProcessedRecording(false);
        setShowExitDialog(false);
        if (pendingNavigation) {
            router.push(pendingNavigation);
            setPendingNavigation(null);
        }
    };

    const handleResetRecording = () => {
        resetRecording();
        setTranscript('');
        setSummary('');
        setHasProcessedRecording(false);
    };

    const handleSave = async () => {
        if (!patientId) {
            toast.error('Selecciona un paciente para guardar la nota');
            return;
        }

        const noteContent = summary.trim() || transcript.trim();
        if (!noteContent) {
            toast.error('Agrega contenido a la nota antes de guardar');
            return;
        }

        try {
            await createNote({
                patientId,
                title: title.trim() || undefined,
                content: noteContent,
                transcript: transcript.trim() || undefined,
                summary: summary.trim() || undefined
            });
            setIsSaved(true);
            toast.success('Nota guardada correctamente');
            router.push('/notas');
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'No se pudo guardar la nota'
            );
        }
    };

    return (
        <>
            <motion.div
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className='mb-8'>
                <button
                    type='button'
                    onClick={() => requestNavigation('/notas')}
                    className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors'>
                    <ArrowLeft className='h-4 w-4' />
                    Volver a notas
                </button>

                <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                    Nueva nota
                </h1>
                <p className='text-sm text-muted-foreground mt-1'>
                    La transcripción aparece en tiempo real mientras grabas. Al
                    detener, OpenAI genera un resumen en la sección inferior.
                </p>
            </motion.div>

            <div className='space-y-6'>
                <section className='rounded-2xl border border-border bg-card/50 p-6'>
                    <h2 className='text-sm font-medium text-foreground mb-4'>
                        Grabación de voz
                    </h2>

                    <div className='flex flex-col items-center gap-4 py-2'>
                        <button
                            type='button'
                            onClick={
                                isRecording ? stopRecording : startRecording
                            }
                            disabled={isProcessing || isSaving}
                            className={cn(
                                'relative flex h-24 w-24 items-center justify-center rounded-full transition-all shadow-lg',
                                isRecording
                                    ? 'bg-destructive text-destructive-foreground animate-pulse shadow-destructive/30'
                                    : 'bg-primary text-primary-foreground shadow-primary/30 hover:scale-105'
                            )}>
                            {isRecording ? (
                                <Square className='h-8 w-8 fill-current' />
                            ) : (
                                <Mic className='h-8 w-8' />
                            )}
                            {isRecording && (
                                <span className='absolute -inset-1 rounded-full border-2 border-destructive/40 animate-ping' />
                            )}
                        </button>

                        <p className='text-sm text-muted-foreground text-center'>
                            {isRecording
                                ? 'Grabando… el texto aparece abajo en tiempo real'
                                : isProcessing
                                  ? 'Generando resumen con OpenAI…'
                                  : status === 'stopped'
                                    ? 'Grabación completada'
                                    : 'Presiona para iniciar la grabación'}
                        </p>

                        {(recorderError || speechError) && (
                            <p className='text-sm text-destructive text-center'>
                                {recorderError || speechError}
                            </p>
                        )}

                        {status === 'stopped' && !isProcessing && (
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={handleResetRecording}>
                                Volver a grabar
                            </Button>
                        )}
                    </div>
                </section>

                <section className='rounded-2xl border border-border bg-card/50 p-6 space-y-3'>
                    <div className='flex items-center gap-2'>
                        <FileText className='h-4 w-4 text-primary' />
                        <h2 className='text-sm font-medium text-foreground'>
                            Transcripción en tiempo real
                        </h2>
                        {isRecording && (
                            <span className='inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive'>
                                <span className='h-1.5 w-1.5 rounded-full bg-destructive animate-pulse' />
                                En vivo
                            </span>
                        )}
                    </div>

                    <div
                        ref={transcriptScrollRef}
                        className={cn(
                            'min-h-[180px] max-h-[320px] overflow-y-auto rounded-xl border bg-background/60 p-4 text-sm leading-relaxed',
                            isRecording
                                ? 'border-destructive/30'
                                : 'border-border'
                        )}>
                        {isRecording || transcript ? (
                            <p className='whitespace-pre-wrap text-foreground'>
                                {isRecording ? speechTranscript : transcript}
                                {isRecording && interimTranscript && (
                                    <span className='text-muted-foreground italic'>
                                        {speechTranscript ? ' ' : ''}
                                        {interimTranscript}
                                    </span>
                                )}
                            </p>
                        ) : (
                            <p className='text-muted-foreground'>
                                {isRecording
                                    ? 'Escuchando… empieza a hablar.'
                                    : 'La transcripción de tu grabación aparecerá aquí.'}
                            </p>
                        )}
                    </div>

                    {!isRecording && transcript && (
                        <Textarea
                            value={transcript}
                            onChange={e => setTranscript(e.target.value)}
                            rows={4}
                            className='rounded-xl resize-y'
                            placeholder='Editar transcripción'
                        />
                    )}
                </section>

                <section className='rounded-2xl border border-border bg-card/50 p-6 space-y-3'>
                    <div className='flex items-center gap-2'>
                        <Sparkles className='h-4 w-4 text-primary' />
                        <h2 className='text-sm font-medium text-foreground'>
                            Resumen
                        </h2>
                    </div>
                    <p className='text-xs text-muted-foreground'>
                        Generado por OpenAI al finalizar la grabación, a partir
                        de la transcripción completa.
                    </p>

                    <div className='relative'>
                        {isProcessing && (
                            <div className='absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm'>
                                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                    Generando resumen…
                                </div>
                            </div>
                        )}

                        <Textarea
                            value={summary}
                            onChange={e => setSummary(e.target.value)}
                            rows={8}
                            className='rounded-xl resize-y min-h-[160px]'
                            placeholder={
                                status === 'stopped' && !summary && !isProcessing
                                    ? 'El resumen aparecerá aquí en unos segundos…'
                                    : 'El resumen aparecerá aquí después de grabar'
                            }
                            disabled={isProcessing}
                        />
                    </div>

                    {transcript && !isProcessing && (
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() =>
                                void handleGenerateSummary(transcript).then(
                                    () =>
                                        toast.success('Resumen actualizado')
                                )
                            }>
                            <Sparkles className='h-3.5 w-3.5 mr-1.5' />
                            Regenerar resumen
                        </Button>
                    )}
                </section>

                <section className='rounded-2xl border border-border bg-card/50 p-6'>
                    <div className='space-y-2'>
                        <Label htmlFor='title'>Título</Label>
                        <Input
                            id='title'
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder='Título de la nota'
                            className='rounded-xl'
                        />
                    </div>
                </section>

                <section className='rounded-2xl border border-border bg-card/50 p-6 space-y-4'>
                    <div className='flex items-center justify-between gap-4'>
                        <div>
                            <h2 className='text-sm font-medium text-foreground'>
                                Paciente
                            </h2>
                            <p className='text-xs text-muted-foreground mt-1'>
                                Requerido para guardar. Las notas se vinculan al
                                paciente para usarlas en protocolos.
                            </p>
                        </div>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => setShowAddPatient(true)}>
                            <UserPlus className='h-4 w-4 mr-1.5' />
                            Agregar paciente
                        </Button>
                    </div>

                    <Select value={patientId} onValueChange={setPatientId}>
                        <SelectTrigger className='rounded-xl'>
                            <SelectValue placeholder='Selecciona un paciente' />
                        </SelectTrigger>
                        <SelectContent>
                            {patients.map(patient => (
                                <SelectItem key={patient.id} value={patient.id}>
                                    {patient.firstName} {patient.lastName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </section>

                <div className='flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-8'>
                    <Button
                        type='button'
                        variant='outline'
                        onClick={() => requestNavigation('/notas')}
                        disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button
                        type='button'
                        onClick={() => void handleSave()}
                        disabled={isSaving || isRecording || isProcessing}
                        className='shadow-lg shadow-primary/25'>
                        {isSaving ? (
                            <>
                                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                Guardando…
                            </>
                        ) : (
                            <>
                                <Save className='h-4 w-4 mr-2' />
                                Guardar nota
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <AddPatientDialog
                open={showAddPatient}
                onOpenChange={setShowAddPatient}
                onPatientCreated={async newPatientId => {
                    await refetchPatients();
                    setPatientId(newPatientId);
                    setShowAddPatient(false);
                }}
            />

            <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogMedia>
                            <AlertTriangle className='text-destructive' />
                        </AlertDialogMedia>
                        <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {isRecording
                                ? 'La grabación está en curso. Si sales ahora, se perderá todo el audio y ningún dato se guardará.'
                                : 'Tienes cambios sin guardar. Si sales ahora, perderás la transcripción, el resumen y todo el contenido de la nota.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setPendingNavigation(null);
                            }}>
                            Continuar editando
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={event => {
                                event.preventDefault();
                                handleDiscardAndLeave();
                            }}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                            Salir sin guardar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
