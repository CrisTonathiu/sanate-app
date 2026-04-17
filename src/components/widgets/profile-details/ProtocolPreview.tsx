'use client';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {MEAL_CONFIG, MealType} from '@/lib/config/meal-config';
import {DayMeals} from '@/lib/interface/meal-interface';
import {motion} from 'framer-motion';
import {Eye, FileDown, FileText, Loader2, Save} from 'lucide-react';
import {useEffect, useState} from 'react';

interface ProtocolPreviewProps {
    weekPlan: DayMeals[];
    isFirstConsultation: boolean;
    protocolTitle?: string;
    durationLabel?: string;
    patientName?: string;
    isSavingTemplate?: boolean;
    templateSaveError?: string | null;
    onSaveTemplate?: (templateName: string) => Promise<boolean>;
}

export default function ProtocolPreview({
    weekPlan,
    isFirstConsultation,
    protocolTitle,
    durationLabel,
    patientName,
    isSavingTemplate = false,
    templateSaveError,
    onSaveTemplate
}: ProtocolPreviewProps) {
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] =
        useState<boolean>(false);
    const [templateName, setTemplateName] = useState<string>('');

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1500);
    };

    const handleSaveNotes = () => {
        setIsSavingNotes(true);
        setTimeout(() => setIsSavingNotes(false), 1500);
    };

    const mealEntries = MEAL_CONFIG.map(({key, label, icon: Icon}) => ({
        key,
        label,
        Icon
    }));

    useEffect(() => {
        if (!isTemplateDialogOpen) {
            setTemplateName(protocolTitle || 'Protocolo nutricional');
        }
    }, [isTemplateDialogOpen, protocolTitle]);

    const handleOpenTemplateDialog = () => {
        setTemplateName(protocolTitle || 'Protocolo nutricional');
        setIsTemplateDialogOpen(true);
    };

    const handleConfirmTemplateSave = async () => {
        const trimmedTemplateName = templateName.trim();

        if (!trimmedTemplateName || !onSaveTemplate) {
            return;
        }

        const didSave = await onSaveTemplate(trimmedTemplateName);

        if (didSave) {
            setIsTemplateDialogOpen(false);
        }
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
                            {protocolTitle || 'Protocolo nutricional'}
                        </h4>
                        <p className='text-xs text-muted-foreground'>
                            {durationLabel || 'Duracion no definida'}
                            {patientName ? ` | Paciente: ${patientName}` : ''}
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
                                    {mealEntries
                                        .filter(({key}) => {
                                            const meal = day[key as MealType];
                                            return Boolean(meal?.recipeName);
                                        })
                                        .map(({key, label, Icon}) => {
                                            const meal = day[key as MealType];

                                            return (
                                                <div
                                                    key={key}
                                                    className='flex flex-col gap-1'>
                                                    <span className='text-xs text-muted-foreground flex items-center gap-1'>
                                                        <Icon className='h-3 w-3' />
                                                        {label}
                                                    </span>
                                                    <span className='text-xs font-medium text-foreground'>
                                                        {meal.recipeName}
                                                    </span>
                                                </div>
                                            );
                                        })}
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
                        onClick={handleOpenTemplateDialog}
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

            <Dialog
                open={isTemplateDialogOpen}
                onOpenChange={open => {
                    if (!isSavingTemplate) {
                        setIsTemplateDialogOpen(open);
                    }
                }}>
                <DialogContent className='rounded-2xl border-border bg-background sm:max-w-md'>
                    <DialogHeader>
                        <DialogTitle>Guardar como plantilla</DialogTitle>
                        <DialogDescription>
                            Escribe un nombre para identificar esta plantilla y
                            reutilizarla al crear nuevos protocolos.
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-2'>
                        <Label htmlFor='template-name'>
                            Nombre de plantilla
                        </Label>
                        <Input
                            id='template-name'
                            value={templateName}
                            onChange={event =>
                                setTemplateName(event.target.value)
                            }
                            placeholder='Ej. Plan base de recomposición'
                            disabled={isSavingTemplate}
                            maxLength={120}
                            aria-invalid={Boolean(templateSaveError)}
                        />
                        {templateSaveError ? (
                            <p className='text-sm text-destructive'>
                                {templateSaveError}
                            </p>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => setIsTemplateDialogOpen(false)}
                            disabled={isSavingTemplate}>
                            Cancelar
                        </Button>
                        <Button
                            type='button'
                            onClick={handleConfirmTemplateSave}
                            disabled={
                                isSavingTemplate ||
                                templateName.trim().length < 3 ||
                                !onSaveTemplate
                            }>
                            {isSavingTemplate ? (
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : (
                                <FileDown className='mr-2 h-4 w-4' />
                            )}
                            Guardar plantilla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
