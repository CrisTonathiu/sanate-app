import {requireRole} from '@/lib/auth/requireRole';
import {createProtocol} from '@/lib/services/protocol/protocol.service';

export async function POST(req: Request) {
    await requireRole('ADMIN');
    const body = await req.json();
    const result = await createProtocol(body);
    return Response.json(result, {status: result.success ? 200 : 400});
}
