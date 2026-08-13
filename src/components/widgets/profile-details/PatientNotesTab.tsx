'use client';

import {useRef, useState} from 'react';
import {motion} from 'framer-motion';
import {Loader2, Plus, StickyNote} from 'lucide-react';
import {toast} from 'sonner';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import SectionHeading from '../SectionHeading';
import {
    useCreatePatientNote,
    useGetPatientNotesByPatient,
    useUpdatePatientNote
} from '@/hooks/use-patient-notes';
import type {PatientNoteDTO} from '@/lib/dto/PatientNoteDTO';

const TITLE_MAX_LENGTH = 72;

function truncateWithDots(text: string, max = TITLE_MAX_LENGTH): string {
    const collapsed = text.replace(/\s+/g, ' ').trim();
    if (!collapsed) return 'Nota sin título';
    if (collapsed.length <= max) return collapsed;
    return `${collapsed.slice(0, max).trimEnd()}...`;
}

function noteListTitle(note: PatientNoteDTO): string {
    return truncateWithDots(note.summary || note.content);
}

function titleFromContent(content: string): string {
    const firstLine =
        content.trim().split('\n')[0]?.replace(/\s+/g, ' ').trim() ?? '';
    if (firstLine.length <= TITLE_MAX_LENGTH) return firstLine;
    return firstLine.slice(0, TITLE_MAX_LENGTH).trimEnd();
}

function formatLastEdited(dateString: string): string {
    return new Date(dateString).toLocaleString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

interface PatientNotesTabProps {
    patientId: string;
}

export default function PatientNotesTab({patientId}: PatientNotesTabProps) {
    const {data: notes = [], isPending, isError} =
        useGetPatientNotesByPatient(patientId);
    const {mutateAsync: createNote, isPending: isCreating} =
        useCreatePatientNote();
    const {mutateAsync: updateNote, isPending: isUpdating} =
        useUpdatePatientNote();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<PatientNoteDTO | null>(null);
    const [content, setContent] = useState('');

    const contentRef = useRef(content);
    const editingNoteRef = useRef(editingNote);
    const savedExplicitlyRef = useRef(false);
    const isSavingRef = useRef(false);

    contentRef.current = content;
    editingNoteRef.current = editingNote;

    const isSaving = isCreating || isUpdating;

    const openNewNote = () => {
        savedExplicitlyRef.current = false;
        setEditingNote(null);
        setContent('');
        setDialogOpen(true);
    };

    const openExistingNote = (note: PatientNoteDTO) => {
        savedExplicitlyRef.current = false;
        setEditingNote(note);
        setContent(note.content);
        setDialogOpen(true);
    };

    const persistNote = async (status: 'DRAFT' | 'SAVED') => {
        const trimmed = contentRef.current.trim();
        if (!trimmed || isSavingRef.current) return false;

        const currentNote = editingNoteRef.current;
        const contentUnchanged = currentNote?.content === trimmed;

        if (
            currentNote &&
            contentUnchanged &&
            currentNote.status === status
        ) {
            return true;
        }

        if (status === 'DRAFT' && currentNote && contentUnchanged) {
            return true;
        }

        isSavingRef.current = true;

        try {
            const payload = {
                content: trimmed,
                title: titleFromContent(trimmed),
                status
            };

            if (currentNote) {
                await updateNote({noteId: currentNote.id, ...payload});
            } else {
                await createNote({patientId, ...payload});
            }

            toast.success(
                status === 'DRAFT'
                    ? 'Borrador guardado'
                    : 'Nota guardada correctamente'
            );
            return true;
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'No se pudo guardar la nota'
            );
            return false;
        } finally {
            isSavingRef.current = false;
        }
    };

    const handleSave = async () => {
        if (!contentRef.current.trim()) {
            toast.error('Escribe el contenido de la nota antes de guardar');
            return;
        }

        savedExplicitlyRef.current = true;
        const saved = await persistNote('SAVED');
        if (saved) {
            setDialogOpen(false);
        } else {
            savedExplicitlyRef.current = false;
        }
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setDialogOpen(true);
            return;
        }

        setDialogOpen(false);

        if (savedExplicitlyRef.current) {
            return;
        }

        if (contentRef.current.trim()) {
            void persistNote('DRAFT');
        }
    };

    return (
        <motion.div
            key='notes'
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -12}}
            transition={{duration: 0.35}}
            className='flex flex-col gap-4'>
            <div className='flex items-center justify-between gap-3'>
                <SectionHeading title='Notas' delay={0.1} />
                <Button
                    type='button'
                    onClick={openNewNote}
                    className='h-9 rounded-xl px-4 text-sm font-semibold'>
                    <Plus className='mr-1.5 h-4 w-4' />
                    Agregar nota
                </Button>
            </div>

            {isPending ? (
                <div className='flex items-center justify-center gap-2 rounded-xl border border-border bg-card/50 py-16 text-sm text-muted-foreground'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Cargando notas…
                </div>
            ) : isError ? (
                <div className='rounded-xl border border-border bg-card/50 px-6 py-12 text-center text-sm text-muted-foreground'>
                    No se pudieron cargar las notas. Intenta de nuevo.
                </div>
            ) : notes.length === 0 ? (
                <div className='rounded-xl border border-border bg-card/50 px-6 py-16 text-center'>
                    <StickyNote className='mx-auto mb-3 h-10 w-10 text-muted-foreground/40' />
                    <p className='text-sm text-muted-foreground'>
                        Este paciente aún no tiene notas.
                    </p>
                    <Button
                        type='button'
                        variant='outline'
                        className='mt-4 rounded-xl'
                        onClick={openNewNote}>
                        <Plus className='mr-1.5 h-4 w-4' />
                        Agregar nota
                    </Button>
                </div>
            ) : (
                <div className='flex flex-col gap-3'>
                    {notes.map((note, i) => (
                        <motion.button
                            key={note.id}
                            type='button'
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            transition={{
                                delay: 0.1 + i * 0.06,
                                duration: 0.3
                            }}
                            onClick={() => openExistingNote(note)}
                            className='group flex w-full cursor-pointer items-start justify-between gap-4 rounded-xl border border-border bg-card/50 p-4 text-left transition-colors duration-200 hover:bg-secondary/30'>
                            <div className='flex min-w-0 flex-col gap-1'>
                                <span className='break-words text-sm font-medium text-foreground'>
                                    {noteListTitle(note)}
                                </span>
                                <span className='text-xs text-muted-foreground'>
                                    Última edición:{' '}
                                    {formatLastEdited(note.updatedAt)}
                                </span>
                            </div>
                            {note.status === 'DRAFT' && (
                                <Badge
                                    variant='secondary'
                                    className='shrink-0 border-none bg-amber-500/15 text-amber-700 dark:text-amber-400'>
                                    Borrador
                                </Badge>
                            )}
                        </motion.button>
                    ))}
                </div>
            )}

            <NoteEditorDialog
                open={dialogOpen}
                onOpenChange={handleOpenChange}
                isEditing={!!editingNote}
                content={content}
                onContentChange={setContent}
                isSaving={isSaving}
                onSave={() => void handleSave()}
            />
        </motion.div>
    );
}

function NoteEditorDialog({
    open,
    onOpenChange,
    isEditing,
    content,
    onContentChange,
    isSaving,
    onSave
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isEditing: boolean;
    content: string;
    onContentChange: (value: string) => void;
    isSaving: boolean;
    onSave: () => void;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className='flex max-h-[90vh] flex-col overflow-hidden rounded-2xl border-border bg-background sm:max-w-xl'
                onOpenAutoFocus={event => {
                    event.preventDefault();
                    textareaRef.current?.focus();
                }}>
                <DialogHeader className='shrink-0'>
                    <DialogTitle>
                        {isEditing ? 'Editar nota' : 'Nueva nota'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Actualiza el contenido de la nota. Si cierras sin guardar, se conservará como borrador.'
                            : 'Escribe la nota del paciente. Si cierras sin guardar, se conservará como borrador.'}
                    </DialogDescription>
                </DialogHeader>

                <div className='flex min-h-0 flex-col gap-2'>
                    <Label htmlFor='patient-note-content'>Contenido</Label>
                    <Textarea
                        ref={textareaRef}
                        id='patient-note-content'
                        value={content}
                        onChange={event => onContentChange(event.target.value)}
                        rows={10}
                        disabled={isSaving}
                        style={{fieldSizing: 'fixed'}}
                        className='h-[200px] max-h-[200px] min-h-[200px] resize-none overflow-y-auto rounded-xl'
                        placeholder='Escribe la nota aquí...'
                    />
                </div>

                <DialogFooter className='shrink-0'>
                    <Button
                        type='button'
                        onClick={onSave}
                        disabled={isSaving}
                        className='rounded-xl'>
                        {isSaving ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Guardando…
                            </>
                        ) : (
                            'Guardar'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
