import {requireRole} from '@/lib/auth/requireRole';
import {
    deleteFood,
    getFoodById,
    updateFood
} from '@/lib/services/food/food.service';

export async function GET(
    _request: Request,
    {params}: {params: Promise<{foodId: string}>}
) {
    await requireRole('ADMIN');
    const {foodId} = await params;
    const result = await getFoodById(foodId);

    return Response.json(result, {
        status: result.success ? 200 : 400
    });
}

export async function PUT(
    request: Request,
    {params}: {params: Promise<{foodId: string}>}
) {
    await requireRole('ADMIN');
    const {foodId} = await params;
    const body = await request.json();
    const result = await updateFood(foodId, body);

    return Response.json(result, {
        status: result.success ? 200 : 400
    });
}

export async function DELETE(
    _request: Request,
    {params}: {params: Promise<{foodId: string}>}
) {
    await requireRole('ADMIN');
    const {foodId} = await params;
    const result = await deleteFood(foodId);

    return Response.json(result, {
        status: result.success ? 200 : 400
    });
}
