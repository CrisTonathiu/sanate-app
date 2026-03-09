import {requireRole} from '@/lib/auth/requireRole';
import {
    getAllConditions,
    createCondition
} from '@/lib/services/condition/condition.service';

export async function GET(_request: Request) {
    await requireRole('ADMIN');
    const conditions = await getAllConditions();
    return Response.json(conditions, {status: conditions.success ? 200 : 400});
}

export async function POST(request: Request) {
    await requireRole('ADMIN');
    const body = await request.json();
    const result = await createCondition({
        name: body.name,
        description: body.description
    });
    return Response.json(result, {status: result.success ? 200 : 400});
}
