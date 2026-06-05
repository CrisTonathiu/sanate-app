'use client';

import {useState} from 'react';
import {pdf} from '@react-pdf/renderer';
import {Download} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
    PlanPdf,
    PLAN_LETTERHEAD_PATH,
    PLAN_STATIC_PAGE_PATH,
    type PlanRecommendations
} from './PlanPdf';

async function fetchImageAsDataUri(path: string): Promise<string> {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`No se pudo cargar la plantilla del plan (${response.status})`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
                return;
            }

            reject(new Error('No se pudo leer la plantilla del plan'));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

type DownloadPlanButtonProps = {
    recommendations: PlanRecommendations;
};

export function DownloadPlanButton({
    recommendations
}: DownloadPlanButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);

        try {
            const letterheadSrc = await fetchImageAsDataUri(
                `${window.location.origin}${PLAN_LETTERHEAD_PATH}`
            );
            const staticPageSrc = await fetchImageAsDataUri(
                `${window.location.origin}${PLAN_STATIC_PAGE_PATH}`
            );
            const blob = await pdf(
                <PlanPdf
                    letterheadSrc={letterheadSrc}
                    recommendations={recommendations}
                    staticPageSrc={staticPageSrc}
                />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mi-plan.pdf';
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al descargar el plan:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Button
            type='button'
            variant='outline'
            onClick={handleDownload}
            disabled={isDownloading}
            className='gap-2 rounded-full'>
            <Download className='h-4 w-4' />
            {isDownloading ? 'Generando...' : 'Descargar Plan'}
        </Button>
    );
}
