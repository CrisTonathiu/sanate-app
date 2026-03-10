import {requireRole} from '@/lib/auth/requireRole';
import {
    getProtocolById,
    updateProtocol
} from '@/lib/services/protocol/protocol.service';

export async function GET(
    _request: Request,
    {params}: {params: Promise<{protocolId: string}>}
) {
    await requireRole('ADMIN');
    const {protocolId} = await params;
    if (!protocolId) {
        return Response.json(
            {success: false, message: 'Protocol ID is required'},
            {status: 400}
        );
    }
    const result = await getProtocolById(protocolId);
    if (!result.success) {
        return Response.json(
            {success: false, message: result.message, errors: result.errors},
            {status: 400}
        );
    }
    return Response.json(
        {success: true, protocol: result.protocol},
        {status: 200}
    );
}

export async function PUT(
    request: Request,
    {params}: {params: Promise<{protocolId: string}>}
) {
    await requireRole('ADMIN');
    const {protocolId} = await params;
    if (!protocolId) {
        return Response.json(
            {success: false, message: 'Protocol ID is required'},
            {status: 400}
        );
    }
    const body = await request.json();
    const result = await updateProtocol({protocolId, status: body.status});
    return Response.json(result, {status: result.success ? 200 : 400});
}
