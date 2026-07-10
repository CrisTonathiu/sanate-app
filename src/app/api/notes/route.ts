import {
    createPatientNote,
    listPatientNotes
} from '@/lib/services/patient/patient-note.service';

export async function GET() {
    try {
        const notes = await listPatientNotes();

        return Response.json(
            {
                success: true,
                message: 'Notas obtenidas correctamente',
                data: notes
            },
            {status: 200}
        );
    } catch (error) {
        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : 'Error desconocido'
            },
            {status: 500}
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const patientId = body?.patientId as string | undefined;

        if (!patientId) {
            return Response.json(
                {success: false, message: 'El paciente es requerido'},
                {status: 400}
            );
        }

        const note = await createPatientNote(patientId, {
            title: body.title,
            content: body.content,
            transcript: body.transcript,
            summary: body.summary
        });

        return Response.json(
            {
                success: true,
                message: 'Nota guardada correctamente',
                data: note
            },
            {status: 201}
        );
    } catch (error) {
        const status =
            error instanceof Error && error.message === 'Paciente no encontrado'
                ? 404
                : 400;

        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : 'Error desconocido'
            },
            {status}
        );
    }
}
