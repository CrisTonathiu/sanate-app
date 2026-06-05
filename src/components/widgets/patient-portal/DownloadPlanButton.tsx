'use client';

import {useState} from 'react';
import {pdf} from '@react-pdf/renderer';
import {Download} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
    PlanPdf,
    PLAN_LETTERHEAD_PATH,
    PLAN_SECTION_BACKGROUND_PATH,
    PLAN_STATIC_PAGE_PATHS,
    type PlanRecommendations
} from './PlanPdf';
import {PLAN_RECIPE_BACKGROUND_PATH} from './PlanRecipePage';
import type {
    PlanMenuPayload,
    PlanMenuSectionPayload
} from '@/lib/services/patient/patient-plan-menu.service';

const DEFAULT_RECIPE_IMAGE_URL =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=640&h=480&fit=crop';

async function fetchImageAsDataUri(path: string): Promise<string> {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(
            `No se pudo cargar la plantilla del plan (${response.status})`
        );
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

async function resolveImageSrc(
    imageUrl: string | null,
    cache: Map<string, string>,
    fallbackSrc: string
): Promise<string> {
    const trimmed = imageUrl?.trim();
    if (!trimmed) {
        return fallbackSrc;
    }

    if (cache.has(trimmed)) {
        return cache.get(trimmed)!;
    }

    let fetchUrl: string;

    try {
        fetchUrl = trimmed.startsWith('http')
            ? new URL(trimmed).href
            : new URL(
                  trimmed.startsWith('/') ? trimmed : `/${trimmed}`,
                  window.location.origin
              ).href;
    } catch {
        return fallbackSrc;
    }

    try {
        const src = await fetchImageAsDataUri(fetchUrl);
        cache.set(trimmed, src);
        return src;
    } catch {
        return fallbackSrc;
    }
}

async function buildMenuSectionsForPdf(
    sections: PlanMenuSectionPayload[],
    fallbackImageSrc: string
) {
    const imageCache = new Map<string, string>();

    return Promise.all(
        sections.map(async section => ({
            section: section.section,
            recipes: await Promise.all(
                section.recipes.map(async recipe => ({
                    id: recipe.id,
                    title: recipe.title,
                    imageSrc: await resolveImageSrc(
                        recipe.imageUrl,
                        imageCache,
                        fallbackImageSrc
                    ),
                    ingredients: recipe.ingredients,
                    instructions: recipe.instructions
                }))
            )
        }))
    );
}

type DownloadPlanButtonProps = {
    recommendations: PlanRecommendations;
};

export function DownloadPlanButton({recommendations}: DownloadPlanButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);

        try {
            const menuResponse = await fetch('/api/portal/plan-menu');
            const menuBody = (await menuResponse.json()) as {
                success: boolean;
                menu?: PlanMenuPayload;
            };

            if (!menuResponse.ok || !menuBody.success || !menuBody.menu) {
                throw new Error('No se pudo cargar el menu del plan');
            }

            const [
                letterheadSrc,
                staticPageSrcs,
                sectionBackgroundSrc,
                recipeBackgroundSrc,
                fallbackRecipeImageSrc
            ] = await Promise.all([
                fetchImageAsDataUri(
                    `${window.location.origin}${PLAN_LETTERHEAD_PATH}`
                ),
                Promise.all(
                    PLAN_STATIC_PAGE_PATHS.map(path =>
                        fetchImageAsDataUri(
                            `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
                        )
                    )
                ),
                fetchImageAsDataUri(
                    `${window.location.origin}${PLAN_SECTION_BACKGROUND_PATH}`
                ),
                fetchImageAsDataUri(
                    `${window.location.origin}${PLAN_RECIPE_BACKGROUND_PATH}`
                ),
                fetchImageAsDataUri(DEFAULT_RECIPE_IMAGE_URL)
            ]);

            const menuSections = await buildMenuSectionsForPdf(
                menuBody.menu.sections,
                fallbackRecipeImageSrc
            );

            const blob = await pdf(
                <PlanPdf
                    letterheadSrc={letterheadSrc}
                    recommendations={recommendations}
                    staticPageSrcs={staticPageSrcs}
                    sectionBackgroundSrc={sectionBackgroundSrc}
                    recipeBackgroundSrc={recipeBackgroundSrc}
                    menuSections={menuSections}
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
