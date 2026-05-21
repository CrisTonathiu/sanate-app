import {PROTOCOL_MEAL_LABELS, PROTOCOL_MEAL_TIMES} from '@/lib/config/protocol-meal-times';
import type {MealSliderRecipe} from '@/lib/patient-portal/protocol-meal-slider-map';

const SLIDER_MEAL_TYPE_LABEL: Record<MealSliderRecipe['mealType'], string> = {
    breakfast: 'Desayuno',
    lunch: 'Comida',
    dinner: 'Cena'
};

function mealTypeLabel(data: MealSliderRecipe): string {
    const protocolKey = Object.entries(PROTOCOL_MEAL_TIMES).find(
        ([, time]) => time === data.time
    )?.[0];

    if (protocolKey && PROTOCOL_MEAL_LABELS[protocolKey]) {
        return PROTOCOL_MEAL_LABELS[protocolKey];
    }

    return SLIDER_MEAL_TYPE_LABEL[data.mealType];
}

function formatIngredients(ingredients: MealSliderRecipe['ingredients']): string {
    if (ingredients.length === 0) {
        return 'Sin ingredientes registrados';
    }

    return ingredients
        .map(({name, amount, unit}) => `${name} ${amount} ${unit}`.trim())
        .join(', ');
}

export function formatMealResponse(data: MealSliderRecipe): string {
    const mealType = mealTypeLabel(data);

    return [
        `${mealType}: ${data.name}`,
        `Calorías: ${data.calories}`,
        `Ingredientes: ${formatIngredients(data.ingredients)}`,
        `Horario: ${data.time}`
    ].join('\n');
}
