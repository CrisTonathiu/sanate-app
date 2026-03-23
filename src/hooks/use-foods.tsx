'use client';

import {useQuery, useQueryClient} from '@tanstack/react-query';

export interface Food {
    id: string;
    name: string;
    caloriesPer100g?: number | null;
    proteinPer100g?: number | null;
    carbsPer100g?: number | null;
    fatPer100g?: number | null;
}

export const FOODS_QUERY_KEY = ['foods'] as const;

async function fetchFoods(): Promise<Food[]> {
    const res = await fetch('/api/foods');

    if (!res.ok) {
        throw new Error('Failed to fetch foods');
    }

    const resData = await res.json();

    if (Array.isArray(resData)) {
        return resData;
    }

    const parsed = Array.isArray(resData?.data) ? resData.data : [];
    return parsed;
}

export function useGetFoods() {
    return useQuery({
        queryKey: FOODS_QUERY_KEY,
        queryFn: fetchFoods,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000
    });
}

export function usePrefetchFoods() {
    const queryClient = useQueryClient();

    return () =>
        queryClient.prefetchQuery({
            queryKey: FOODS_QUERY_KEY,
            queryFn: fetchFoods,
            staleTime: 5 * 60 * 1000
        });
}
