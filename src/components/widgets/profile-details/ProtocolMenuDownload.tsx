'use client';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {useDownloadPlan} from '@/components/widgets/patient-portal/DownloadPlanButton';
import type {PlanRecommendations} from '@/components/widgets/patient-portal/PlanPdf';
import {motion} from 'framer-motion';
import {CheckCircle2, Download, Loader2} from 'lucide-react';

function slugifyFilePart(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function formatProtocolDateForFileName(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function buildProtocolMenuFileName(
    patientName: string,
    protocolCreatedAt: string | Date
): string {
    const patientSlug = slugifyFilePart(patientName) || 'paciente';
    const createdAt =
        protocolCreatedAt instanceof Date
            ? protocolCreatedAt
            : new Date(protocolCreatedAt);
    const datePart = Number.isNaN(createdAt.getTime())
        ? formatProtocolDateForFileName(new Date())
        : formatProtocolDateForFileName(createdAt);

    return `menu-${patientSlug}-${datePart}.pdf`;
}

interface ProtocolMenuDownloadProps {
    patientId: string;
    protocolId: string;
    protocolTitle: string;
    patientName: string;
    protocolCreatedAt: string;
    recommendations: PlanRecommendations;
    onBackToPreview?: () => void;
}

export default function ProtocolMenuDownload({
    patientId,
    protocolId,
    protocolTitle,
    patientName,
    protocolCreatedAt,
    recommendations,
    onBackToPreview
}: ProtocolMenuDownloadProps) {
    const {isDownloading, handleDownload} = useDownloadPlan(recommendations, {
        planMenuUrl: `/api/patients/${patientId}/protocols/${protocolId}/plan-menu`,
        fileName: buildProtocolMenuFileName(patientName, protocolCreatedAt)
    });

    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            className='space-y-6'>
            <Card>
                <CardHeader className='pb-3 border-b border-border'>
                    <CardTitle className='text-lg flex items-center gap-2'>
                        <CheckCircle2 className='h-5 w-5 text-primary' />
                        Protocolo listo
                    </CardTitle>
                </CardHeader>
                <CardContent className='pt-6 space-y-4'>
                    <div>
                        <h4 className='text-sm font-semibold text-foreground mb-1'>
                            {protocolTitle}
                        </h4>
                        <p className='text-xs text-muted-foreground'>
                            Paciente: {patientName}
                        </p>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                        El protocolo se guardó correctamente. Ya puedes
                        descargar el menú completo para compartirlo con el
                        paciente.
                    </p>
                    <div className='flex flex-col sm:flex-row gap-3 pt-2'>
                        <Button
                            type='button'
                            onClick={() => {
                                void handleDownload();
                            }}
                            disabled={isDownloading}
                            className='flex-1 h-12 rounded-xl text-primary-foreground font-semibold shadow-lg shadow-primary/25'>
                            {isDownloading ? (
                                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                            ) : (
                                <Download className='mr-2 h-5 w-5' />
                            )}
                            {isDownloading
                                ? 'Generando menú…'
                                : 'Descargar menú del protocolo'}
                        </Button>
                        {onBackToPreview ? (
                            <Button
                                type='button'
                                variant='outline'
                                onClick={onBackToPreview}
                                disabled={isDownloading}
                                className='flex-1 h-12 rounded-xl'>
                                Volver a la vista previa
                            </Button>
                        ) : null}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
