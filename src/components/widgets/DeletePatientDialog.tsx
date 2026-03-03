'use client';

import {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {AlertTriangle, Loader2, Trash2} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {useDeletePatient} from '@/hooks/use-patients';

interface DeletePatientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    patientName: string;
}

export default function DeletePatientDialog({
    open,
    onOpenChange,
    patientId,
    patientName
}: DeletePatientDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const {mutateAsync: deletePatientAsync} = useDeletePatient();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deletePatientAsync(patientId);
            onOpenChange(false);
        } catch {
            setIsDeleting(false);
        }
    };
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='rounded-2xl border-border bg-background p-0 sm:max-w-md'>
                {/* Header with warning accent */}
                <div className='relative overflow-hidden px-6 pb-4 pt-6'>
                    <div className='absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5' />
                    <div className='relative'>
                        <DialogHeader>
                            <div className='mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500'>
                                <AlertTriangle className='h-5 w-5 text-white' />
                            </div>
                            <DialogTitle className='text-lg font-bold text-foreground'>
                                Eliminar Paciente
                            </DialogTitle>
                            <DialogDescription className='text-sm text-muted-foreground'>
                                ¿Estás seguro de que deseas eliminar este
                                paciente?
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                <Separator className='bg-border/50' />

                {/* Content */}
                <div className='px-6 pb-6 pt-4'>
                    <div className='mb-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10'>
                        <div className='flex gap-3'>
                            <AlertTriangle className='h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400' />
                            <div className='flex flex-col gap-1'>
                                <p className='text-sm font-semibold text-red-900 dark:text-red-100'>
                                    Esta acción no se puede deshacer
                                </p>
                                <p className='text-sm text-red-700 dark:text-red-300'>
                                    Se eliminará permanentemente a{' '}
                                    <span className='font-semibold'>
                                        {patientName}
                                    </span>{' '}
                                    y todos sus registros médicos, consultas y
                                    datos asociados.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className='flex items-center justify-end gap-3'>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => onOpenChange(false)}
                            disabled={isDeleting}
                            className='h-10 rounded-xl border-border bg-secondary/30 px-5 text-sm text-foreground hover:bg-secondary/60'>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className='h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-6 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25'>
                            <AnimatePresence mode='wait'>
                                {isDeleting ? (
                                    <motion.span
                                        key='deleting'
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                        exit={{opacity: 0}}
                                        className='flex items-center gap-2'>
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                        Eliminando...
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key='idle'
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                        exit={{opacity: 0}}
                                        className='flex items-center gap-2'>
                                        <Trash2 className='h-4 w-4' />
                                        Eliminar Paciente
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
