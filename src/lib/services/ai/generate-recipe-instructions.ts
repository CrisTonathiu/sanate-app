import {z} from 'zod';
import {MealType} from '@prisma/client';
import {openai} from '@/lib/config/openai';
import {prisma} from '@/lib/prisma';

const MAX_STEPS = 3;
const MIN_STEPS = 1;
const MAX_STEP_CHARS = 100;

const INSTRUCTIONS_MODEL =
    process.env.OPENAI_RECIPE_INSTRUCTIONS_MODEL?.trim() || 'gpt-4o-mini';

const mealTypeLabelEs: Record<MealType, string> = {
    SMOOTHIE: 'batido',
    BREAKFAST: 'desayuno',
    SNACK: 'colación',
    SNACK1: 'colación',
    SNACK2: 'colación',
    LUNCH: 'comida',
    DINNER: 'cena',
    DRINKS: 'bebida'
};

const mealTypeSchema = z.nativeEnum(MealType);

const aiInstructionsResponseSchema = z.object({
    recipes: z.array(
        z.object({
            id: z.string(),
            steps: z.array(z.string())
        })
    )
});

export const recipeInstructionsOverrideSchema = z.object({
    id: z.string().trim().min(1),
    title: z.string().trim().optional(),
    mealType: mealTypeSchema.optional(),
    /** Current meal ingredients (after add/remove in the planner). */
    ingredients: z.array(z.string().trim().min(1)).optional(),
    extraIngredients: z.array(z.string().trim().min(1)).optional()
});

export type RecipeInstructionsOverride = z.infer<
    typeof recipeInstructionsOverrideSchema
>;

export type RecipeInstructionsInput = {
    id: string;
    title: string;
    mealType: MealType;
    ingredients: string[];
    extraIngredients: string[];
};

function truncateStep(step: string): string {
    const trimmed = step.trim().replace(/\s+/g, ' ');
    if (trimmed.length <= MAX_STEP_CHARS) {
        return trimmed;
    }

    const sliced = trimmed.slice(0, MAX_STEP_CHARS);
    const lastSpace = sliced.lastIndexOf(' ');
    if (lastSpace >= 40) {
        return sliced.slice(0, lastSpace).trim();
    }

    return sliced.trim();
}

export function fallbackInstructionForMealType(mealType: MealType): string {
    const label = mealTypeLabelEs[mealType] ?? 'platillo';
    return truncateStep(`Disfruta tu ${label}`);
}

export function normalizeInstructionSteps(
    steps: string[] | undefined,
    mealType: MealType
): string[] {
    const cleaned = (steps ?? [])
        .map(truncateStep)
        .filter(Boolean)
        .slice(0, MAX_STEPS);

    if (cleaned.length >= MIN_STEPS) {
        return cleaned;
    }

    return [fallbackInstructionForMealType(mealType)];
}

function buildSystemPrompt() {
    return `Eres un nutricionista que escribe instrucciones de preparación muy breves en español para pacientes.

Reglas obligatorias:
- Responde SOLO JSON válido con la forma {"recipes":[{"id":"...","steps":["..."]}]}.
- Para cada receta incluye entre ${MIN_STEPS} y ${MAX_STEPS} pasos.
- Cada paso debe tener máximo ${MAX_STEP_CHARS} caracteres.
- Usa ÚNICAMENTE el título y la lista de ingredientes/extras proporcionada (es la versión actual del plato; puede diferir de la receta original).
- Menciona solo ingredientes que aparezcan en esa lista; no inventes ingredientes eliminados ni omitas los agregados.
- Sé concreto, claro y accionable; evita introducciones o consejos largos.
- Si no puedes inferir una preparación razonable, usa un único paso genérico: "Disfruta tu [tipo de comida]".
- No numeres los pasos dentro del texto; el arreglo ya implica el orden.`;
}

function buildUserPrompt(recipes: RecipeInstructionsInput[]) {
    return `Genera instrucciones para estas recetas:\n${JSON.stringify(
        recipes.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            mealType: recipe.mealType,
            mealTypeLabel: mealTypeLabelEs[recipe.mealType] ?? 'platillo',
            ingredients: recipe.ingredients,
            extraIngredients: recipe.extraIngredients
        }))
    )}`;
}

export async function generateRecipeInstructionsWithAI(
    recipes: RecipeInstructionsInput[]
): Promise<Record<string, string[]>> {
    const result: Record<string, string[]> = {};

    if (recipes.length === 0) {
        return result;
    }

    for (const recipe of recipes) {
        result[recipe.id] = [fallbackInstructionForMealType(recipe.mealType)];
    }

    const CHUNK_SIZE = 12;

    for (let offset = 0; offset < recipes.length; offset += CHUNK_SIZE) {
        const chunk = recipes.slice(offset, offset + CHUNK_SIZE);

        try {
            const completion = await openai.chat.completions.create({
                model: INSTRUCTIONS_MODEL,
                temperature: 0.3,
                response_format: {type: 'json_object'},
                messages: [
                    {role: 'system', content: buildSystemPrompt()},
                    {role: 'user', content: buildUserPrompt(chunk)}
                ]
            });

            const rawContent = completion.choices[0]?.message?.content?.trim();
            if (!rawContent) {
                continue;
            }

            const parsed = aiInstructionsResponseSchema.parse(
                JSON.parse(rawContent)
            );
            const byId = new Map(
                parsed.recipes.map(item => [item.id, item.steps] as const)
            );

            for (const recipe of chunk) {
                result[recipe.id] = normalizeInstructionSteps(
                    byId.get(recipe.id),
                    recipe.mealType
                );
            }
        } catch (error) {
            console.error(
                '[recipe-instructions.ai] Generation failed for chunk; using fallbacks',
                {error, offset, size: chunk.length}
            );
        }
    }

    return result;
}

function formatBaseIngredientName(ingredient: {
    quantity: number | null;
    unit: string | null;
    grams: number;
    ingredient: {name: string};
}): string {
    const name = ingredient.ingredient.name.trim();
    const unit = ingredient.unit?.trim();
    const quantity = ingredient.quantity;

    if (quantity != null && quantity > 0 && unit) {
        return `${quantity} ${unit.toLowerCase()} ${name}`;
    }

    if (ingredient.grams > 0) {
        return `${ingredient.grams} g ${name}`;
    }

    return name;
}

function dedupeIngredientLines(lines: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(trimmed);
    }

    return result;
}

/**
 * Generates Spanish instruction steps with OpenAI and overwrites RecipeStep rows.
 * Prefer client overrides (current planner portions) over DB recipe ingredients so
 * add/remove edits in the meal planner are reflected.
 */
export async function generateAndSaveRecipeInstructions(
    recipeIds: string[],
    overrides: RecipeInstructionsOverride[] = []
): Promise<Record<string, string[]>> {
    const uniqueIds = [
        ...new Set(recipeIds.map(id => id.trim()).filter(Boolean))
    ];

    if (uniqueIds.length === 0) {
        return {};
    }

    const overrideById = new Map(
        overrides
            .map(item => recipeInstructionsOverrideSchema.safeParse(item))
            .filter(result => result.success)
            .map(result => [result.data.id, result.data] as const)
    );

    const recipes = await prisma.recipe.findMany({
        where: {id: {in: uniqueIds}},
        select: {
            id: true,
            title: true,
            mealType: true,
            ingredients: {
                select: {
                    quantity: true,
                    unit: true,
                    grams: true,
                    ingredient: {select: {name: true}}
                }
            },
            extraIngredients: {
                select: {name: true}
            }
        }
    });

    const inputs: RecipeInstructionsInput[] = recipes.map(recipe => {
        const override = overrideById.get(recipe.id);
        const hasOverrideIngredients = override?.ingredients !== undefined;

        const ingredients = hasOverrideIngredients
            ? dedupeIngredientLines(override.ingredients ?? [])
            : recipe.ingredients.map(formatBaseIngredientName);

        // When the planner sent the current portion list, that list is the
        // source of truth (includes adds, excludes removals). Only fall back to
        // DB extras when no override ingredients were provided.
        const extraIngredients = hasOverrideIngredients
            ? dedupeIngredientLines(override?.extraIngredients ?? [])
            : recipe.extraIngredients
                  .map(item => item.name.trim())
                  .filter(Boolean);

        return {
            id: recipe.id,
            title: override?.title?.trim() || recipe.title,
            mealType: override?.mealType ?? recipe.mealType,
            ingredients,
            extraIngredients
        };
    });

    const generated = await generateRecipeInstructionsWithAI(inputs);

    const stepsByRecipeId: Record<string, string[]> = {};
    const stepsToCreate: Array<{
        recipeId: string;
        stepNumber: number;
        instruction: string;
    }> = [];

    for (const recipe of recipes) {
        const steps = generated[recipe.id] ?? [
            fallbackInstructionForMealType(recipe.mealType)
        ];
        stepsByRecipeId[recipe.id] = steps;
        stepsToCreate.push(
            ...steps.map((instruction, index) => ({
                recipeId: recipe.id,
                stepNumber: index + 1,
                instruction
            }))
        );
    }

    await prisma.$transaction([
        prisma.recipeStep.deleteMany({
            where: {recipeId: {in: recipes.map(recipe => recipe.id)}}
        }),
        ...(stepsToCreate.length > 0
            ? [prisma.recipeStep.createMany({data: stepsToCreate})]
            : [])
    ]);

    return stepsByRecipeId;
}
