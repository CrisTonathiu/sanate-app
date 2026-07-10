'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import Table from '@/components/widgets/Table';
import {useGetPatientNotes} from '@/hooks/use-patient-notes';
import {motion} from 'framer-motion';
import {Eye, Mic, Plus, Search, StickyNote} from 'lucide-react';
import Link from 'next/link';
import {useMemo, useState} from 'react';

export default function ClientPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const {data: notes = [], isPending} = useGetPatientNotes();

    const filteredNotes = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return notes;

        return notes.filter(note => {
            const patientName = note.patient
                ? `${note.patient.user.firstName} ${note.patient.user.lastName}`.toLowerCase()
                : '';
            return (
                (note.title?.toLowerCase().includes(q) ?? false) ||
                note.content.toLowerCase().includes(q) ||
                (note.summary?.toLowerCase().includes(q) ?? false) ||
                patientName.includes(q)
            );
        });
    }, [notes, searchQuery]);

    const rows = filteredNotes.map(note => ({
        title: {
            primary: note.title || 'Nota sin título',
            secondary: note.summary
                ? note.summary.slice(0, 80) +
                  (note.summary.length > 80 ? '…' : '')
                : note.content.slice(0, 80) +
                  (note.content.length > 80 ? '…' : '')
        },
        patient: note.patient
            ? `${note.patient.user.firstName} ${note.patient.user.lastName}`
            : '—',
        date: new Date(note.createdAt).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }),
        type: note.transcript ? (
            <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                <Mic className='h-3.5 w-3.5' />
                Voz
            </span>
        ) : (
            <span className='text-xs text-muted-foreground'>Texto</span>
        ),
        actions: (
            <Button asChild size='sm' variant='outline'>
                <Link href={`/notas/${note.id}`}>
                    <Eye className='h-3.5 w-3.5 mr-1.5' />
                    Ver
                </Link>
            </Button>
        )
    }));

    return (
        <div className='relative w-full md:w-auto mt-3 md:mt-0'>
            <motion.div
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className='mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                            Notas
                        </h1>
                        <p className='text-sm text-muted-foreground mt-1'>
                            Notas de consulta vinculadas a pacientes para usar
                            en protocolos
                        </p>
                    </div>
                    <Button
                        asChild
                        className='h-11 px-5 rounded-xl font-medium shadow-lg shadow-primary/25'>
                        <Link href='/notas/nuevo'>
                            <Plus className='h-4 w-4 mr-2' />
                            Nueva nota
                        </Link>
                    </Button>
                </div>
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.1}}
                className='space-y-4'>
                <div className='relative max-w-md'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder='Buscar por título, paciente o contenido...'
                        className='h-11 pl-10 bg-card/50 border-border rounded-xl'
                    />
                </div>

                <p className='text-sm text-muted-foreground'>
                    {isPending ? 'Cargando notas...' : 'Mostrando'}{' '}
                    <span className='font-medium text-foreground'>
                        {filteredNotes.length}
                    </span>{' '}
                    notas
                </p>

                {filteredNotes.length === 0 && !isPending ? (
                    <div className='rounded-2xl border border-border bg-card/50 px-6 py-16 text-center'>
                        <StickyNote className='mx-auto h-10 w-10 text-muted-foreground/40 mb-4' />
                        <p className='text-muted-foreground mb-4'>
                            {searchQuery
                                ? 'No hay notas que coincidan con la búsqueda'
                                : 'Aún no tienes notas guardadas'}
                        </p>
                        <Button asChild>
                            <Link href='/notas/nuevo'>
                                <Mic className='h-4 w-4 mr-2' />
                                Grabar primera nota
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <Table
                        columns={[
                            {key: 'title', label: 'Nota'},
                            {key: 'patient', label: 'Paciente'},
                            {key: 'date', label: 'Fecha'},
                            {key: 'type', label: 'Tipo'},
                            {key: 'actions', label: 'Acciones'}
                        ]}
                        rows={rows}
                        isLoading={isPending}
                    />
                )}
            </motion.div>
        </div>
    );
}
