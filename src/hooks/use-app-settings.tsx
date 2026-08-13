'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

export type AppSettings = {
    id: string;
    mixMainMeals: boolean;
    updatedById: string | null;
    createdAt: string;
    updatedAt: string;
};

export const APP_SETTINGS_QUERY_KEY = ['app-settings'] as const;

async function fetchAppSettings(): Promise<AppSettings> {
    const res = await fetch('/api/settings', {credentials: 'include'});
    const payload = await res.json();

    if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || 'No se pudieron cargar los ajustes');
    }

    return payload.data as AppSettings;
}

export function useGetAppSettings() {
    return useQuery({
        queryKey: APP_SETTINGS_QUERY_KEY,
        queryFn: fetchAppSettings,
        staleTime: 60 * 1000
    });
}

export function useUpdateAppSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: {mixMainMeals: boolean}) => {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(input)
            });
            const payload = await res.json();

            if (!res.ok || payload?.success === false) {
                throw new Error(
                    payload?.message || 'No se pudieron guardar los ajustes'
                );
            }

            return payload.data as AppSettings;
        },
        onSuccess: data => {
            queryClient.setQueryData(APP_SETTINGS_QUERY_KEY, data);
        }
    });
}
