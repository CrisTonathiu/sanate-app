import {requireRole} from '@/lib/auth/requireRole';
import {removeIngredientFromRecipe} from '@/lib/services/recipe/recipe-ingredient.service';

export async function DELETE(
    _request: Request,
    {params}: {params: Promise<{recipeId: string; ingredientId: string}>}
) {
    await requireRole('ADMIN');
    const {recipeId, ingredientId} = await params;
    const result = await removeIngredientFromRecipe(recipeId, ingredientId);
    return Response.json(result, {status: result.success ? 200 : 400});
}
