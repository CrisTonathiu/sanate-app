'use client';

import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import SectionHeading from '../SectionHeading';
import {useDownloadPlan} from '@/components/widgets/patient-portal/DownloadPlanButton';
import {useGetPatientProtocols} from '@/hooks/use-patient-protocols';
import {cn} from '@/lib/utils';
import {motion} from 'framer-motion';
import {
    Calendar,
    ClipboardList,
    Download,
    Eye,
    Loader2
} from 'lucide-react';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Activo',
    COMPLETED: 'Completado',
    ARCHIVED: 'Archivado'
};

function ProtocolDownloadButton({
    patientId,
    protocol
}: {
    patientId: string;
    protocol: {
        id: string;
        title: string;
        generalRecommendations: string | null;
        tips: string | null;
        hydrationRecommendations: string | null;
        supplementRecommendations: string | null;
    };
}) {
    const slug = protocol.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);

    const {isDownloading, handleDownload} = useDownloadPlan(
        {
            generalRecommendations: protocol.generalRecommendations,
            tips: protocol.tips,
            hydrationRecommendations: protocol.hydrationRecommendations,
            supplementRecommendations: protocol.supplementRecommendations,
            affiliateLinks: []
        },
        {
            planMenuUrl: `/api/patients/${patientId}/protocols/${protocol.id}/plan-menu`,
            fileName: `plan-${slug || protocol.id}.pdf`
        }
    );

    return (
        <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-9 rounded-lg'
            disabled={isDownloading}
            onClick={() => {
                void handleDownload();
            }}>
            {isDownloading ? (
                <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
            ) : (
                <Download className='mr-1.5 h-3.5 w-3.5' />
            )}
            {isDownloading ? 'Generando…' : 'Descargar plan'}
        </Button>
    );
}

interface AppointmentHistoryTabProps {
    patientId: string;
}

export default function AppointmentHistoryTab({
    patientId
}: AppointmentHistoryTabProps) {
    const {data: protocols = [], isPending, isError} =
        useGetPatientProtocols(patientId);

    return (
        <motion.div
            key='appointments'
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -12}}
            transition={{duration: 0.35}}
            className='flex flex-col gap-4'>
            <SectionHeading title='Historial de protocolos' delay={0.1} />

            {isPending ? (
                <div className='flex items-center justify-center gap-2 rounded-xl border border-border bg-card/50 py-16 text-sm text-muted-foreground'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Cargando protocolos…
                </div>
            ) : isError ? (
                <div className='rounded-xl border border-border bg-card/50 px-6 py-12 text-center text-sm text-muted-foreground'>
                    No se pudieron cargar los protocolos. Intenta de nuevo.
                </div>
            ) : protocols.length === 0 ? (
                <div className='rounded-xl border border-border bg-card/50 px-6 py-16 text-center'>
                    <ClipboardList className='mx-auto mb-3 h-10 w-10 text-muted-foreground/40' />
                    <p className='text-sm text-muted-foreground'>
                        Este paciente aún no tiene protocolos guardados.
                    </p>
                </div>
            ) : (
                <div className='flex flex-col gap-3'>
                    {protocols.map((protocol, i) => (
                        <motion.div
                            key={protocol.id}
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            transition={{
                                delay: 0.1 + i * 0.06,
                                duration: 0.3
                            }}
                            className='group flex flex-col gap-4 rounded-xl border border-border bg-card/50 p-4 transition-colors duration-200 hover:bg-secondary/30 sm:flex-row sm:items-center sm:justify-between'>
                            <div className='flex items-center gap-4'>
                                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60'>
                                    <Calendar className='h-4 w-4 text-primary' />
                                </div>
                                <div className='flex flex-col gap-0.5'>
                                    <span className='text-sm font-medium text-foreground'>
                                        {protocol.title}
                                    </span>
                                    <span className='text-xs text-muted-foreground'>
                                        {protocol.weekCount}{' '}
                                        {protocol.weekCount === 1
                                            ? 'semana'
                                            : 'semanas'}
                                        {' · '}
                                        {new Date(
                                            protocol.createdAt
                                        ).toLocaleDateString('es-MX', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div className='flex flex-wrap items-center gap-2 sm:justify-end'>
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
                                <Button
                                    asChild
                                    variant='outline'
                                    size='sm'
                                    className='h-9 rounded-lg'>
                                    <Link
                                        href={`/pacientes/${patientId}/protocolos/${protocol.id}`}>
                                        <Eye className='mr-1.5 h-3.5 w-3.5' />
                                        Ver
                                    </Link>
                                </Button>
                                <ProtocolDownloadButton
                                    patientId={patientId}
                                    protocol={protocol}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
