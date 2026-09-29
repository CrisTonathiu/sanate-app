'use client';

import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Role} from '@/lib/types/user-type';
import {getUserFullName, getUserInitials} from '@/lib/utils';
import {useMutation} from '@tanstack/react-query';
import {motion} from 'framer-motion';
import {Eye, EyeOff, Loader2, UserRound} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {toast} from 'sonner';

const ROLE_LABELS: Record<Role, string> = {
    ADMIN: 'Administrador',
    NUTRITIONIST: 'Nutriólogo',
    PATIENT: 'Paciente'
};

type ProfileUser = {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    role: Role;
};

async function sendJson(url: string, method: string, body: unknown) {
    const res = await fetch(url, {
        method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Ocurrió un error');
    }

    return data;
}

export default function ClientPage({user}: {user: ProfileUser}) {
    const router = useRouter();
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName, setLastName] = useState(user.lastName);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const name = getUserFullName(user.firstName, user.lastName);
    const initials = getUserInitials(user.firstName, user.lastName);

    const nameChanged =
        firstName.trim() !== user.firstName ||
        lastName.trim() !== user.lastName;

    const profileMutation = useMutation({
        mutationFn: () =>
            sendJson('/api/profile', 'PATCH', {firstName, lastName}),
        onSuccess: () => {
            toast.success('Nombre actualizado');
            router.refresh();
        },
        onError: (error: Error) => toast.error(error.message)
    });

    const passwordMutation = useMutation({
        mutationFn: () => {
            if (newPassword !== confirmPassword) {
                throw new Error('Las contraseñas no coinciden');
            }
            return sendJson('/api/profile/password', 'POST', {
                currentPassword,
                newPassword
            });
        },
        onSuccess: () => {
            toast.success('Contraseña actualizada');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (error: Error) => toast.error(error.message)
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nameChanged || profileMutation.isPending) return;
        profileMutation.mutate();
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordMutation.isPending) return;
        passwordMutation.mutate();
    };

    return (
        <div className='relative w-full mt-3 md:mt-0 space-y-6'>
            <motion.div
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className='mb-8'>
                <div className='flex items-center gap-3'>
                    <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                        <UserRound className='h-5 w-5' />
                    </div>
                    <div>
                        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                            Mi perfil
                        </h1>
                        <p className='text-sm text-muted-foreground mt-1'>
                            Administra tu información y contraseña
                        </p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.05}}>
                <Card className='rounded-2xl border-border bg-card/50'>
                    <CardContent className='pt-6 flex items-center gap-4'>
                        <Avatar className='h-16 w-16 border-2 border-primary'>
                            <AvatarImage
                                src={user.avatarUrl || undefined}
                                alt={name}
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className='min-w-0 space-y-1'>
                            <p className='truncate text-lg font-semibold text-foreground'>
                                {name}
                            </p>
                            <p className='truncate text-sm text-muted-foreground'>
                                {user.email}
                            </p>
                            <Badge variant='outline'>
                                {ROLE_LABELS[user.role]}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.1}}>
                <Card className='rounded-2xl border-border bg-card/50'>
                    <CardHeader>
                        <CardTitle className='text-lg'>
                            Información personal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleProfileSubmit}
                            className='space-y-4'>
                            <div className='grid gap-4 sm:grid-cols-2'>
                                <div className='space-y-2'>
                                    <Label htmlFor='firstName'>Nombre</Label>
                                    <Input
                                        id='firstName'
                                        value={firstName}
                                        onChange={e =>
                                            setFirstName(e.target.value)
                                        }
                                        required
                                        minLength={2}
                                        className='rounded-xl'
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <Label htmlFor='lastName'>Apellido</Label>
                                    <Input
                                        id='lastName'
                                        value={lastName}
                                        onChange={e =>
                                            setLastName(e.target.value)
                                        }
                                        required
                                        minLength={2}
                                        className='rounded-xl'
                                    />
                                </div>
                            </div>
                            <div className='flex justify-end'>
                                <Button
                                    type='submit'
                                    className='rounded-xl'
                                    disabled={
                                        !nameChanged ||
                                        profileMutation.isPending
                                    }>
                                    {profileMutation.isPending && (
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                    )}
                                    Guardar cambios
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.15}}>
                <Card className='rounded-2xl border-border bg-card/50'>
                    <CardHeader>
                        <CardTitle className='text-lg'>
                            Cambiar contraseña
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handlePasswordSubmit}
                            className='space-y-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='currentPassword'>
                                    Contraseña actual
                                </Label>
                                <div className='relative'>
                                    <Input
                                        id='currentPassword'
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        autoComplete='current-password'
                                        value={currentPassword}
                                        onChange={e =>
                                            setCurrentPassword(e.target.value)
                                        }
                                        required
                                        className='rounded-xl pr-11'
                                    />
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className='absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'
                                        aria-label={
                                            showPassword
                                                ? 'Ocultar contraseñas'
                                                : 'Mostrar contraseñas'
                                        }>
                                        {showPassword ? (
                                            <EyeOff className='h-4 w-4' />
                                        ) : (
                                            <Eye className='h-4 w-4' />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className='grid gap-4 sm:grid-cols-2'>
                                <div className='space-y-2'>
                                    <Label htmlFor='newPassword'>
                                        Nueva contraseña
                                    </Label>
                                    <Input
                                        id='newPassword'
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        autoComplete='new-password'
                                        placeholder='Mínimo 8 caracteres'
                                        value={newPassword}
                                        onChange={e =>
                                            setNewPassword(e.target.value)
                                        }
                                        required
                                        minLength={8}
                                        className='rounded-xl'
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <Label htmlFor='confirmPassword'>
                                        Confirmar contraseña
                                    </Label>
                                    <Input
                                        id='confirmPassword'
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        autoComplete='new-password'
                                        placeholder='Repite tu contraseña'
                                        value={confirmPassword}
                                        onChange={e =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        required
                                        minLength={8}
                                        className='rounded-xl'
                                    />
                                </div>
                            </div>
                            <div className='flex justify-end'>
                                <Button
                                    type='submit'
                                    className='rounded-xl'
                                    disabled={passwordMutation.isPending}>
                                    {passwordMutation.isPending && (
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                    )}
                                    Actualizar contraseña
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
