import {requireRole} from '@/lib/auth/requireRole';
import {getAllFoods} from '@/lib/services/food/food.service';

export async function GET(_request: Request) {
    await requireRole('ADMIN');
    const foods = await getAllFoods();

    return Response.json(foods, {
        status: foods.success ? 200 : 400
    });
}
