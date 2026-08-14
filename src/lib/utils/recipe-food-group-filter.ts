export const CARBOHYDRATE_FOOD_GROUP = 'CARBOHIDRATOS';

type MacroTargetLike = {
    carbsKcal?: number | null;
    carbsPercentage?: number | null;
} | null;

type RecipeFoodGroupSource = {
    ingredients: Array<{
        foodGroupName?: string | null;
        ingredient?: {
            food?: {
                group?: {
                    name?: string | null;
                } | null;
            } | null;
        } | null;
    }>;
};

function isZeroMacro(value: number | null | undefined) {
    return typeof value === 'number' && value <= 0;
}

export function getExcludedFoodGroupsForMacroTarget(
    target?: MacroTargetLike
): Set<string> {
    const excluded = new Set<string>();

    if (!target) {
        return excluded;
    }

    if (isZeroMacro(target.carbsKcal) || isZeroMacro(target.carbsPercentage)) {
        excluded.add(CARBOHYDRATE_FOOD_GROUP);
    }

    return excluded;
}

export function collectRecipeFoodGroupNames(
    recipe: RecipeFoodGroupSource
): string[] {
    return recipe.ingredients.flatMap(item => {
        const name =
            item.foodGroupName ?? item.ingredient?.food?.group?.name ?? null;
        return name ? [name] : [];
    });
}

export function recipeHasExcludedFoodGroup(
    recipe: RecipeFoodGroupSource,
    excludedGroups: ReadonlySet<string>
): boolean {
    if (excludedGroups.size === 0) {
        return false;
    }

    return collectRecipeFoodGroupNames(recipe).some(name =>
        excludedGroups.has(name.trim().toUpperCase())
    );
}

export function filterRecipesByMacroFoodGroups<T extends RecipeFoodGroupSource>(
    recipes: T[],
    target?: MacroTargetLike
): T[] {
    const excludedGroups = getExcludedFoodGroupsForMacroTarget(target);
    if (excludedGroups.size === 0) {
        return recipes;
    }

    return recipes.filter(
        recipe => !recipeHasExcludedFoodGroup(recipe, excludedGroups)
    );
}
