import {Button} from '@/components/ui/button';
import {useSidebar} from '@/lib/context/sidebar-context';
import {cn} from '@/lib/utils';
import {motion} from 'framer-motion';
import {Check, ChevronLeft, ChevronRight, Loader2} from 'lucide-react';

interface ProtocolNavigationProps {
    currentStep: number;
    maxStep: number;
    isFirstConsultation: boolean;
    nextStep: () => void;
    prevStep: () => void;
    onComplete?: () => void;
    isGenerating?: boolean;
    disableNextStep?: boolean;
    isCompleting?: boolean;
}

export function ProtocolNavigation({
    currentStep,
    maxStep,
    isFirstConsultation,
    nextStep,
    prevStep,
    onComplete,
    isGenerating = false,
    disableNextStep = false,
    isCompleting = false
}: ProtocolNavigationProps) {
    const {sidebarOpen} = useSidebar();

    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.2}}
            className={cn(
                'fixed bottom-0 right-0 z-50 bg-background/95 backdrop-blur-sm shadow-[0_-4px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out',
                sidebarOpen ? 'left-64' : 'left-0'
            )}>
            <div className='max-w-6xl mx-auto w-full px-4 sm:px-6 h-[105px] flex justify-between items-center'>
                <Button
                    variant='outline'
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className='h-11 px-6 rounded-xl'>
                    <ChevronLeft className='mr-2 h-4 w-4' />
                    Anterior
                </Button>

                {currentStep < maxStep ? (
                    <Button
                        onClick={nextStep}
                        disabled={isGenerating || disableNextStep}
                        className='h-11 px-6 rounded-xl'>
                        {isGenerating ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Generando plan...
                            </>
                        ) : (
                            <>
                                Siguiente paso
                                <ChevronRight className='ml-2 h-4 w-4' />
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        onClick={onComplete}
                        disabled={isCompleting}
                        className='h-11 px-6 rounded-xl'>
                        {isCompleting ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Guardando protocolo...
                            </>
                        ) : (
                            <>
                                <Check className='mr-2 h-4 w-4' />
                                {isFirstConsultation
                                    ? 'Completar Protocolo'
                                    : 'Completar Cambios'}
                            </>
                        )}
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
