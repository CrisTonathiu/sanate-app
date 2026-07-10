'use client';

import {Button} from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {useGetPatientNotesByPatient} from '@/hooks/use-patient-notes';
import type {PatientNoteDTO} from '@/lib/dto/PatientNoteDTO';
import {motion} from 'framer-motion';
import {FilePlus2, Loader2, StickyNote} from 'lucide-react';

interface ConsultationInputsProps {
    patientId: string;
    reason: string;
    setReason: (value: string) => void;
    diagnosis: string;
    setDiagnosis: (value: string) => void;
    notes: string;
    setNotes: (value: string) => void;
}

function formatNoteForInsertion(note: PatientNoteDTO): string {
    const title = note.title || 'Nota sin título';
    const date = new Date(note.createdAt).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    const body = note.summary?.trim() || note.content.trim();

    return `--- ${title} (${date}) ---\n${body}`;
}

function appendNoteText(current: string, noteText: string): string {
    if (!current.trim()) {
        return noteText;
    }

    return `${current.trimEnd()}\n\n${noteText}`;
}

export default function ConsultationInputs({
    patientId,
    reason,
    setReason,
    diagnosis,
    setDiagnosis,
    notes,
    setNotes
}: ConsultationInputsProps) {
    const {data: patientNotes = [], isPending: isLoadingNotes} =
        useGetPatientNotesByPatient(patientId);

    const handleAddNote = (note: PatientNoteDTO) => {
        setNotes(appendNoteText(notes, formatNoteForInsertion(note)));
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.1}}
            className='rounded-2xl border border-border bg-card p-6 mt-4'>
            <h3 className='text-lg font-semibold text-foreground mb-4'>
                Detalles de la consulta
            </h3>
            <div className='grid gap-4'>
                <div className='space-y-2'>
                    <Label htmlFor='reason'>Motivo de consulta</Label>
                    <Textarea
                        id='reason'
                        value={reason}
                        onChange={event => setReason(event.target.value)}
                        placeholder='Ingresa el motivo principal de esta consulta de nutricion...'
                        className='min-h-[80px] resize-none'
                    />
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='diagnosis'>Diagnostico</Label>
                    <Textarea
                        id='diagnosis'
                        value={diagnosis}
                        onChange={event => setDiagnosis(event.target.value)}
                        placeholder='Ingresa el diagnostico o la evaluacion nutricional...'
                        className='min-h-[80px] resize-none'
                    />
                </div>

                <div className='space-y-2'>
                    <div className='flex items-center justify-between gap-3'>
                        <Label htmlFor='notes'>Notas</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    className='h-8 rounded-lg text-xs'
                                    disabled={isLoadingNotes}>
                                    {isLoadingNotes ? (
                                        <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                                    ) : (
                                        <FilePlus2 className='mr-1.5 h-3.5 w-3.5' />
                                    )}
                                    Agregar nota guardada
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align='end'
                                className='w-72 rounded-xl border-border bg-popover'>
                                <DropdownMenuLabel className='text-xs text-muted-foreground font-normal'>
                                    Notas del paciente
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {patientNotes.length === 0 ? (
                                    <div className='px-2 py-3 text-center text-xs text-muted-foreground'>
                                        <StickyNote className='mx-auto mb-2 h-4 w-4 opacity-50' />
                                        No hay notas guardadas para este paciente
                                    </div>
                                ) : (
                                    patientNotes.map(note => (
                                        <DropdownMenuItem
                                            key={note.id}
                                            className='cursor-pointer flex-col items-start gap-0.5 py-2 focus:bg-muted focus:text-foreground'
                                            onClick={() => handleAddNote(note)}>
                                            <span className='text-sm font-medium text-foreground'>
                                                {note.title || 'Nota sin título'}
                                            </span>
                                            <span className='text-xs text-muted-foreground line-clamp-2'>
                                                {note.summary ||
                                                    note.content.slice(0, 100) +
                                                        (note.content.length > 100
                                                            ? '…'
                                                            : '')}
                                            </span>
                                            <span className='text-[11px] text-muted-foreground/80'>
                                                {new Date(
                                                    note.createdAt
                                                ).toLocaleDateString('es-MX', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <Textarea
                        id='notes'
                        value={notes}
                        onChange={event => setNotes(event.target.value)}
                        placeholder='Notas adicionales sobre el paciente o la consulta...'
                        className='min-h-[60px] resize-none'
                    />
                </div>
            </div>
        </motion.div>
    );
}
