import {requireRole} from '@/lib/auth/requireRole';
import {
    getAllIngredients,
    createIngredient
} from '@/lib/services/ingredient/ingredient.service';

export async function GET(_request: Request) {
    const ingredients = await getAllIngredients();
    return Response.json(ingredients, {
        status: ingredients.success ? 200 : 400
    });
}

export async function POST(request: Request) {
    await requireRole('ADMIN');
    const body = await request.json();
    const result = await createIngredient({
        name: body.name,
        description: body.description
    });
    return Response.json(result, {status: result.success ? 200 : 400});
}
