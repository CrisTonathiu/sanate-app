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
import {Loader2, Sparkles, Weight} from 'lucide-react';
import {useState} from 'react';

export interface GeneratePlanPayload {
    title: string;
    weekCount: number;
    goal:
        | 'perdida_peso'
        | 'ganancia_musculo'
        | 'control_diabetes'
        | 'antiinflamatorio'
        | 'personalizado';
    activityLevel?:
        | 'sedentario'
        | 'ligero'
        | 'moderado'
        | 'activo'
        | 'muy_activo';
    weightKg?: number;
    includeSmoothie?: boolean;
    includeDrinks?: boolean;
}

interface ProtocolConfigCardProps {
    onGeneratePlan: (payload: GeneratePlanPayload) => void;
    isGenerating: boolean;
}

export default function ProtocolConfigCard({
    onGeneratePlan,
    isGenerating
}: ProtocolConfigCardProps) {
    const [title, setTitle] = useState('');
    const [weekCount, setWeekCount] = useState('1');
    const [weight, setWeight] = useState('');
    const [goal, setGoal] =
        useState<GeneratePlanPayload['goal']>('personalizado');
    const [activityLevel, setActivityLevel] =
        useState<GeneratePlanPayload['activityLevel']>('moderado');
    const [includeSmoothie, setIncludeSmoothie] = useState(false);
    const [includeDrinks, setIncludeDrinks] = useState(false);

    const submitGeneration = () => {
        onGeneratePlan({
            title: title.trim() || 'Nuevo protocolo',
            weekCount: Number(weekCount),
            goal,
            activityLevel,
            weightKg: weight ? Number(weight) : undefined,
            includeSmoothie,
            includeDrinks
        });
    };

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
                        value={title}
                        onChange={event => setTitle(event.target.value)}
                        placeholder='ejemplo: Plan de manejo de diabetes'
                        className='w-full'
                    />
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='duration'>Duración del protocolo</Label>
                    <Select value={weekCount} onValueChange={setWeekCount}>
                        <SelectTrigger id='duration'>
                            <SelectValue placeholder='Selecciona duración' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='1'>1 semana</SelectItem>
                            <SelectItem value='2'>2 semanas</SelectItem>
                            <SelectItem value='4'>4 semanas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className='space-y-2 sm:col-span-2'>
                    <Label htmlFor='goal'>Objetivo</Label>
                    <Select
                        value={goal}
                        onValueChange={value =>
                            setGoal(value as GeneratePlanPayload['goal'])
                        }>
                        <SelectTrigger id='goal'>
                            <SelectValue placeholder='Selecciona objetivo' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='perdida_peso'>
                                Pérdida de peso
                            </SelectItem>
                            <SelectItem value='ganancia_musculo'>
                                Ganancia de músculo
                            </SelectItem>
                            <SelectItem value='control_diabetes'>
                                Control de diabetes
                            </SelectItem>
                            <SelectItem value='antiinflamatorio'>
                                Antiinflamatorio
                            </SelectItem>
                            <SelectItem value='personalizado'>
                                Personalizado
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className='space-y-2 sm:col-span-2'>
                    <Label htmlFor='activityLevel'>Nivel de actividad</Label>
                    <Select
                        value={activityLevel}
                        onValueChange={value =>
                            setActivityLevel(
                                value as GeneratePlanPayload['activityLevel']
                            )
                        }>
                        <SelectTrigger id='activityLevel'>
                            <SelectValue placeholder='Selecciona actividad' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='sedentario'>
                                Sedentario
                            </SelectItem>
                            <SelectItem value='ligero'>Ligero</SelectItem>
                            <SelectItem value='moderado'>Moderado</SelectItem>
                            <SelectItem value='activo'>Activo</SelectItem>
                            <SelectItem value='muy_activo'>
                                Muy activo
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className='space-y-2 sm:col-span-2'>
                    <Label htmlFor='weightKg'>Peso actual (kg)</Label>
                    <div className='relative'>
                        <Weight className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                        <Input
                            id='weightKg'
                            type='number'
                            min={20}
                            max={400}
                            step='0.1'
                            value={weight}
                            onChange={event => setWeight(event.target.value)}
                            placeholder='ejemplo: 72.5'
                            className='w-full pl-10'
                        />
                    </div>
                </div>

                <div className='space-y-2 sm:col-span-2'>
                    <Label>Opcionales del plan</Label>
                    <div className='grid gap-3 sm:grid-cols-2'>
                        <Button
                            type='button'
                            variant={includeSmoothie ? 'default' : 'outline'}
                            onClick={() =>
                                setIncludeSmoothie(current => !current)
                            }
                            className='justify-start'>
                            {includeSmoothie ? 'Incluye' : 'Agregar'} batido
                        </Button>
                        <Button
                            type='button'
                            variant={includeDrinks ? 'default' : 'outline'}
                            onClick={() =>
                                setIncludeDrinks(current => !current)
                            }
                            className='justify-start'>
                            {includeDrinks ? 'Incluye' : 'Agregar'} bebida
                        </Button>
                    </div>
                    <p className='text-xs text-muted-foreground'>
                        Batido y bebida son opcionales. El plan se puede generar
                        sin estos tiempos de comida.
                    </p>
                </div>
            </div>

            <Separator className='my-6' />

            <Button
                onClick={submitGeneration}
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
