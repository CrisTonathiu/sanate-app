'use client';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {DayMeals} from '@/lib/interface/meal-interface';
import {motion} from 'framer-motion';
import {
    Apple,
    Coffee,
    Eye,
    FileDown,
    FileText,
    Loader2,
    Moon,
    Save,
    Sun,
    UserPlus
} from 'lucide-react';
import {useState} from 'react';

interface ProtocolPreviewProps {
    weekPlan: DayMeals[];
    isFirstConsultation: boolean;
}

export default function ProtocolPreview({
    weekPlan,
    isFirstConsultation
}: ProtocolPreviewProps) {
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1500);
    };

    const handleSaveNotes = () => {
        setIsSavingNotes(true);
        setTimeout(() => setIsSavingNotes(false), 1500);
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            className='space-y-6'>
            <Card>
                <CardHeader className='pb-3 border-b border-border'>
                    <CardTitle className='text-lg flex items-center gap-2'>
                        <Eye className='h-5 w-5 text-primary' />
                        {isFirstConsultation
                            ? 'Vista previa del protocolo'
                            : 'Vista previa de cambios del menu'}
                    </CardTitle>
                </CardHeader>
                <CardContent className='pt-6'>
                    <div className='mb-6'>
                        <h4 className='text-sm font-semibold text-foreground mb-1'>
                            Protocolo de control de diabetes
                        </h4>
                        <p className='text-xs text-muted-foreground'>
                            Duracion: 4 semanas | Paciente: Willie Jennings
                        </p>
                    </div>

                    <div className='space-y-4'>
                        {weekPlan.map(day => (
                            <div
                                key={day.day}
                                className='p-4 rounded-xl bg-secondary/30 border border-border'>
                                <h5 className='text-sm font-semibold text-foreground mb-3'>
                                    {day.day}
                                </h5>
                                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                                    <div className='flex flex-col gap-1'>
                                        <span className='text-xs text-muted-foreground flex items-center gap-1'>
                                            <Coffee className='h-3 w-3' />{' '}
                                            Desayuno
                                        </span>
                                        <span className='text-xs font-medium text-foreground'>
                                            {day.breakfast.recipeName}
                                        </span>
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        <span className='text-xs text-muted-foreground flex items-center gap-1'>
                                            <Apple className='h-3 w-3' />
                                            Colación
                                        </span>
                                        <span className='text-xs font-medium text-foreground'>
                                            {day.snack.recipeName}
                                        </span>
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        <span className='text-xs text-muted-foreground flex items-center gap-1'>
                                            <Sun className='h-3 w-3' /> Comida
                                        </span>
                                        <span className='text-xs font-medium text-foreground'>
                                            {day.lunch.recipeName}
                                        </span>
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        <span className='text-xs text-muted-foreground flex items-center gap-1'>
                                            <Moon className='h-3 w-3' /> Cena
                                        </span>
                                        <span className='text-xs font-medium text-foreground'>
                                            {day.dinner.recipeName}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Conditional footer actions based on mode */}
            {isFirstConsultation ? (
                <div className='flex flex-col sm:flex-row gap-3'>
                    {/* <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className='flex-1 h-12 rounded-xl text-primary-foreground font-semibold shadow-lg shadow-primary/25'>
                        {isSaving ? (
                            <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                        ) : (
                            <Save className='mr-2 h-5 w-5' />
                        )}
                        Guardar protocolo
                    </Button> */}
                    <Button
                        variant='outline'
                        className='flex-1 h-12 rounded-xl'>
                        <FileDown className='mr-2 h-5 w-5' />
                        Guardar como plantilla
                    </Button>
                </div>
            ) : (
                <div className='flex flex-col sm:flex-row gap-3'>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className='flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-lg shadow-primary/25'>
                        {isSaving ? (
                            <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                        ) : (
                            <Save className='mr-2 h-5 w-5' />
                        )}
                        Guardar cambios del menu
                    </Button>
                    <Button
                        variant='outline'
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className='flex-1 h-12 rounded-xl'>
                        {isSavingNotes ? (
                            <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                        ) : (
                            <FileText className='mr-2 h-5 w-5' />
                        )}
                        Guardar notas de consulta
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
