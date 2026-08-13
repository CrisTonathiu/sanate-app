export type PatientNoteStatus = 'DRAFT' | 'SAVED';

export interface PatientNoteDTO {
    id: string;
    patientId: string;
    title: string | null;
    content: string;
    transcript: string | null;
    summary: string | null;
    status: PatientNoteStatus;
    createdAt: string;
    updatedAt: string;
    patient?: {
        id: string;
        user: {
            firstName: string;
            lastName: string;
            email: string;
        };
    };
}

export interface CreatePatientNotePayload {
    title?: string;
    content: string;
    transcript?: string;
    summary?: string;
    status?: PatientNoteStatus;
}

export interface UpdatePatientNotePayload {
    title?: string;
    content?: string;
    transcript?: string;
    summary?: string;
    status?: PatientNoteStatus;
}

export interface TranscribeNoteResult {
    transcript: string;
    summary: string;
}
