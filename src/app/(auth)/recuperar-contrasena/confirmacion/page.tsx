'use client';

import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {motion} from 'framer-motion';
import Image from 'next/image';
import {Mail, ArrowLeft} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';

function FloatingOrb({
    className,
    delay = 0
}: {
    className?: string;
    delay?: number;
}) {
    return (
        <motion.div
            className={cn(
                'absolute rounded-full blur-3xl opacity-20',
                className
            )}
            animate={{
                y: [0, -30, 0],
                x: [0, 15, 0],
                scale: [1, 1.1, 1]
            }}
            transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
                delay
            }}
        />
    );
}

export default function RecuperarContrasenaConfirmacionPage() {
    const searchParams = useSearchParams();
    const email = searchParams?.get('email')?.trim();

    return (
        <div className=''>
            <motion.div
                className='absolute inset-0 -z-10 opacity-30'
                animate={{
                    background: [
                        'radial-gradient(circle at 20% 50%, hsl(262 80% 60% / 0.4) 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 30%, hsl(220 70% 55% / 0.4) 0%, transparent 50%)',
                        'radial-gradient(circle at 50% 80%, hsl(262 80% 60% / 0.4) 0%, transparent 50%)',
                        'radial-gradient(circle at 20% 50%, hsl(262 80% 60% / 0.4) 0%, transparent 50%)'
                    ]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />

            <FloatingOrb
                className='left-1/4 top-1/4 h-64 w-64 bg-[#163A2A]'
                delay={0}
            />
            <FloatingOrb
                className='right-1/4 bottom-1/4 h-48 w-48 bg-[#163A2A]'
                delay={2}
            />

            <motion.div
                initial={{opacity: 0, y: 30, scale: 0.96}}
                animate={{opacity: 1, y: 0, scale: 1}}
                transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
                className='relative w-full max-w-md md:w-[400px]'>
                <div className='relative rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-[#163A2A/0.08]'>
                    <div className='mb-6 flex flex-col items-center gap-4'>
                        <Image
                            src='/logo-app.png'
                            alt='Zanate'
                            width={48}
                            height={48}
                            className='size-16 object-contain'
                        />
                    </div>

                    <h1 className='text-center text-2xl font-bold tracking-tight text-foreground'>
                        Revisa tu correo
                    </h1>

                    <p className='mt-4 text-center text-sm leading-relaxed text-muted-foreground'>
                        Enviamos un enlace para restablecer tu contraseña
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
                        . Haz clic en el enlace para crear una nueva contraseña.
                    </p>

                    <p className='mt-4 text-center text-xs text-muted-foreground'>
                        Si no lo ves, revisa la carpeta de spam o promociones.
                        El enlace expira en 24 horas.
                    </p>

                    <Button asChild className='mt-8 h-12 w-full rounded-xl'>
                        <Link href='/login'>
                            <ArrowLeft className='mr-2 h-4 w-4' />
                            Volver a iniciar sesión
                        </Link>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
