'use client';

import {
    FoodForm,
    type FoodFormData
} from '@/components/widgets/food/FoodForm';
import {useInvalidateFoods} from '@/hooks/use-foods';
import {ArrowLeft} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';

export default function ClientPage() {
    const router = useRouter();
    const invalidateFoods = useInvalidateFoods();

    const handleSave = async (data: FoodFormData) => {
        const response = await fetch('/api/foods', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok || result?.success === false) {
            throw new Error(result?.message || 'Error al crear el alimento');
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
                    Agregar alimento
                </h1>
                <p className='text-sm text-muted-foreground mt-1'>
                    Registra un alimento con sus macros por 100 g y densidad
                    opcional
                </p>
            </div>

            <FoodForm
                onSave={handleSave}
                onCancel={() => router.push('/alimentos')}
            />
        </div>
    );
}
