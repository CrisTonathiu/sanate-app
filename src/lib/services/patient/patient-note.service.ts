import type {
    CreatePatientNotePayload,
    PatientNoteDTO,
    PatientNoteStatus,
    UpdatePatientNotePayload
} from '@/lib/dto/PatientNoteDTO';
import {prisma} from '@/lib/prisma';
import {
    createPatientNoteSchema,
    updatePatientNoteSchema
} from '@/lib/validations/patient-note.schema';

const noteInclude = {
    patient: {
        select: {
            id: true,
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    }
} as const;

function toPatientNoteDTO(note: {
    id: string;
    patientId: string;
    title: string | null;
    content: string;
    transcript: string | null;
    summary: string | null;
    status: PatientNoteStatus;
    createdAt: Date;
    updatedAt: Date;
    patient?: {
        id: string;
        user: {
            firstName: string;
            lastName: string;
            email: string;
        };
    };
}): PatientNoteDTO {
    return {
        id: note.id,
        patientId: note.patientId,
        title: note.title,
        content: note.content,
        transcript: note.transcript,
        summary: note.summary,
        status: note.status,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        patient: note.patient
    };
}

export async function listPatientNotes(): Promise<PatientNoteDTO[]> {
    const notes = await prisma.patientNote.findMany({
        include: noteInclude,
        orderBy: {updatedAt: 'desc'}
    });

    return notes.map(toPatientNoteDTO);
}

export async function listNotesByPatient(
    patientId: string
): Promise<PatientNoteDTO[]> {
    const notes = await prisma.patientNote.findMany({
        where: {patientId},
        include: noteInclude,
        orderBy: {updatedAt: 'desc'}
    });

    return notes.map(toPatientNoteDTO);
}

export async function createPatientNote(
    patientId: string,
    payload: CreatePatientNotePayload
): Promise<PatientNoteDTO> {
    const parsed = createPatientNoteSchema.safeParse(payload);

    if (!parsed.success) {
        throw new Error(
            parsed.error.issues[0]?.message ?? 'Datos de nota inválidos'
        );
    }

    const patient = await prisma.patient.findUnique({
        where: {id: patientId}
    });

    if (!patient) {
        throw new Error('Paciente no encontrado');
    }

    const note = await prisma.patientNote.create({
        data: {
            patientId,
            title: parsed.data.title || null,
            content: parsed.data.content,
            transcript: parsed.data.transcript || null,
            summary: parsed.data.summary || null,
            status: parsed.data.status ?? 'SAVED'
        },
        include: noteInclude
    });

    return toPatientNoteDTO(note);
}

export async function updatePatientNote(
    noteId: string,
    payload: UpdatePatientNotePayload
): Promise<PatientNoteDTO> {
    const parsed = updatePatientNoteSchema.safeParse(payload);

    if (!parsed.success) {
        throw new Error(
            parsed.error.issues[0]?.message ?? 'Datos de nota inválidos'
        );
    }

    const existing = await prisma.patientNote.findUnique({
        where: {id: noteId}
    });

    if (!existing) {
        throw new Error('Nota no encontrada');
    }

    const note = await prisma.patientNote.update({
        where: {id: noteId},
        data: {
            ...(parsed.data.title !== undefined
                ? {title: parsed.data.title || null}
                : {}),
            ...(parsed.data.content !== undefined
                ? {content: parsed.data.content}
                : {}),
            ...(parsed.data.transcript !== undefined
                ? {transcript: parsed.data.transcript || null}
                : {}),
            ...(parsed.data.summary !== undefined
                ? {summary: parsed.data.summary || null}
                : {}),
            ...(parsed.data.status !== undefined
                ? {status: parsed.data.status}
                : {})
        },
        include: noteInclude
    });

    return toPatientNoteDTO(note);
}

export async function getPatientNote(
    noteId: string
): Promise<PatientNoteDTO | null> {
    const note = await prisma.patientNote.findUnique({
        where: {id: noteId},
        include: noteInclude
    });

    return note ? toPatientNoteDTO(note) : null;
}
