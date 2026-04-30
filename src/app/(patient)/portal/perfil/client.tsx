'use client';

import {PatientProfileData} from '@/lib/types/patient-type';
import {
    ArrowLeft,
    Calendar,
    CalendarDays,
    Camera,
    Mail,
    Ruler,
    User,
    Users,
    Weight
} from 'lucide-react';
import Link from 'next/link';
import {useState} from 'react';

interface PatientProfileClientProps {
    profileData: PatientProfileData;
}

interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value: string | Date | number;
}

function InfoRow({icon, label, value}: InfoRowProps) {
    return (
        <div className='flex items-center gap-4 rounded-xl bg-muted/50 p-4 transition-colors'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-amber-400'>
                {icon}
            </div>
            <div className='min-w-0 flex-1'>
                <p className='text-xs text-muted-foreground'>{label}</p>
                <p className='truncate text-sm font-medium text-foreground'>
                    {typeof value === 'string' || typeof value === 'number' ? (
                        value
                    ) : (
                        <span>{value.toLocaleDateString()}</span>
                    )}
                </p>
            </div>
        </div>
    );
}

export function PatientProfileClient({profileData}: PatientProfileClientProps) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(
        profileData.avatarUrl
    );
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState<string | null>(null);
    const fullName = `${profileData.firstName} ${profileData.lastName}`;

    async function handleAvatarChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadMessage(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/uploads/avatar', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                setUploadMessage(
                    result?.message || 'No se pudo actualizar el avatar'
                );
                return;
            }

            setAvatarUrl(result.avatarUrl ?? null);
            setUploadMessage('Avatar actualizado correctamente');
        } catch (error) {
            setUploadMessage(
                error instanceof Error
                    ? error.message
                    : 'Error al subir el avatar'
            );
        } finally {
            setUploading(false);
        }
    }

    return (
        <main className='mx-auto max-w-4xl min-h-screen bg-background p-4 md:p-6 lg:p-8 space-y-6'>
            {/* Back Button */}
            <Link
                href='/portal'
                className='mb-6 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                <ArrowLeft className='h-4 w-4' />
                Regresar al portal
            </Link>

            {/* Header */}
            <div className=''>
                <h1 className='text-2xl font-semibold'>Mi Perfil</h1>
                <p className='mt-2 text-muted-foreground'>
                    Tu información personal
                </p>
            </div>

            {/* Profile Card */}
            <div className='rounded-2xl bg-card p-6'>
                {/* Avatar Section */}
                <div className='mb-8 flex flex-col items-center'>
                    <div className='relative'>
                        <div className='flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-muted ring-4 ring-amber-500/20'>
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={fullName}
                                    className='h-full w-full object-cover'
                                />
                            ) : (
                                <User className='h-12 w-12 text-muted-foreground' />
                            )}
                        </div>
                        <label
                            htmlFor='avatar-upload'
                            className='absolute -bottom-1 -right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-amber-500 text-black shadow-lg'
                            aria-label='Subir avatar'>
                            <Camera className='h-4 w-4' />
                        </label>
                        <input
                            id='avatar-upload'
                            type='file'
                            accept='image/*'
                            className='sr-only'
                            onChange={handleAvatarChange}
                            disabled={uploading}
                        />
                    </div>
                    <h2 className='mt-4 text-xl font-semibold text-foreground'>
                        {fullName}
                    </h2>
                    <p className='text-sm text-muted-foreground'>
                        {profileData.email}
                    </p>
                    {uploadMessage ? (
                        <p className='mt-3 text-sm text-foreground'>
                            {uploadMessage}
                        </p>
                    ) : null}
                </div>

                {/* Info Grid */}
                <div className='space-y-3'>
                    <InfoRow
                        icon={<User className='h-5 w-5' />}
                        label='Nombre Completo'
                        value={fullName}
                    />
                    <InfoRow
                        icon={<Mail className='h-5 w-5' />}
                        label='Dirección de Correo'
                        value={profileData.email}
                    />
                    <InfoRow
                        icon={<Calendar className='h-5 w-5' />}
                        label='Edad'
                        value={`${profileData.birthDate ? Math.floor((new Date().getTime() - new Date(profileData.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 'N/A'} años`}
                    />
                    <InfoRow
                        icon={<Weight className='h-5 w-5' />}
                        label='Peso'
                        value={profileData.initialWeight || 'N/A'}
                    />
                    <InfoRow
                        icon={<Ruler className='h-5 w-5' />}
                        label='Altura'
                        value={profileData.height || 'N/A'}
                    />
                    <InfoRow
                        icon={<Users className='h-5 w-5' />}
                        label='Género'
                        value={profileData.gender || 'N/A'}
                    />
                    <InfoRow
                        icon={<CalendarDays className='h-5 w-5' />}
                        label='Miembro Desde'
                        value={profileData.createdAt || 'N/A'}
                    />
                </div>

                {/* Footer Note */}
                <p className='mt-6 text-center text-xs text-muted-foreground'>
                    Contacta al soporte para actualizar tu información de perfil
                </p>
            </div>
        </main>
    );
}
