'use client';

import {Patient} from '@/lib/types/patient-type';
import {useMutation, useQuery} from '@tanstack/react-query';

export function useGetPatients() {
    return useQuery<Patient[]>({
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
                    weight: number | null;
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
                        lastLoginAt: string | null;
                        isActive: boolean;
                    };
                }) => ({
                    ...row.user,
                    patientId: row.id,
                    birthDate: row.birthDate,
                    gender: row.gender,
                    height: row.height,
                    weight: row.weight,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt
                })
            ) as Patient[];
        }
    });
}

export function useCreatePatient() {
    return useMutation({
        mutationFn: async (data: {
            firstName: string;
            lastName: string;
            email: string;
            phone?: string;
            whatsappNumber?: string;
            birthDate?: string;
            height?: number;
            weight?: number;
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
            return resData.data as {
                user: unknown;
                patient: unknown;
            };
        }
    });
}
