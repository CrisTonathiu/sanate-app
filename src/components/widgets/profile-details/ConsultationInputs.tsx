'use client';

import {useState} from 'react';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {motion} from 'framer-motion';
import {Button} from '@/components/ui/button';
import {useCreateConsultation} from '@/hooks/use-consultations';

interface ConsultationInputsProps {
    patientId: string;
}

export default function ConsultationInputs({
    patientId
}: ConsultationInputsProps) {
    const [reason, setReason] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [followUpAt, setFollowUpAt] = useState('');
    const [submitMessage, setSubmitMessage] = useState<string | null>(null);

    const createConsultationMutation = useCreateConsultation();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitMessage(null);

        try {
            await createConsultationMutation.mutateAsync({
                patientId,
                reason: reason || undefined,
                diagnosis: diagnosis || undefined,
                notes: notes || undefined,
                followUpAt: followUpAt || undefined
            });

            setSubmitMessage('Consulta guardada correctamente.');
        } catch (error) {
            setSubmitMessage(
                error instanceof Error
                    ? error.message
                    : 'No se pudo guardar la consulta.'
            );
        }
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

            <form onSubmit={handleSubmit} className='grid gap-4'>
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
                    <Label htmlFor='notes'>Notas</Label>
                    <Textarea
                        id='notes'
                        value={notes}
                        onChange={event => setNotes(event.target.value)}
                        placeholder='Notas adicionales sobre el paciente o la consulta...'
                        className='min-h-[60px] resize-none'
                    />
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='followup'>Fecha de seguimiento</Label>
                    <Input
                        id='followup'
                        type='date'
                        value={followUpAt}
                        onChange={event => setFollowUpAt(event.target.value)}
                        className='w-full sm:w-auto'
                    />
                </div>

                <div className='flex items-center justify-end gap-3 pt-2'>
                    <Button
                        type='submit'
                        disabled={createConsultationMutation.isPending}
                        className='h-10 rounded-xl'>
                        {createConsultationMutation.isPending
                            ? 'Guardando...'
                            : 'Guardar consulta'}
                    </Button>
                </div>

                {submitMessage && (
                    <p className='text-sm text-muted-foreground'>
                        {submitMessage}
                    </p>
                )}
            </form>
        </motion.div>
    );
}
