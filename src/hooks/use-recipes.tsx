'use client';

import {useQuery, useQueryClient} from '@tanstack/react-query';

export interface RecipeIngredient {
    id: string;
    grams?: number;
    ingredientId: string;
    ingredient?: {
        id: string;
        name: string;
        foodId?: string | null;
        food?: {
            id: string;
            name: string;
        } | null;
    };
}

export interface RecipeExtraIngredient {
    id: string;
    name: string;
}

export interface RecipeStep {
    id: string;
    stepNumber: number;
    instruction: string;
}

export interface Recipe {
    id: string;
    title: string;
    imageUrl: string | null;
    mealType:
        | 'SMOOTHIE'
        | 'BREAKFAST'
        | 'SNACK'
        | 'LUNCH'
        | 'DINNER'
        | 'DRINKS'
        | 'ANY';
    ingredients: RecipeIngredient[];
    extraIngredients: RecipeExtraIngredient[];
    steps: RecipeStep[];
    createdAt: string;
}

export const RECIPES_QUERY_KEY = ['recipes'] as const;

async function fetchRecipes(): Promise<Recipe[]> {
    const res = await fetch('/api/recipes', {
        credentials: 'include'
    });

    const payload = await res.json();

    if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Failed to fetch recipes');
    }

    if (Array.isArray(payload)) {
        return payload;
    }

    return Array.isArray(payload?.data) ? payload.data : [];
}

export function useGetRecipes() {
    return useQuery({
        queryKey: RECIPES_QUERY_KEY,
        queryFn: fetchRecipes,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000
    });
}

export function usePrefetchRecipes() {
    const queryClient = useQueryClient();

    return () =>
        queryClient.prefetchQuery({
            queryKey: RECIPES_QUERY_KEY,
            queryFn: fetchRecipes,
            staleTime: 5 * 60 * 1000
        });
}
