export interface PatientNoteDTO {
    id: string;
    patientId: string;
    title: string | null;
    content: string;
    transcript: string | null;
    summary: string | null;
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
}

export interface TranscribeNoteResult {
    transcript: string;
    summary: string;
}
