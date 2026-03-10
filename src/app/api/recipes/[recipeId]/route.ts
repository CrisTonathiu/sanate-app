import {requireRole} from '@/lib/auth/requireRole';
import {
    getRecipeById,
    updateRecipe
} from '@/lib/services/recipe/recipe.service';

export async function GET(
    _request: Request,
    {params}: {params: Promise<{recipeId: string}>}
) {
    await requireRole('ADMIN');
    const {recipeId} = await params;
    const recipes = await getRecipeById(recipeId);
    return Response.json(recipes, {
        status: recipes.success ? 200 : 400
    });
}

export async function PUT(
    request: Request,
    {params}: {params: Promise<{recipeId: string}>}
) {
    await requireRole('ADMIN');
    const {recipeId} = await params;
    const body = await request.json();
    const result = await updateRecipe(recipeId, {
        title: body.title,
        description: body.description,
        instructions: body.instructions,
        mealType: body.mealType
    });
    return Response.json(result, {status: result.success ? 200 : 400});
}
