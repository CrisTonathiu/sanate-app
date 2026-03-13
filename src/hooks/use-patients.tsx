'use client';

import {
    PatientAllergyDTO,
    PatientConditionDTO,
    PatientProfileDTO
} from '@/lib/dto/PatientDTO';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useRouter} from 'next/navigation';

// Gender translation helper
function translateGender(gender: string | null): string | null {
    if (!gender) return null;
    const translations: Record<string, string> = {
        MALE: 'MASCULINO',
        FEMALE: 'FEMENINO',
        OTHER: 'OTRO'
    };
    return translations[gender] || gender;
}

export function useGetPatients() {
    return useQuery<PatientProfileDTO[]>({
        queryKey: ['patients'],
        queryFn: async () => {
            const res = await fetch('/api/patients');
            if (!res.ok) {
                throw new Error('Failed to fetch patients');
            }

            const resData = await res.json();
            return (resData.data ?? []).map(
                (row: {
                    id: string;
                    birthDate: string | null;
                    gender: string | null;
                    height: number | null;
                    initWeight: number | null;
                    isActive: boolean;
                    lastLoginAt: string | null;
                    createdAt: string;
                    updatedAt: string;
                    user: {
                        id: string;
                        firstName: string;
                        lastName: string;
                        email: string;
                        phone: string | null;
                        whatsappNumber: string | null;
                        role: 'ADMIN' | 'NUTRITIONIST' | 'PATIENT';
                        createdAt: string;
                        updatedAt: string;
                    };
                }) => ({
                    ...row.user,
                    id: row.id,
                    birthDate: row.birthDate,
                    gender: translateGender(row.gender),
                    height: row.height,
                    initWeight: row.initWeight,
                    isActive: row.isActive,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    lastLoginAt: row.lastLoginAt
                })
            ) as PatientProfileDTO[];
        }
    });
}

export function useGetPatientProfile(patientId?: string) {
    return useQuery<PatientProfileDTO>({
        queryKey: ['patientProfile', patientId],
        enabled: !!patientId, // prevents running when undefined
        queryFn: async () => {
            const res = await fetch(`/api/patients/${patientId}`, {
                credentials: 'include'
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || 'Failed to fetch patient');
            }

            const rawData = await res.json();
            return rawData.data as PatientProfileDTO;
        },
        staleTime: 1000 * 60 * 5 // 5 minutes
    });
}

export function useGetPatientAllergies(patientId?: string) {
    return useQuery<PatientAllergyDTO[]>({
        queryKey: ['patientAllergies', patientId],
        enabled: !!patientId,
        queryFn: async () => {
            const res = await fetch(`/api/patients/${patientId}/allergies`, {
                credentials: 'include'
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(
                    error?.message || 'Failed to fetch patient allergies'
                );
            }

            const rawData = await res.json();
            const rows = rawData?.data ?? [];

            return rows.map(
                (row: {
                    allergenId?: string;
                    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';
                    notes?: string | null;
                    allergen?: {
                        id?: string;
                        name?: string;
                    };
                }) => ({
                    id: row.allergen?.id || row.allergenId,
                    allergen: row.allergen?.name || 'Sin nombre',
                    severity: row.severity,
                    notes: row.notes || undefined
                })
            ) as PatientAllergyDTO[];
        },
        staleTime: 1000 * 60 * 5
    });
}

export function useGetPatientConditions(patientId?: string) {
    return useQuery<PatientConditionDTO[]>({
        queryKey: ['patientConditions', patientId],
        enabled: !!patientId,
        queryFn: async () => {
            const res = await fetch(`/api/patients/${patientId}/conditions`, {
                credentials: 'include'
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(
                    error?.message || 'Failed to fetch patient conditions'
                );
            }

            const rawData = await res.json();
            const rows = rawData?.data ?? [];

            return rows.map(
                (row: {
                    conditionId?: string;
                    diagnosedAt?: string | null;
                    notes?: string | null;
                    condition?: {
                        id?: string;
                        name?: string;
                    };
                }) => ({
                    id: row.condition?.id || row.conditionId,
                    name: row.condition?.name || 'Sin nombre',
                    diagnosedAt: row.diagnosedAt || undefined,
                    notes: row.notes || undefined
                })
            ) as PatientConditionDTO[];
        },
        staleTime: 1000 * 60 * 5
    });
}

export function useCreatePatient() {
    const router = useRouter();
    return useMutation({
        mutationFn: async (data: {
            firstName: string;
            lastName: string;
            email: string;
            phone?: string;
            whatsappNumber?: string;
            birthDate?: string;
            height?: number;
            initWeight?: number;
            gender?: 'MALE' | 'FEMALE' | 'OTHER';
        }) => {
            const res = await fetch('/api/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.message || 'Failed to create patient'
                );
            }

            const resData = await res.json();
            const patientId = resData.data?.patient?.id;

            return {
                patientId,
                data: resData.data
            };
        },
        onSuccess: result => {
            if (result.patientId) {
                // Small delay to ensure dialog closes smoothly before redirect
                setTimeout(() => {
                    router.push(`/pacientes/${result.patientId}`);
                }, 100);
            }
        }
    });
}

export function useUpdatePatient(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<PatientProfileDTO>) => {
            const res = await fetch(`/api/patients/${patientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.message || 'Failed to update patient'
                );
            }

            const resData = await res.json();
            return resData.data as PatientProfileDTO;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['patientProfile', patientId]
            });
        }
    });
}

export function useDeletePatient() {
    const router = useRouter();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (patientId: string) => {
            const res = await fetch(`/api/patients/${patientId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.message || 'Failed to delete patient'
                );
            }

            return await res.json();
        },
        onSuccess: () => {
            // Invalidate patients list
            queryClient.invalidateQueries({
                queryKey: ['patients']
            });
            // Redirect to patients list
            router.push('/pacientes');
        }
    });
}
