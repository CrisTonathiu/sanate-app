import {requireRole} from '@/lib/auth/requireRole';
import {
    generateAndSaveRecipeInstructions,
    recipeInstructionsOverrideSchema
} from '@/lib/services/ai/generate-recipe-instructions';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    await requireRole('ADMIN');

    try {
        const body = (await request.json()) as {
            recipeIds?: unknown;
            recipes?: unknown;
        };

        const recipeIds = Array.isArray(body.recipeIds)
            ? body.recipeIds.filter(
                  (id): id is string =>
                      typeof id === 'string' && id.trim().length > 0
              )
            : [];

        const overrides = Array.isArray(body.recipes)
            ? body.recipes.flatMap(item => {
                  const parsed = recipeInstructionsOverrideSchema.safeParse(item);
                  return parsed.success ? [parsed.data] : [];
              })
            : [];

        const ids =
            recipeIds.length > 0
                ? recipeIds
                : overrides.map(recipe => recipe.id);

        if (ids.length === 0) {
            return Response.json(
                {
                    success: false,
                    message: 'Se requiere al menos un recipeId'
                },
                {status: 400}
            );
        }

        const instructionsByRecipeId = await generateAndSaveRecipeInstructions(
            ids,
            overrides
        );

        return Response.json(
            {
                success: true,
                message: 'Instrucciones generadas correctamente',
                data: {instructionsByRecipeId}
            },
            {status: 200}
        );
    } catch (error) {
        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'Error al generar las instrucciones'
            },
            {status: 500}
        );
    }
}
