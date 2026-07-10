'use client';

import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import PatientBreadcrumb from '@/components/widgets/profile-details/PatientBreadcrumb';
import {DownloadPlanButton} from '@/components/widgets/patient-portal/DownloadPlanButton';
import ProfileDetailsLoader from '@/components/loaders/ProfileDetailsLoader';
import {useGetPatientProfile} from '@/hooks/use-patients';
import {useGetPatientProtocol} from '@/hooks/use-patient-protocols';
import {MEAL_CONFIG, MealType} from '@/lib/config/meal-config';
import {cn} from '@/lib/utils';
import {motion} from 'framer-motion';
import {ArrowLeft, Calendar, Droplets, FileText, Leaf, Sparkles} from 'lucide-react';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Activo',
    COMPLETED: 'Completado',
    ARCHIVED: 'Archivado'
};

interface ProtocolDetailClientProps {
    patientId: string;
    protocolId: string;
}

export default function ProtocolDetailClient({
    patientId,
    protocolId
}: ProtocolDetailClientProps) {
    const {data: patient, isPending: isPatientPending} =
        useGetPatientProfile(patientId);
    const {
        data: protocol,
        isPending: isProtocolPending,
        isError
    } = useGetPatientProtocol(patientId, protocolId);

    if (isPatientPending || isProtocolPending) {
        return <ProfileDetailsLoader />;
    }

    if (!patient || isError || !protocol) {
        return (
            <div className='mx-auto max-w-3xl px-4 py-16 text-center'>
                <h1 className='text-xl font-semibold text-foreground'>
                    Protocolo no encontrado
                </h1>
                <p className='mt-2 text-sm text-muted-foreground'>
                    El protocolo no existe o no pertenece a este paciente.
                </p>
                <Button asChild className='mt-6' variant='outline'>
                    <Link href={`/pacientes/${patientId}`}>
                        Volver al paciente
                    </Link>
                </Button>
            </div>
        );
    }

    const mealEntries = MEAL_CONFIG.map(({key, label, icon: Icon}) => ({
        key,
        label,
        Icon
    }));

    const recommendationBlocks = [
        {
            title: 'Recomendaciones generales',
            icon: FileText,
            value: protocol.generalRecommendations
        },
        {
            title: 'Tips',
            icon: Sparkles,
            value: protocol.tips
        },
        {
            title: 'Hidratación',
            icon: Droplets,
            value: protocol.hydrationRecommendations
        },
        {
            title: 'Suplementos',
            icon: Leaf,
            value: protocol.supplementRecommendations
        }
    ].filter(block => block.value?.trim());

    const planFileSlug = protocol.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);

    return (
        <div className='relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
            <PatientBreadcrumb
                patientId={patientId}
                currentPageLabel='Protocolo'
            />

            <motion.div
                initial={{opacity: 0, y: 12}}
                animate={{opacity: 1, y: 0}}
                className='mb-8 space-y-4'>
                <Link
                    href={`/pacientes/${patientId}`}
                    className='inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground'>
                    <ArrowLeft className='h-4 w-4' />
                    Volver al paciente
                </Link>

                <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                    <div className='space-y-2'>
                        <div className='flex flex-wrap items-center gap-2'>
                            <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                                {protocol.title}
                            </h1>
                            <Badge
                                variant='secondary'
                                className={cn(
                                    'border-none',
                                    protocol.status === 'ACTIVE'
                                        ? 'bg-[hsl(150,60%,40%)/0.15] text-[hsl(150,60%,45%)]'
                                        : 'bg-muted text-muted-foreground'
                                )}>
                                {STATUS_LABELS[protocol.status] ??
                                    protocol.status}
                            </Badge>
                        </div>
                        <p className='flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground'>
                            <span>
                                {patient.firstName} {patient.lastName}
                            </span>
                            <span className='hidden sm:inline'>·</span>
                            <span className='inline-flex items-center gap-1'>
                                <Calendar className='h-3.5 w-3.5' />
                                {new Date(protocol.createdAt).toLocaleDateString(
                                    'es-MX',
                                    {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    }
                                )}
                            </span>
                            <span className='hidden sm:inline'>·</span>
                            <span>
                                {protocol.weekCount}{' '}
                                {protocol.weekCount === 1
                                    ? 'semana'
                                    : 'semanas'}
                            </span>
                        </p>
                    </div>

                    <DownloadPlanButton
                        recommendations={{
                            generalRecommendations:
                                protocol.generalRecommendations,
                            tips: protocol.tips,
                            hydrationRecommendations:
                                protocol.hydrationRecommendations,
                            supplementRecommendations:
                                protocol.supplementRecommendations,
                            affiliateLinks: []
                        }}
                        planMenuUrl={`/api/patients/${patientId}/protocols/${protocolId}/plan-menu`}
                        fileName={`plan-${planFileSlug || protocolId}.pdf`}
                    />
                </div>
            </motion.div>

            <div className='space-y-6'>
                <Card>
                    <CardHeader className='border-b border-border pb-3'>
                        <CardTitle className='text-lg'>Plan de comidas</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4 pt-6'>
                        {protocol.weekPlan.length === 0 ? (
                            <p className='text-sm text-muted-foreground'>
                                Este protocolo no tiene comidas asignadas.
                            </p>
                        ) : (
                            protocol.weekPlan.map(day => (
                                <div
                                    key={day.day}
                                    className='rounded-xl border border-border bg-secondary/30 p-4'>
                                    <h3 className='mb-3 text-sm font-semibold text-foreground'>
                                        {day.day}
                                    </h3>
                                    <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                                        {mealEntries
                                            .filter(({key}) => {
                                                const meal =
                                                    day[key as MealType];
                                                return Boolean(
                                                    meal?.recipeName
                                                );
                                            })
                                            .map(({key, label, Icon}) => {
                                                const meal =
                                                    day[key as MealType];

                                                return (
                                                    <div
                                                        key={key}
                                                        className='flex flex-col gap-1'>
                                                        <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                                                            <Icon className='h-3 w-3' />
                                                            {label}
                                                        </span>
                                                        <span className='text-xs font-medium text-foreground'>
                                                            {meal.recipeName}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {recommendationBlocks.length > 0 && (
                    <div className='grid gap-4 md:grid-cols-2'>
                        {recommendationBlocks.map(
                            ({title, icon: Icon, value}) => (
                                <Card key={title}>
                                    <CardHeader className='pb-2'>
                                        <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                                            <Icon className='h-4 w-4 text-primary' />
                                            {title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className='whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground'>
                                            {value}
                                        </p>
                                    </CardContent>
                                </Card>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
