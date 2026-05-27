import {OPENAI_MENU_VISION_MODEL, openai} from '@/lib/config/openai';
import type {WeekDayMealPlan} from '@/lib/services/patient/patient-meal-by-type.service';
import type {MealSliderRecipe} from '@/lib/patient-portal/protocol-meal-slider-map';

function formatIngredients(
    ingredients: MealSliderRecipe['ingredients']
): string {
    if (ingredients.length === 0) {
        return 'sin ingredientes registrados';
    }

    return ingredients
        .map(({name, amount, unit}) => `${name} ${amount} ${unit}`.trim())
        .join(', ');
}

function formatMealLine(meal: MealSliderRecipe): string {
    return [
        `  • ${meal.time} | ${meal.name} (${meal.calories} kcal)`,
        `    Ingredientes: ${formatIngredients(meal.ingredients)}`
    ].join('\n');
}

function formatWeekPlanForPrompt(weekPlan: WeekDayMealPlan[]): string {
    return weekPlan
        .map(day => {
            const header = day.isToday
                ? `=== ${day.dayLabel} (HOY) ===`
                : `--- ${day.dayLabel} ---`;
            return [header, ...day.meals.map(formatMealLine)].join('\n');
        })
        .join('\n\n');
}

function extractCompletionText(
    content: string | Array<{type: string; text?: string}> | null | undefined
): string {
    if (!content) {
        return '';
    }

    if (typeof content === 'string') {
        return content.trim();
    }

    return content
        .map(part => (part.type === 'text' ? (part.text ?? '') : ''))
        .join('')
        .trim();
}

export async function analyzeMenuPhotoAgainstPlan(
    imageDataUrl: string,
    weekPlan: WeekDayMealPlan[]
): Promise<string> {
    const planText = formatWeekPlanForPrompt(weekPlan);
    console.log('weekPlan: ', weekPlan);

    const todayMeal = weekPlan.find(day => day.isToday)?.meals[0];
    const todayLabel = weekPlan.find(day => day.isToday)?.dayLabel ?? 'hoy';
    const todayMealCalories = todayMeal?.calories ?? 0;

    console.log('todayMeal: ', todayMeal);

    const completion = await openai.chat.completions.create({
        model: OPENAI_MENU_VISION_MODEL,
        messages: [
            {
                role: 'system',
                content: [
                    'Eres una nutrióloga funcional flexible, práctica y empática especializada en ayudar personas a comer en restaurantes sin culpa ni restricciones extremas.',
                    'Analiza una FOTO de menú de restaurante y recomienda de 2 a 5 opciones según las calorías objetivo del usuario, alimentos no deseados y objetivo nutricional.',
                    'Nunca prohíbas alimentos; adapta porciones e ingredientes para hacerlos funcionar. Prioriza proteína, vegetales, fibra y saciedad.',
                    'Traduce siempre las recomendaciones a cantidades reales y fáciles de pedir en restaurante como “3 tacos”, “media hamburguesa”, “1 rollo + edamames” o “2 slices de pizza”.',
                    'Incluye calorías aproximadas por alimento y total usando formatos como “50 kcal c/u” o “≈ 180 kcal”.',
                    'Ordena las opciones de mejor a peor según cercanía al objetivo calórico, proteína, saciedad y adherencia real.',
                    'Incluye siempre 2 opciones ideales, 1 flexible/antojo y una recomendación final clara.',
                    'Si el menú no tiene opciones saludables, adapta la mejor disponible reduciendo porciones o quitando extras.',
                    'Usa lenguaje humano, motivador y sin culpa. Nunca uses lenguaje alarmista o restrictivo.',
                    'Responde SOLO en español, estilo WhatsApp, máximo 18 líneas y 1400 caracteres.',
                    'Calorías objetivo del usuario: ' + todayMealCalories
                ].join(' ')
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: [
                            `Hoy es ${todayLabel}.`,
                            '',
                            'Eres una nutrióloga funcional flexible, práctica y empática especializada en ayudar personas a comer en restaurantes sin culpa ni restricciones extremas.',
                            'Analiza una FOTO de menú de restaurante y recomienda de 2 a 5 opciones según las calorías objetivo del usuario, alimentos no deseados y objetivo nutricional.',
                            'Nunca prohíbas alimentos; adapta porciones e ingredientes para hacerlos funcionar. Prioriza proteína, vegetales, fibra y saciedad.',
                            'Traduce siempre las recomendaciones a cantidades reales y fáciles de pedir en restaurante como “3 tacos”, “media hamburguesa”, “1 rollo + edamames” o “2 slices de pizza”.',
                            'Incluye calorías aproximadas por alimento y total usando formatos como “50 kcal c/u” o “≈ 180 kcal”.',
                            'Ordena las opciones de mejor a peor según cercanía al objetivo calórico, proteína, saciedad y adherencia real.',
                            'Incluye siempre 2 opciones ideales, 1 flexible/antojo y una recomendación final clara.',
                            'Si el menú no tiene opciones saludables, adapta la mejor disponible reduciendo porciones o quitando extras.',
                            'Usa lenguaje humano, motivador y sin culpa. Nunca uses lenguaje alarmista o restrictivo.',
                            'Responde SOLO en español, estilo WhatsApp, máximo 18 líneas y 1400 caracteres.',
                            `Calorías objetivo del usuario: ${todayMealCalories}`
                        ].join('\n')
                    },
                    {
                        type: 'image_url',
                        image_url: {url: imageDataUrl, detail: 'low'}
                    }
                ]
            }
        ]
    });

    const choice = completion.choices[0];
    const reply = extractCompletionText(choice?.message?.content);
    if (!reply) {
        throw new Error(
            `OpenAI returned empty menu analysis (finish_reason=${choice?.finish_reason ?? 'unknown'})`
        );
    }

    return reply;
}
