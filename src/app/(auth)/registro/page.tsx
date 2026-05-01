'use client';

import {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {motion, AnimatePresence} from 'framer-motion';
import {Eye, EyeOff, ArrowRight, Loader2, Apple} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {cn} from '@/lib/utils';
import {useMutation} from '@tanstack/react-query';

// Floating orb component for background
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

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isEmailBlocked, setIsEmailBlocked] = useState(false);

    useEffect(() => {
        const urlEmail = searchParams?.get('email')?.trim();

        if (urlEmail) {
            setEmail(urlEmail);
            setIsEmailBlocked(true);
        }
    }, [searchParams]);

    const registerMutation = useMutation({
        onError: (error: Error) => {
            setFormError(error.message);
        },
        onSuccess: () => {
            setFormError(null);
            router.push('/');
        },
        mutationFn: async () => {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({email, password})
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message);
            }

            return res.json();
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (registerMutation.isPending) return;

        if (password !== confirmPassword) {
            setFormError('Las contraseñas no coinciden');
            return;
        }

        setFormError(null);
        registerMutation.mutate();
    };

    return (
        <div className=''>
            {/* Animated gradient background */}
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

            {/* Floating orbs */}
            <FloatingOrb
                className='left-1/4 top-1/4 h-64 w-64 bg-[hsl(262,80%,60%)]'
                delay={0}
            />
            <FloatingOrb
                className='right-1/4 bottom-1/4 h-48 w-48 bg-[hsl(220,70%,55%)]'
                delay={2}
            />
            <FloatingOrb
                className='left-1/2 top-1/2 h-32 w-32 bg-[hsl(262,80%,60%)]'
                delay={4}
            />

            {/* Grid pattern overlay */}
            <div
                className='absolute inset-0 -z-10 opacity-[0.03]'
                style={{
                    backgroundImage:
                        'linear-gradient(hsl(0 0% 95%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 95%) 1px, transparent 1px)',
                    backgroundSize: '64px 64px'
                }}
            />

            {/* Login card */}
            <motion.div
                initial={{opacity: 0, y: 30, scale: 0.96}}
                animate={{opacity: 1, y: 0, scale: 1}}
                transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}
                className='relative w-full max-w-md md:w-[400px]'>
                {/* Card glow effect */}
                <div className='absolute -inset-px rounded-2xl bg-gradient-to-b from-[hsl(262,80%,60%)/0.3] via-transparent to-[hsl(220,70%,55%)/0.15] blur-sm' />

                <div className='relative rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-[hsl(262,80%,60%)/0.08]'>
                    {/* Logo and brand */}
                    <motion.div
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.5, delay: 0.2}}
                        className='mb-8 flex flex-col items-center gap-4'>
                        <motion.div
                            className='flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)]'
                            whileHover={{scale: 1.05, rotate: 5}}
                            whileTap={{scale: 0.95}}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 20
                            }}>
                            <Apple className='h-7 w-7 text-primary-foreground' />
                        </motion.div>

                        <div className='text-center'>
                            <motion.h1
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                transition={{delay: 0.3}}
                                className='text-2xl font-bold tracking-tight text-foreground'>
                                Sanate App
                            </motion.h1>
                            <motion.p
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                transition={{delay: 0.4}}
                                className='mt-1 text-sm text-muted-foreground'>
                                Crea tu cuenta para comenzar a cuidar tu salud
                            </motion.p>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: 0.5}}
                        onSubmit={handleSubmit}
                        className='flex flex-col gap-5'>
                        {/* Email field */}
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
                                    readOnly={isEmailBlocked}
                                    aria-readonly={isEmailBlocked}
                                    className={cn(
                                        'h-12 rounded-xl border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground transition-all duration-200',
                                        isEmailBlocked &&
                                            'cursor-not-allowed bg-secondary/70',
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
                                            className='absolute bottom-0 left-4 right-4 h-px origin-left bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)]'
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Password field */}
                        <motion.div
                            className='flex flex-col gap-2'
                            initial={{opacity: 0, x: -10}}
                            animate={{opacity: 1, x: 0}}
                            transition={{delay: 0.65}}>
                            <div className='flex items-center justify-between'>
                                <Label
                                    htmlFor='password'
                                    className={cn(
                                        'text-sm font-medium transition-colors duration-200',
                                        focusedField === 'password'
                                            ? 'text-primary'
                                            : 'text-foreground'
                                    )}>
                                    Contraseña
                                </Label>
                            </div>
                            <div className='relative'>
                                <Input
                                    id='password'
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder='Ingresa tu contraseña'
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    className={cn(
                                        'h-12 rounded-xl border-border bg-secondary/50 pr-12 pl-4 text-foreground placeholder:text-muted-foreground transition-all duration-200',
                                        focusedField === 'password' &&
                                            'border-primary ring-1 ring-primary/30'
                                    )}
                                />
                                <button
                                    type='button'
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className='absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
                                    aria-label={
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }>
                                    <AnimatePresence
                                        mode='wait'
                                        initial={false}>
                                        {showPassword ? (
                                            <motion.div
                                                key='eye-off'
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.8,
                                                    rotate: -90
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    rotate: 0
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.8,
                                                    rotate: 90
                                                }}
                                                transition={{duration: 0.15}}>
                                                <EyeOff className='h-4 w-4' />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key='eye'
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.8,
                                                    rotate: -90
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    rotate: 0
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.8,
                                                    rotate: 90
                                                }}
                                                transition={{duration: 0.15}}>
                                                <Eye className='h-4 w-4' />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                                <AnimatePresence>
                                    {focusedField === 'password' && (
                                        <motion.div
                                            initial={{scaleX: 0}}
                                            animate={{scaleX: 1}}
                                            exit={{scaleX: 0}}
                                            className='absolute bottom-0 left-4 right-4 h-px origin-left bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)]'
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Confirm password field */}
                        <motion.div
                            className='flex flex-col gap-2'
                            initial={{opacity: 0, x: -10}}
                            animate={{opacity: 1, x: 0}}
                            transition={{delay: 0.7}}>
                            <Label
                                htmlFor='confirmPassword'
                                className={cn(
                                    'text-sm font-medium transition-colors duration-200',
                                    focusedField === 'confirmPassword'
                                        ? 'text-primary'
                                        : 'text-foreground'
                                )}>
                                Confirmar contraseña
                            </Label>
                            <div className='relative'>
                                <Input
                                    id='confirmPassword'
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder='Repite tu contraseña'
                                    value={confirmPassword}
                                    onChange={e =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    onFocus={() =>
                                        setFocusedField('confirmPassword')
                                    }
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    className={cn(
                                        'h-12 rounded-xl border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground transition-all duration-200',
                                        focusedField === 'confirmPassword' &&
                                            'border-primary ring-1 ring-primary/30'
                                    )}
                                />
                                <AnimatePresence>
                                    {focusedField === 'confirmPassword' && (
                                        <motion.div
                                            initial={{scaleX: 0}}
                                            animate={{scaleX: 1}}
                                            exit={{scaleX: 0}}
                                            className='absolute bottom-0 left-4 right-4 h-px origin-left bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)]'
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Sign in button */}
                        {formError && (
                            <div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
                                {formError}
                            </div>
                        )}
                        <motion.div
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: 0.75}}
                            className='pt-1'>
                            <Button
                                type='submit'
                                disabled={registerMutation.isPending}
                                className='relative h-12 w-full overflow-hidden rounded-xl text-sm font-semibold transition-all duration-200'>
                                <AnimatePresence mode='wait'>
                                    {registerMutation.isPending ? (
                                        <motion.div
                                            key='loading'
                                            initial={{opacity: 0, y: 10}}
                                            animate={{opacity: 1, y: 0}}
                                            exit={{opacity: 0, y: -10}}
                                            className='flex items-center gap-2'>
                                            <Loader2 className='h-4 w-4 animate-spin' />
                                            Registrando...
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key='idle'
                                            initial={{opacity: 0, y: 10}}
                                            animate={{opacity: 1, y: 0}}
                                            exit={{opacity: 0, y: -10}}
                                            className='flex items-center gap-2'>
                                            Registrarse
                                            <ArrowRight className='h-4 w-4' />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Button shimmer effect */}
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
                        </motion.div>
                    </motion.form>
                </div>
            </motion.div>
        </div>
    );
}
