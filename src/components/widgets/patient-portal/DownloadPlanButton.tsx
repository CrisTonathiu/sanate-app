'use client';

import {useState} from 'react';
import {pdf} from '@react-pdf/renderer';
import {Download} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
    PlanPdf,
    PLAN_LETTERHEAD_PATH,
    PLAN_PORTION_GUIDE_PATH,
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

function readBlobAsDataUri(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
                return;
            }

            reject(new Error('No se pudo leer la imagen'));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

/** Detects PNG/JPEG by magic bytes; the Content-Type header can't be trusted. */
async function sniffPdfImageMime(
    blob: Blob
): Promise<'image/png' | 'image/jpeg' | null> {
    const bytes = new Uint8Array(await blob.slice(0, 4).arrayBuffer());

    if (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
    ) {
        return 'image/png';
    }

    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return 'image/jpeg';
    }

    return null;
}

/**
 * react-pdf only renders PNG and JPEG. Other formats (WebP, AVIF, GIF…) load
 * fine but render as an empty box, so they're re-encoded to JPEG via canvas.
 */
async function fetchRecipeImageAsPdfDataUri(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`No se pudo cargar la imagen (${response.status})`);
    }

    const blob = await response.blob();
    const mime = await sniffPdfImageMime(blob);

    if (mime) {
        return readBlobAsDataUri(new Blob([blob], {type: mime}));
    }

    const bitmap = await createImageBitmap(blob);

    try {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('No se pudo convertir la imagen');
        }

        // JPEG has no alpha; paint white under transparent images.
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0);

        return canvas.toDataURL('image/jpeg', 0.9);
    } finally {
        bitmap.close();
    }
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
        const src = await fetchRecipeImageAsPdfDataUri(fetchUrl);
        cache.set(trimmed, src);
        return src;
    } catch (error) {
        console.warn('[plan-pdf] Recipe image failed, using fallback', {
            imageUrl: trimmed,
            error
        });
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
    planMenuUrl?: string;
    fileName?: string;
};

export function useDownloadPlan(
    recommendations: PlanRecommendations,
    options?: {planMenuUrl?: string; fileName?: string}
) {
    const [isDownloading, setIsDownloading] = useState(false);
    const planMenuUrl = options?.planMenuUrl ?? '/api/portal/plan-menu';
    const fileName = options?.fileName ?? 'mi-plan.pdf';

    const handleDownload = async () => {
        setIsDownloading(true);

        try {
            const menuResponse = await fetch(planMenuUrl, {
                credentials: 'include'
            });
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
                portionGuideSrc,
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
                    `${window.location.origin}${PLAN_PORTION_GUIDE_PATH}`
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
                    portionGuideSrc={portionGuideSrc}
                    sectionBackgroundSrc={sectionBackgroundSrc}
                    recipeBackgroundSrc={recipeBackgroundSrc}
                    menuSections={menuSections}
                    weekSchedules={menuBody.menu.weekSchedules ?? []}
                    shoppingList={menuBody.menu.shoppingList ?? []}
                    equivalencias={menuBody.menu.equivalencias ?? []}
                />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al descargar el plan:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return {isDownloading, handleDownload};
}

export function DownloadPlanButton({
    recommendations,
    planMenuUrl,
    fileName
}: DownloadPlanButtonProps) {
    const {isDownloading, handleDownload} = useDownloadPlan(recommendations, {
        planMenuUrl,
        fileName
    });

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
