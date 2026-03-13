'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

export interface ConsultationDTO {
    id: string;
    patientId: string;
    nutritionistId: string;
    reason: string | null;
    diagnosis: string | null;
    notes: string | null;
    followUpAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateConsultationPayload {
    patientId: string;
    reason?: string;
    diagnosis?: string;
    notes?: string;
    followUpAt?: string;
}

export function useGetPatientConsultations(patientId?: string) {
    return useQuery<ConsultationDTO[]>({
        queryKey: ['patientConsultations', patientId],
        enabled: !!patientId,
        queryFn: async () => {
            const res = await fetch(
                `/api/patients/${patientId}/consultations`,
                {
                    credentials: 'include'
                }
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(
                    error?.message || 'Failed to fetch patient consultations'
                );
            }

            const rawData = await res.json();
            return (rawData?.data ?? []) as ConsultationDTO[];
        },
        staleTime: 1000 * 60 * 5
    });
}

export function useCreateConsultation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateConsultationPayload) => {
            const res = await fetch('/api/consultations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData?.message ||
                        errorData?.error ||
                        'Failed to create consultation'
                );
            }

            const rawData = await res.json();
            return rawData?.data as ConsultationDTO;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['patientConsultations', variables.patientId]
            });
        }
    });
}
