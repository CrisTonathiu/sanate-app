'use client';

import {useQuery, useQueryClient} from '@tanstack/react-query';

export interface FoodGroup {
    id: string;
    name: string;
    isFree?: boolean;
}

export interface Food {
    id: string;
    name: string;
    groupId?: string;
    group?: FoodGroup | null;
    caloriesPer100g?: number | null;
    proteinPer100g?: number | null;
    carbsPer100g?: number | null;
    fatPer100g?: number | null;
    density?: number | null;
    isDiscrete?: boolean;
    maxPortionGrams?: number | null;
    createdAt?: string;
}

export const FOODS_QUERY_KEY = ['foods'] as const;
export const FOOD_GROUPS_QUERY_KEY = ['food-groups'] as const;

async function fetchFoods(): Promise<Food[]> {
    const res = await fetch('/api/foods', {credentials: 'include'});

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

async function fetchFoodGroups(): Promise<FoodGroup[]> {
    const res = await fetch('/api/food-groups', {credentials: 'include'});

    if (!res.ok) {
        throw new Error('Failed to fetch food groups');
    }

    const resData = await res.json();
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

export function useGetFoodGroups() {
    return useQuery({
        queryKey: FOOD_GROUPS_QUERY_KEY,
        queryFn: fetchFoodGroups,
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

export function useInvalidateFoods() {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({queryKey: FOODS_QUERY_KEY});
    };
}
