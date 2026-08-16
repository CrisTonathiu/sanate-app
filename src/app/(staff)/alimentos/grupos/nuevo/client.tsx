'use client';

import {
    IngredientGroupForm,
    type IngredientGroupFormData
} from '@/components/widgets/food/IngredientGroupForm';
import {useInvalidateIngredientGroups} from '@/hooks/use-foods';
import {ArrowLeft} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';

export default function ClientPage() {
    const router = useRouter();
    const invalidateGroups = useInvalidateIngredientGroups();

    const handleSave = async (data: IngredientGroupFormData) => {
        const response = await fetch('/api/ingredient-groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok || result?.success === false) {
            throw new Error(result?.message || 'Error al crear el grupo');
        }

        invalidateGroups();
        router.push('/alimentos/grupos');
        router.refresh();
    };

    return (
        <div className='space-y-6'>
            <Link
                href='/alimentos/grupos'
                className='inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                <ArrowLeft className='h-4 w-4' />
                Volver a grupos
            </Link>

            <div>
                <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                    Crear grupo
                </h1>
                <p className='text-sm text-muted-foreground mt-1'>
                    Junta alimentos relacionados para excluirlos juntos, por
                    ejemplo todos los tipos de huevo
                </p>
            </div>

            <IngredientGroupForm
                onSave={handleSave}
                onCancel={() => router.push('/alimentos/grupos')}
            />
        </div>
    );
}
