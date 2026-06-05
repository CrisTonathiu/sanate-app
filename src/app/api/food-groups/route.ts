import {requireRole} from '@/lib/auth/requireRole';
import {getAllFoodGroups} from '@/lib/services/food/food.service';

export async function GET(_request: Request) {
    await requireRole('ADMIN');
    const groups = await getAllFoodGroups();

    return Response.json(groups, {
        status: groups.success ? 200 : 400
    });
}
