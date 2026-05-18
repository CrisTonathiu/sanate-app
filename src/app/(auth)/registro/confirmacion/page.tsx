'use client';

import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {Mail} from 'lucide-react';
import {Button} from '@/components/ui/button';

export default function RegisterConfirmationPage() {
    const searchParams = useSearchParams();
    const email = searchParams?.get('email')?.trim();

    return (
        <div className='relative w-full max-w-md md:w-[400px]'>
            <div className='relative rounded-2xl border border-border bg-card p-8 shadow-2xl'>
                <div className='mb-6 flex justify-center'>
                    <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)]'>
                        <Mail className='h-7 w-7 text-primary-foreground' />
                    </div>
                </div>

                <h1 className='text-center text-2xl font-bold tracking-tight text-foreground'>
                    Revisa tu correo
                </h1>

                <p className='mt-4 text-center text-sm leading-relaxed text-muted-foreground'>
                    Enviamos un enlace de confirmación
                    {email ? (
                        <>
                            {' '}
                            a{' '}
                            <span className='font-medium text-foreground'>
                                {email}
                            </span>
                        </>
                    ) : (
                        ' a tu correo'
                    )}
                    . Haz clic en el enlace para activar tu cuenta y acceder al
                    portal.
                </p>

                <p className='mt-4 text-center text-xs text-muted-foreground'>
                    Si no lo ves, revisa la carpeta de spam o promociones.
                </p>

                <Button asChild className='mt-8 w-full'>
                    <Link href='/login'>Ir a iniciar sesión</Link>
                </Button>
            </div>
        </div>
    );
}