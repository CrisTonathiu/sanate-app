'use client';

import {useQuery, useQueryClient} from '@tanstack/react-query';

export interface Ingredient {
    id: string;
    name: string;
    description: string | null;
}

export const INGREDIENTS_QUERY_KEY = ['ingredients'] as const;

async function fetchIngredients(): Promise<Ingredient[]> {
    const res = await fetch('/api/ingredients');
    if (!res.ok) throw new Error('Failed to fetch ingredients');

    const resData = await res.json();
    if (Array.isArray(resData)) return resData;
    const parsed = Array.isArray(resData?.data) ? resData.data : [];
    return parsed;
}

export function useGetIngredients() {
    return useQuery({
        queryKey: INGREDIENTS_QUERY_KEY,
        queryFn: fetchIngredients,
        staleTime: 5 * 60 * 1000, // keep fresh for 5 min
        gcTime: 30 * 60 * 1000 // keep in cache for 30 min
    });
}

export function usePrefetchIngredients() {
    const queryClient = useQueryClient();

    return () =>
        queryClient.prefetchQuery({
            queryKey: INGREDIENTS_QUERY_KEY,
            queryFn: fetchIngredients,
            staleTime: 5 * 60 * 1000
        });
}
