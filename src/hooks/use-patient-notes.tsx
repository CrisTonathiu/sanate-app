'use client';

import type {
    CreatePatientNotePayload,
    PatientNoteDTO,
    TranscribeNoteResult,
    UpdatePatientNotePayload
} from '@/lib/dto/PatientNoteDTO';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

export function useGetPatientNotesByPatient(patientId?: string) {
    return useQuery<PatientNoteDTO[]>({
        queryKey: ['patientNotes', patientId],
        enabled: !!patientId,
        queryFn: async () => {
            const res = await fetch(`/api/patients/${patientId}/notes`, {
                credentials: 'include'
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(
                    error?.message || 'No se pudieron cargar las notas del paciente'
                );
            }

            const rawData = await res.json();
            return (rawData?.data ?? []) as PatientNoteDTO[];
        },
        staleTime: 1000 * 60 * 2
    });
}

export function useGetPatientNotes() {
    return useQuery<PatientNoteDTO[]>({
        queryKey: ['patientNotes'],
        queryFn: async () => {
            const res = await fetch('/api/notes', {credentials: 'include'});

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || 'No se pudieron cargar las notas');
            }

            const rawData = await res.json();
            return (rawData?.data ?? []) as PatientNoteDTO[];
        },
        staleTime: 1000 * 60 * 2
    });
}

export function useGetPatientNote(noteId?: string) {
    return useQuery<PatientNoteDTO>({
        queryKey: ['patientNote', noteId],
        enabled: !!noteId,
        queryFn: async () => {
            const res = await fetch(`/api/notes/${noteId}`, {
                credentials: 'include'
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.message || 'No se pudo cargar la nota');
            }

            const rawData = await res.json();
            return rawData?.data as PatientNoteDTO;
        }
    });
}

export function useCreatePatientNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            patientId,
            ...payload
        }: CreatePatientNotePayload & {patientId: string}) => {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({patientId, ...payload})
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData?.message || 'No se pudo guardar la nota'
                );
            }

            const rawData = await res.json();
            return rawData?.data as PatientNoteDTO;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['patientNotes']});
        }
    });
}

export function useUpdatePatientNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            noteId,
            ...payload
        }: UpdatePatientNotePayload & {noteId: string}) => {
            const res = await fetch(`/api/notes/${noteId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData?.message || 'No se pudo actualizar la nota'
                );
            }

            const rawData = await res.json();
            return rawData?.data as PatientNoteDTO;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({queryKey: ['patientNotes']});
            queryClient.invalidateQueries({
                queryKey: ['patientNote', variables.noteId]
            });
        }
    });
}

export function useSummarizeTranscript() {
    return useMutation({
        mutationFn: async (transcript: string) => {
            const res = await fetch('/api/notes/summarize', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({transcript})
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData?.message || 'No se pudo generar el resumen'
                );
            }

            const rawData = await res.json();
            return rawData?.data?.summary as string;
        }
    });
}

export function useTranscribeNoteAudio() {
    return useMutation({
        mutationFn: async (audioBlob: Blob) => {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const res = await fetch('/api/notes/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData?.message || 'No se pudo procesar la grabación'
                );
            }

            const rawData = await res.json();
            return rawData?.data as TranscribeNoteResult;
        }
    });
}
