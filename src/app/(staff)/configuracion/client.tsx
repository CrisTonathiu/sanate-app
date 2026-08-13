'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {
    useGetAppSettings,
    useUpdateAppSettings
} from '@/hooks/use-app-settings';
import {motion} from 'framer-motion';
import {Settings} from 'lucide-react';
import {toast} from 'sonner';

export default function ClientPage() {
    const {data: settings, isPending} = useGetAppSettings();
    const {mutateAsync: updateSettings, isPending: isSaving} =
        useUpdateAppSettings();

    const mixMainMeals = settings?.mixMainMeals ?? false;

    async function handleMixMainMealsChange(checked: boolean) {
        try {
            await updateSettings({mixMainMeals: checked});
            toast.success(
                checked
                    ? 'El plan mezclará desayuno, comida y cena'
                    : 'El plan volverá a asignar recetas por tipo de comida'
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'No se pudieron guardar los ajustes'
            );
        }
    }

    return (
        <div className='relative w-full md:w-auto mt-3 md:mt-0'>
            <motion.div
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className='mb-8'>
                <div className='flex items-center gap-3'>
                    <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                        <Settings className='h-5 w-5' />
                    </div>
                    <div>
                        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                            Configuración
                        </h1>
                        <p className='text-sm text-muted-foreground mt-1'>
                            Ajustes de generación de menús y protocolos
                        </p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.1}}>
                <Card className='rounded-2xl border-border bg-card/50'>
                    <CardHeader>
                        <CardTitle className='text-lg'>
                            Generación de comidas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='flex items-start justify-between gap-6'>
                            <div className='space-y-1.5'>
                                <Label
                                    htmlFor='mix-main-meals'
                                    className='text-sm font-medium text-foreground'>
                                    Mezclar desayuno, comida y cena
                                </Label>
                                <p className='text-sm text-muted-foreground max-w-xl'>
                                    Al generar el planificador, una receta de
                                    cena puede ir en desayuno, una de comida en
                                    cena, y así entre esos tres horarios.
                                    Batidos, colaciones y bebidas se mantienen
                                    en su tipo.
                                </p>
                            </div>
                            <Switch
                                id='mix-main-meals'
                                checked={mixMainMeals}
                                disabled={isPending || isSaving}
                                onCheckedChange={handleMixMainMealsChange}
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
