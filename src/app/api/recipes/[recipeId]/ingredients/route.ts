import {requireRole} from '@/lib/auth/requireRole';
import {addIngredientToRecipe} from '@/lib/services/recipe/recipe-ingredient.service';

export async function POST(
    _request: Request,
    {params}: {params: Promise<{recipeId: string}>}
) {
    await requireRole('ADMIN');
    const {recipeId} = await params;
    const body = await _request.json();
    const result = await addIngredientToRecipe({
        recipeId,
        ingredientId: body.ingredientId,
        grams: body.grams
    });
    return Response.json(result, {status: result.success ? 200 : 400});
}
