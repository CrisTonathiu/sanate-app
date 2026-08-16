'use client';

import {
    IngredientGroupForm,
    type IngredientGroupFormData
} from '@/components/widgets/food/IngredientGroupForm';
import {useInvalidateIngredientGroups} from '@/hooks/use-foods';
import {ArrowLeft} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';

interface IngredientGroupApiResponse {
    success: boolean;
    message?: string;
    data?: {
        id: string;
        name: string;
        color: string;
        items: Array<{
            foodId?: string;
            food?: {id: string; name: string};
        }>;
    };
}

export default function ClientPage({groupId}: {groupId: string}) {
    const router = useRouter();
    const invalidateGroups = useInvalidateIngredientGroups();
    const [isLoading, setIsLoading] = useState(true);
    const [groupData, setGroupData] = useState<IngredientGroupFormData | null>(
        null
    );

    useEffect(() => {
        let isMounted = true;

        async function loadGroup() {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `/api/ingredient-groups/${groupId}`,
                    {
                        credentials: 'include'
                    }
                );
                const body =
                    (await response.json()) as IngredientGroupApiResponse;

                if (!response.ok || !body.success || !body.data) {
                    throw new Error(
                        body.message || 'No se pudo cargar el grupo.'
                    );
                }

                if (!isMounted) return;

                setGroupData({
                    name: body.data.name,
                    color: body.data.color,
                    foodIds: body.data.items
                        .map(item => item.food?.id || item.foodId || '')
                        .filter(Boolean)
                });
            } catch (error) {
                alert(
                    error instanceof Error
                        ? error.message
                        : 'Error inesperado al cargar el grupo.'
                );
                router.push('/alimentos/grupos');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadGroup();

        return () => {
            isMounted = false;
        };
    }, [groupId, router]);

    const handleSave = async (data: IngredientGroupFormData) => {
        const response = await fetch(`/api/ingredient-groups/${groupId}`, {
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
                result?.message || 'No se pudo actualizar el grupo.'
            );
        }

        invalidateGroups();
        router.push('/alimentos/grupos');
        router.refresh();
    };

    const handleDelete = async () => {
        const response = await fetch(`/api/ingredient-groups/${groupId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok || result?.success === false) {
            throw new Error(result?.message || 'No se pudo eliminar el grupo.');
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
                    Editar grupo
                </h1>
                <p className='text-sm text-muted-foreground mt-1'>
                    Actualiza el nombre, color y alimentos del grupo
                </p>
            </div>

            <IngredientGroupForm
                mode='edit'
                initialData={groupData}
                isLoading={isLoading}
                onSave={handleSave}
                onDelete={handleDelete}
                onCancel={() => router.push('/alimentos/grupos')}
            />
        </div>
    );
}
