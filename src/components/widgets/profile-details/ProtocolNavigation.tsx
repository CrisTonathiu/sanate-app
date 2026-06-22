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
                'fixed bottom-0 right-0 left-0 z-50 bg-background/95 backdrop-blur-sm shadow-[0_-4px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out pb-[env(safe-area-inset-bottom)]',
                sidebarOpen && 'md:left-64'
            )}>
            <div className='mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4'>
                <Button
                    variant='outline'
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className='h-11 min-w-0 flex-1 rounded-xl px-3 text-sm sm:flex-none sm:px-6'>
                    <ChevronLeft className='mr-1 h-4 w-4 shrink-0 sm:mr-2' />
                    Anterior
                </Button>

                {currentStep < maxStep ? (
                    <Button
                        onClick={nextStep}
                        disabled={isGenerating || disableNextStep}
                        className='h-11 min-w-0 flex-1 rounded-xl px-3 text-sm sm:flex-none sm:px-6'>
                        {isGenerating ? (
                            <>
                                <Loader2 className='mr-1 h-4 w-4 shrink-0 animate-spin sm:mr-2' />
                                <span className='truncate sm:hidden'>Generando...</span>
                                <span className='hidden truncate sm:inline'>
                                    Generando plan...
                                </span>
                            </>
                        ) : (
                            <>
                                <span className='truncate sm:hidden'>Siguiente</span>
                                <span className='hidden truncate sm:inline'>
                                    Siguiente paso
                                </span>
                                <ChevronRight className='ml-1 h-4 w-4 shrink-0 sm:ml-2' />
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        onClick={onComplete}
                        disabled={isCompleting}
                        className='h-11 min-w-0 flex-1 rounded-xl px-3 text-sm sm:flex-none sm:px-6'>
                        {isCompleting ? (
                            <>
                                <Loader2 className='mr-1 h-4 w-4 shrink-0 animate-spin sm:mr-2' />
                                <span className='truncate sm:hidden'>Guardando...</span>
                                <span className='hidden truncate sm:inline'>
                                    Guardando protocolo...
                                </span>
                            </>
                        ) : (
                            <>
                                <Check className='mr-1 h-4 w-4 shrink-0 sm:mr-2' />
                                <span className='truncate sm:hidden'>Completar</span>
                                <span className='hidden truncate sm:inline'>
                                    {isFirstConsultation
                                        ? 'Completar Protocolo'
                                        : 'Completar Cambios'}
                                </span>
                            </>
                        )}
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
