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
    /** Omit when drafts aren't allowed (e.g. editing an active protocol). */
    onSaveDraft?: () => void;
    onLeaveWithoutSaving: () => void;
}

export default function ProtocolLeaveDialog({
    open,
    isSaving,
    onOpenChange,
    onStay,
    onSaveDraft,
    onLeaveWithoutSaving
}: ProtocolLeaveDialogProps) {
    const canSaveDraft = Boolean(onSaveDraft);

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
                        {canSaveDraft
                            ? '¿Guardar borrador antes de salir?'
                            : '¿Salir sin guardar los cambios?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {canSaveDraft
                            ? 'Tienes cambios sin guardar en este protocolo. Puedes seguir editando o guardar un borrador para continuar después.'
                            : 'Tienes cambios sin guardar en este protocolo. Si sales ahora, el paciente seguirá viendo la versión anterior.'}
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
                            if (onSaveDraft) {
                                onSaveDraft();
                            } else {
                                onLeaveWithoutSaving();
                            }
                        }}>
                        {isSaving ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Guardando...
                            </>
                        ) : canSaveDraft ? (
                            'Guardar borrador'
                        ) : (
                            'Salir sin guardar'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
