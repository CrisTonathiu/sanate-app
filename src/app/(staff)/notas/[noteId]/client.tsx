'use client';

import {Button} from '@/components/ui/button';
import {useGetPatientNote} from '@/hooks/use-patient-notes';
import {ArrowLeft, Loader2, Mic} from 'lucide-react';
import Link from 'next/link';
import {useParams} from 'next/navigation';

export default function ClientPage() {
    const params = useParams();
    const noteId = params.noteId as string;
    const {data: note, isPending, isError} = useGetPatientNote(noteId);

    if (isPending) {
        return (
            <div className='flex items-center justify-center py-24 text-muted-foreground'>
                <Loader2 className='h-6 w-6 animate-spin mr-2' />
                Cargando nota…
            </div>
        );
    }

    if (isError || !note) {
        return (
            <div className='text-center py-24'>
                <p className='text-muted-foreground mb-4'>
                    No se encontró la nota
                </p>
                <Button asChild variant='outline'>
                    <Link href='/notas'>Volver a notas</Link>
                </Button>
            </div>
        );
    }

    const patientName = note.patient
        ? `${note.patient.user.firstName} ${note.patient.user.lastName}`
        : '—';

    return (
        <div className='space-y-6'>
            <div>
                <Link
                    href='/notas'
                    className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors'>
                    <ArrowLeft className='h-4 w-4' />
                    Volver a notas
                </Link>

                <div className='flex items-start justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                            {note.title || 'Nota sin título'}
                        </h1>
                        <p className='text-sm text-muted-foreground mt-1'>
                            {patientName} ·{' '}
                            {new Date(note.createdAt).toLocaleDateString(
                                'es-MX',
                                {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }
                            )}
                        </p>
                    </div>
                    {note.transcript && (
                        <span className='inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground'>
                            <Mic className='h-3.5 w-3.5' />
                            Nota de voz
                        </span>
                    )}
                </div>
            </div>

            {note.summary && (
                <section className='rounded-2xl border border-border bg-card/50 p-6'>
                    <h2 className='text-sm font-medium text-foreground mb-3'>
                        Resumen
                    </h2>
                    <p className='text-sm text-foreground whitespace-pre-wrap leading-relaxed'>
                        {note.summary}
                    </p>
                </section>
            )}

            <section className='rounded-2xl border border-border bg-card/50 p-6'>
                <h2 className='text-sm font-medium text-foreground mb-3'>
                    Contenido
                </h2>
                <p className='text-sm text-foreground whitespace-pre-wrap leading-relaxed'>
                    {note.content}
                </p>
            </section>

            {note.transcript && (
                <section className='rounded-2xl border border-border bg-card/50 p-6'>
                    <h2 className='text-sm font-medium text-foreground mb-3'>
                        Transcripción completa
                    </h2>
                    <p className='text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed'>
                        {note.transcript}
                    </p>
                </section>
            )}

            {note.patient && (
                <div className='pb-8'>
                    <Button asChild variant='outline'>
                        <Link href={`/pacientes/${note.patientId}`}>
                            Ver perfil del paciente
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
