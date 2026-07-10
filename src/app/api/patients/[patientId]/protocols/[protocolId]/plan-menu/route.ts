import {requireRole} from '@/lib/auth/requireRole';
import {loadProtocolPlanMenuByProtocolId} from '@/lib/services/patient/patient-plan-menu.service';
import {prisma} from '@/lib/prisma';

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
        const protocol = await prisma.protocol.findFirst({
            where: {id: protocolId, patientId},
            select: {id: true}
        });

        if (!protocol) {
            return Response.json(
                {success: false, message: 'Protocolo no encontrado'},
                {status: 404}
            );
        }

        const menu = await loadProtocolPlanMenuByProtocolId(protocolId);

        return Response.json({success: true, menu}, {status: 200});
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
