import {requireRole} from '@/lib/auth/requireRole';
import {listNotesByPatient} from '@/lib/services/patient/patient-note.service';

export async function GET(
    _request: Request,
    {params}: {params: Promise<{patientId: string}>}
) {
    await requireRole('ADMIN');
    const {patientId} = await params;

    if (!patientId) {
        return Response.json(
            {success: false, message: 'Patient ID is required'},
            {status: 400}
        );
    }

    try {
        const notes = await listNotesByPatient(patientId);

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
