'use client';

import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {motion} from 'framer-motion';

interface ConsultationInputsProps {
    reason: string;
    setReason: (value: string) => void;
    diagnosis: string;
    setDiagnosis: (value: string) => void;
    notes: string;
    setNotes: (value: string) => void;
}

export default function ConsultationInputs({
    reason,
    setReason,
    diagnosis,
    setDiagnosis,
    notes,
    setNotes
}: ConsultationInputsProps) {
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
                    <Label htmlFor='notes'>Notas</Label>
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
