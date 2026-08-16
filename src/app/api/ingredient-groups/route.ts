import {requireRole} from '@/lib/auth/requireRole';
import {
    createIngredientGroup,
    getAllIngredientGroups
} from '@/lib/services/food/ingredient-group.service';

export async function GET(_request: Request) {
    await requireRole('ADMIN');
    const groups = await getAllIngredientGroups();

    return Response.json(groups, {
        status: groups.success ? 200 : 400
    });
}

export async function POST(request: Request) {
    await requireRole('ADMIN');
    const body = await request.json();
    const result = await createIngredientGroup(body);

    return Response.json(result, {
        status: result.success ? 200 : 400
    });
}
