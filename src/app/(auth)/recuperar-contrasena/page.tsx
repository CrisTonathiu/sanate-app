'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {motion, AnimatePresence} from 'framer-motion';
import Image from 'next/image';
import {ArrowLeft, ArrowRight, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {cn} from '@/lib/utils';
import {useMutation} from '@tanstack/react-query';

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

export default function RecuperarContrasenaPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const recoveryMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({email})
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message);
            }

            return res.json();
        },
        onSuccess: () => {
            router.push(
                `/recuperar-contrasena/confirmacion?email=${encodeURIComponent(email)}`
            );
        },
        onError: (error: Error) => {
            setFormError(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (recoveryMutation.isPending) return;
        setFormError(null);
        recoveryMutation.mutate();
    };

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
            <FloatingOrb
                className='left-1/2 top-1/2 h-32 w-32 bg-[#163A2A]'
                delay={4}
            />

            <div
                className='absolute inset-0 -z-10 opacity-[0.03]'
                style={{
                    backgroundImage:
                        'linear-gradient(hsl(0 0% 95%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 95%) 1px, transparent 1px)',
                    backgroundSize: '64px 64px'
                }}
            />

            <motion.div
                initial={{opacity: 0, y: 30, scale: 0.96}}
                animate={{opacity: 1, y: 0, scale: 1}}
                transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
                className='relative w-full max-w-md md:w-[400px]'>
                <div className='relative rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-[#163A2A/0.08]'>
                    <motion.div
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.5, delay: 0.2}}
                        className='mb-8 flex flex-col items-center gap-4'>
                        <motion.div
                            className='flex size-14 items-center justify-center rounded-2xl'
                            whileHover={{scale: 1.05, rotate: 5}}
                            whileTap={{scale: 0.95}}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 20
                            }}>
                            <Image
                                src='/logo-app.png'
                                alt='Zanate'
                                width={48}
                                height={48}
                                className='size-16 object-contain'
                            />
                        </motion.div>

                        <div className='text-center'>
                            <motion.h1
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                transition={{delay: 0.3}}
                                className='text-2xl font-bold tracking-tight text-foreground'>
                                Recuperar contraseña
                            </motion.h1>
                            <motion.p
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                transition={{delay: 0.4}}
                                className='mt-1 text-sm text-muted-foreground'>
                                Te enviaremos un enlace para restablecerla
                            </motion.p>
                        </div>
                    </motion.div>

                    <motion.form
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: 0.5}}
                        onSubmit={handleSubmit}
                        className='flex flex-col gap-5'>
                        <motion.div
                            className='flex flex-col gap-2'
                            initial={{opacity: 0, x: -10}}
                            animate={{opacity: 1, x: 0}}
                            transition={{delay: 0.55}}>
                            <Label
                                htmlFor='email'
                                className={cn(
                                    'text-sm font-medium transition-colors duration-200',
                                    focusedField === 'email'
                                        ? 'text-primary'
                                        : 'text-foreground'
                                )}>
                                Correo
                            </Label>
                            <div className='relative'>
                                <Input
                                    id='email'
                                    type='email'
                                    placeholder='mi-correo@ejemplo.com'
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    className={cn(
                                        'h-12 rounded-xl border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground transition-all duration-200',
                                        focusedField === 'email' &&
                                            'border-primary ring-1 ring-primary/30'
                                    )}
                                />
                                <AnimatePresence>
                                    {focusedField === 'email' && (
                                        <motion.div
                                            initial={{scaleX: 0}}
                                            animate={{scaleX: 1}}
                                            exit={{scaleX: 0}}
                                            className='absolute bottom-0 left-4 right-4 h-px origin-left'
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {formError && (
                            <div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
                                {formError}
                            </div>
                        )}

                        <motion.div
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.75}}
                            className='flex flex-col gap-3 pt-1'>
                            <Button
                                type='submit'
                                disabled={recoveryMutation.isPending}
                                className='relative h-12 w-full overflow-hidden rounded-xl text-sm font-semibold transition-all duration-200'>
                                <AnimatePresence mode='wait'>
                                    {recoveryMutation.isPending ? (
                                        <motion.div
                                            key='loading'
                                            initial={{opacity: 0, y: 10}}
                                            animate={{opacity: 1, y: 0}}
                                            exit={{opacity: 0, y: -10}}
                                            className='flex items-center gap-2'>
                                            <Loader2 className='h-4 w-4 animate-spin' />
                                            Enviando enlace...
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key='idle'
                                            initial={{opacity: 0, y: 10}}
                                            animate={{opacity: 1, y: 0}}
                                            exit={{opacity: 0, y: -10}}
                                            className='flex items-center gap-2'>
                                            Enviar enlace
                                            <ArrowRight className='h-4 w-4' />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.div
                                    className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent'
                                    animate={{translateX: ['−100%', '100%']}}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 3,
                                        ease: 'easeInOut'
                                    }}
                                />
                            </Button>

                            <Button
                                asChild
                                variant='ghost'
                                className='h-11 w-full rounded-xl text-sm text-muted-foreground'>
                                <Link href='/login'>
                                    <ArrowLeft className='mr-2 h-4 w-4' />
                                    Volver a iniciar sesión
                                </Link>
                            </Button>
                        </motion.div>
                    </motion.form>
                </div>
            </motion.div>
        </div>
    );
}
