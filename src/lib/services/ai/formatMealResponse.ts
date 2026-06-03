import type {MealSliderRecipe} from '@/lib/patient-portal/protocol-meal-slider-map';

function formatIngredients(ingredients: MealSliderRecipe['ingredients']): string {
    if (ingredients.length === 0) {
        return 'Sin ingredientes registrados';
    }

    return ingredients
        .map(({name, amount, unit}) => `${name} ${amount} ${unit}`.trim())
        .join(', ');
}

export function formatMealResponse(data: MealSliderRecipe): string {
    return [
        `${data.mealTypeLabel}: ${data.name}`,
        `Calorías: ${data.calories}`,
        `Ingredientes: ${formatIngredients(data.ingredients)}`,
        `Horario: ${data.time}`
    ].join('\n');
}
