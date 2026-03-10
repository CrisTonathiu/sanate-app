import {requireRole} from '@/lib/auth/requireRole';

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
    // Aquí podrías agregar lógica para obtener el protocolo por ID si es necesario
    return Response.json(
        {
            success: true,
            message: `Protocolo del paciente ${patientId} obtenido correctamente`
        },
        {status: 200}
    );
}
