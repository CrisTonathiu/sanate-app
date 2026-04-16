'use client';

import {Button} from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip';
import {StepKey} from '@/lib/types/patient-type';
import {cn} from '@/lib/utils';
import {
    Check,
    ChevronRight,
    Eye,
    FileText,
    Lightbulb,
    User,
    UtensilsCrossed,
    Utensils
} from 'lucide-react';

// --- Static data ---
const CREATE_MODE_STEPS = [
    {key: 1, label: 'Informacion del paciente', icon: User},
    {key: 2, label: 'Configuracion', icon: FileText},
    {key: 3, label: 'Distribución', icon: Utensils},
    {key: 4, label: 'Plan de comidas', icon: UtensilsCrossed},
    {key: 5, label: 'Recomendaciones', icon: Lightbulb},
    {key: 6, label: 'Vista previa', icon: Eye}
] as const;

const EDIT_MODE_STEPS = [
    {key: 1, label: 'Consulta', icon: FileText},
    {key: 2, label: 'Plan de comidas', icon: UtensilsCrossed},
    {key: 3, label: 'Vista previa y guardar', icon: Eye}
] as const;

export default function StepIndicator({
    currentStep,
    onStepClick,
    isFirstConsultation
}: {
    currentStep: StepKey;
    onStepClick: (step: StepKey) => void;
    isFirstConsultation: boolean;
}) {
    const steps = isFirstConsultation ? CREATE_MODE_STEPS : EDIT_MODE_STEPS;

    return (
        <TooltipProvider>
            <div className='flex items-center justify-center gap-2 mb-8'>
                {steps.map((step, index) => {
                    const isActive = currentStep === step.key;
                    const isCompleted = currentStep > step.key;
                    const isLocked = !isActive && !isCompleted;

                    return (
                        <div key={step.key} className='flex items-center'>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        disabled={isLocked}
                                        onClick={() =>
                                            onStepClick(step.key as StepKey)
                                        }
                                        className={cn(
                                            'flex items-center justify-center px-4 py-2 rounded-xl transition-all duration-300 min-w-12',
                                            isActive &&
                                                'bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)] text-primary-foreground hover:shadow-lg hover:shadow-[hsl(262,80%,60%)/0.25]',
                                            isCompleted &&
                                                'bg-secondary text-foreground',
                                            !isActive &&
                                                !isCompleted &&
                                                'bg-secondary/50 text-muted-foreground hover:bg-secondary/80 disabled:pointer-events-none disabled:hover:bg-secondary/50 disabled:opacity-60'
                                        )}>
                                        <div
                                            className={cn(
                                                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                                                isCompleted && 'bg-primary/20'
                                            )}>
                                            {isCompleted ? (
                                                <Check className='h-3.5 w-3.5' />
                                            ) : (
                                                <span>{step.key}</span>
                                            )}
                                        </div>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Paso {step.key}: {step.label}
                                </TooltipContent>
                            </Tooltip>
                            {index < steps.length - 1 && (
                                <ChevronRight className='h-4 w-4 mx-1 text-muted-foreground/50' />
                            )}
                        </div>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
