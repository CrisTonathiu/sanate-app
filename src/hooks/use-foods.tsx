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
    console.log('[foods] Fetching /api/foods...');
    const res = await fetch('/api/foods');
    console.log('[foods] Response status:', res.status);

    if (!res.ok) {
        throw new Error('Failed to fetch foods');
    }

    const resData = await res.json();
    console.log('[foods] Raw payload:', resData);

    if (Array.isArray(resData)) {
        console.log('[foods] Parsed list length:', resData.length);
        return resData;
    }

    const parsed = Array.isArray(resData?.data) ? resData.data : [];
    console.log('[foods] Parsed list length:', parsed.length);
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
