import {requireRole} from '@/lib/auth/requireRole';
import {getProtocolDetailForPatient} from '@/lib/services/protocol/protocol-week-plan.service';

export async function GET(
    _request: Request,
    {params}: {params: Promise<{patientId: string; protocolId: string}>}
) {
    await requireRole('ADMIN');
    const {patientId, protocolId} = await params;

    if (!patientId || !protocolId) {
        return Response.json(
            {success: false, message: 'Patient ID and Protocol ID are required'},
            {status: 400}
        );
    }

    try {
        const protocol = await getProtocolDetailForPatient(
            patientId,
            protocolId
        );

        if (!protocol) {
            return Response.json(
                {success: false, message: 'Protocolo no encontrado'},
                {status: 404}
            );
        }

        return Response.json(
            {
                success: true,
                message: 'Protocolo obtenido correctamente',
                data: protocol
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
