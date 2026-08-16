import {requireRole} from '@/lib/auth/requireRole';
import {
    deleteIngredientGroup,
    getIngredientGroupById,
    updateIngredientGroup
} from '@/lib/services/food/ingredient-group.service';

export async function GET(
    _request: Request,
    {params}: {params: Promise<{groupId: string}>}
) {
    await requireRole('ADMIN');
    const {groupId} = await params;
    const result = await getIngredientGroupById(groupId);

    return Response.json(result, {
        status: result.success ? 200 : 400
    });
}

export async function PUT(
    request: Request,
    {params}: {params: Promise<{groupId: string}>}
) {
    await requireRole('ADMIN');
    const {groupId} = await params;
    const body = await request.json();
    const result = await updateIngredientGroup(groupId, body);

    return Response.json(result, {
        status: result.success ? 200 : 400
    });
}

export async function DELETE(
    _request: Request,
    {params}: {params: Promise<{groupId: string}>}
) {
    await requireRole('ADMIN');
    const {groupId} = await params;
    const result = await deleteIngredientGroup(groupId);

    return Response.json(result, {
        status: result.success ? 200 : 400
    });
}
