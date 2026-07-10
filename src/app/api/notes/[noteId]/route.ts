import {getPatientNote} from '@/lib/services/patient/patient-note.service';

export async function GET(
    _request: Request,
    {params}: {params: Promise<{noteId: string}>}
) {
    const {noteId} = await params;

    if (!noteId) {
        return Response.json(
            {success: false, message: 'ID de nota requerido'},
            {status: 400}
        );
    }

    try {
        const note = await getPatientNote(noteId);

        if (!note) {
            return Response.json(
                {success: false, message: 'Nota no encontrada'},
                {status: 404}
            );
        }

        return Response.json(
            {
                success: true,
                message: 'Nota obtenida correctamente',
                data: note
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
