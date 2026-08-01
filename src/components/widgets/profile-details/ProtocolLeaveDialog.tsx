'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {Loader2, Save} from 'lucide-react';

interface ProtocolLeaveDialogProps {
    open: boolean;
    isSaving: boolean;
    onOpenChange: (open: boolean) => void;
    onStay: () => void;
    onSaveDraft: () => void;
}

export default function ProtocolLeaveDialog({
    open,
    isSaving,
    onOpenChange,
    onStay,
    onSaveDraft
}: ProtocolLeaveDialogProps) {
    return (
        <AlertDialog
            open={open}
            onOpenChange={nextOpen => {
                if (isSaving) return;
                onOpenChange(nextOpen);
            }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogMedia>
                        <Save className='text-primary' />
                    </AlertDialogMedia>
                    <AlertDialogTitle>
                        ¿Guardar borrador antes de salir?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Tienes cambios sin guardar en este protocolo. Puedes
                        seguir editando o guardar un borrador para continuar
                        después.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSaving} onClick={onStay}>
                        Seguir editando
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={isSaving}
                        onClick={event => {
                            event.preventDefault();
                            onSaveDraft();
                        }}>
                        {isSaving ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Guardando...
                            </>
                        ) : (
                            'Guardar borrador'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
