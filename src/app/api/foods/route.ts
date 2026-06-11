import {requireRole} from '@/lib/auth/requireRole';
import {createFood, getAllFoods} from '@/lib/services/food/food.service';

export async function GET(_request: Request) {
    await requireRole('ADMIN');
    const foods = await getAllFoods();

    return Response.json(foods, {
        status: foods.success ? 200 : 400
    });
}

export async function POST(request: Request) {
    await requireRole('ADMIN');
    const body = await request.json();
    const result = await createFood(body);

    return Response.json(result, {
        status: result.success ? 200 : 400
    });
}
