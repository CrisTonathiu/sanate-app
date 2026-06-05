'use client';

import {
    FoodForm,
    type FoodFormData
} from '@/components/widgets/food/FoodForm';
import {useInvalidateFoods} from '@/hooks/use-foods';
import {ArrowLeft} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';

interface FoodApiResponse {
    success: boolean;
    message?: string;
    data?: {
        id: string;
        name: string;
        groupId: string;
        caloriesPer100g: number | null;
        proteinPer100g: number | null;
        carbsPer100g: number | null;
        fatPer100g: number | null;
        density: number | null;
        isDiscrete: boolean;
        maxPortionGrams: number | null;
    };
}

export default function ClientPage({foodId}: {foodId: string}) {
    const router = useRouter();
    const invalidateFoods = useInvalidateFoods();
    const [isLoading, setIsLoading] = useState(true);
    const [foodData, setFoodData] = useState<FoodFormData | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadFood() {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/foods/${foodId}`, {
                    credentials: 'include'
                });
                const body = (await response.json()) as FoodApiResponse;

                if (!response.ok || !body.success || !body.data) {
                    throw new Error(
                        body.message || 'No se pudo cargar el alimento.'
                    );
                }

                if (!isMounted) return;

                setFoodData({
                    name: body.data.name,
                    groupId: body.data.groupId,
                    caloriesPer100g: body.data.caloriesPer100g,
                    proteinPer100g: body.data.proteinPer100g,
                    carbsPer100g: body.data.carbsPer100g,
                    fatPer100g: body.data.fatPer100g,
                    density: body.data.density,
                    isDiscrete: body.data.isDiscrete,
                    maxPortionGrams: body.data.maxPortionGrams
                });
            } catch (error) {
                alert(
                    error instanceof Error
                        ? error.message
                        : 'Error inesperado al cargar el alimento.'
                );
                router.push('/alimentos');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadFood();

        return () => {
            isMounted = false;
        };
    }, [foodId, router]);

    const handleSave = async (data: FoodFormData) => {
        const response = await fetch(`/api/foods/${foodId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok || result?.success === false) {
            throw new Error(
                result?.message || 'No se pudo actualizar el alimento.'
            );
        }

        invalidateFoods();
        router.push('/alimentos');
        router.refresh();
    };

    const handleDelete = async () => {
        const response = await fetch(`/api/foods/${foodId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok || result?.success === false) {
            throw new Error(
                result?.message || 'No se pudo eliminar el alimento.'
            );
        }

        invalidateFoods();
        router.push('/alimentos');
        router.refresh();
    };

    return (
        <div className='space-y-6'>
            <Link
                href='/alimentos'
                className='inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                <ArrowLeft className='h-4 w-4' />
                Volver al catálogo
            </Link>

            <div>
                <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                    Editar alimento
                </h1>
                <p className='text-sm text-muted-foreground mt-1'>
                    Actualiza macros, densidad y grupo del alimento
                </p>
            </div>

            <FoodForm
                mode='edit'
                initialData={foodData}
                isLoading={isLoading}
                onSave={handleSave}
                onDelete={handleDelete}
                onCancel={() => router.push('/alimentos')}
            />
        </div>
    );
}
