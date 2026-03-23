import {requireRole} from '@/lib/auth/requireRole';
import {
    getAllRecipes,
    createRecipe
} from '@/lib/services/recipe/recipe.service';

export async function GET(_request: Request) {
    await requireRole('ADMIN');
    const recipes = await getAllRecipes();
    return Response.json(recipes, {
        status: recipes.success ? 200 : 400
    });
}

export async function POST(request: Request) {
    await requireRole('ADMIN');
    const body = await request.json();
    console.log('Received recipe data:', body);
    const result = await createRecipe({
        title: body.title,
        imageUrl: body.imageUrl,
        mealType: body.mealType,
        ingredients: body.ingredients,
        extraIngredients: body.extraIngredients,
        steps: body.steps
    });
    return Response.json(result, {status: result.success ? 200 : 400});
}
