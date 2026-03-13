'use client';

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
import {Separator} from '@/components/ui/separator';
import {motion} from 'framer-motion';
import {Loader2, Sparkles} from 'lucide-react';

interface ProtocolConfigCardProps {
    onGeneratePlan: () => void;
    isGenerating: boolean;
}

export default function ProtocolConfigCard({
    onGeneratePlan,
    isGenerating
}: ProtocolConfigCardProps) {
    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            className='rounded-2xl border border-border bg-card p-6'>
            <h3 className='text-lg font-semibold text-foreground mb-6'>
                Configuración del protocolo
            </h3>

            <div className='grid gap-6 sm:grid-cols-2'>
                <div className='space-y-2'>
                    <Label htmlFor='title'>Título del protocolo</Label>
                    <Input
                        id='title'
                        placeholder='ejemplo: Plan de manejo de diabetes'
                        className='w-full'
                    />
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='duration'>Duración del protocolo</Label>
                    <Select defaultValue='4weeks'>
                        <SelectTrigger id='duration'>
                            <SelectValue placeholder='Selecciona duración' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='1week'>1 semana</SelectItem>
                            <SelectItem value='2weeks'>2 semanas</SelectItem>
                            <SelectItem value='4weeks'>4 semanas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className='space-y-2 sm:col-span-2'>
                    <Label htmlFor='goal'>Objetivo</Label>
                    <Select defaultValue='diabetes'>
                        <SelectTrigger id='goal'>
                            <SelectValue placeholder='Selecciona objetivo' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='weightloss'>
                                Pérdida de peso
                            </SelectItem>
                            <SelectItem value='musclegain'>
                                Ganancia de músculo
                            </SelectItem>
                            <SelectItem value='diabetes'>
                                Control de diabetes
                            </SelectItem>
                            <SelectItem value='antiinflammatory'>
                                Antiinflamatorio
                            </SelectItem>
                            <SelectItem value='custom'>
                                Personalizado
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator className='my-6' />

            <Button
                onClick={onGeneratePlan}
                disabled={isGenerating}
                className='w-full h-12 rounded-xl bg-gradient-to-r text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all'>
                {isGenerating ? (
                    <>
                        <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                        Generando plan de comidas...
                    </>
                ) : (
                    <>
                        <Sparkles className='mr-2 h-5 w-5' />
                        Generar plan de comidas
                    </>
                )}
            </Button>
        </motion.div>
    );
}
