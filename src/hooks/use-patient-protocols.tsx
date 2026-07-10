'use client';

import type {
    PatientProtocolDetail,
    PatientProtocolListItem
} from '@/lib/services/protocol/protocol-week-plan.service';
import {useQuery} from '@tanstack/react-query';

export function useGetPatientProtocols(patientId?: string) {
    return useQuery<PatientProtocolListItem[]>({
        queryKey: ['patientProtocols', patientId],
        enabled: !!patientId,
        queryFn: async () => {
            const res = await fetch(
                `/api/patients/${patientId}/protocols/history`,
                {credentials: 'include'}
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(
                    error?.message || 'No se pudieron cargar los protocolos'
                );
            }

            const rawData = await res.json();
            return (rawData?.data ?? []) as PatientProtocolListItem[];
        },
        staleTime: 1000 * 60 * 2
    });
}

export function useGetPatientProtocol(
    patientId?: string,
    protocolId?: string
) {
    return useQuery<PatientProtocolDetail>({
        queryKey: ['patientProtocol', patientId, protocolId],
        enabled: !!patientId && !!protocolId,
        queryFn: async () => {
            const res = await fetch(
                `/api/patients/${patientId}/protocols/${protocolId}`,
                {credentials: 'include'}
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(
                    error?.message || 'No se pudo cargar el protocolo'
                );
            }

            const rawData = await res.json();
            return rawData?.data as PatientProtocolDetail;
        }
    });
}
