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
        .map(part => (part.type === 'text' ? part.text ?? '' : ''))
        .join('')
        .trim();
}

export async function analyzeMenuPhotoAgainstPlan(
    imageDataUrl: string,
    weekPlan: WeekDayMealPlan[]
): Promise<string> {
    const planText = formatWeekPlanForPrompt(weekPlan);
    const todayLabel =
        weekPlan.find(day => day.isToday)?.dayLabel ?? 'hoy';

    const completion = await openai.chat.completions.create({
        model: OPENAI_MENU_VISION_MODEL,
        messages: [
            {
                role: 'system',
                content: [
                    'Eres nutriólogo digital. Analizas fotos de menús de restaurante y las comparas con el plan semanal del paciente.',
                    'Responde SOLO en español, formato WhatsApp (máximo 18 líneas).',
                    'No inventes platos que no se lean claramente en la imagen.',
                    'Si la foto no es un menú legible, dilo y pide otra foto.',
                    'Para CADA plato visible del menú del restaurante, asigna UNA categoría con porcentaje de compatibilidad (0-100%):',
                    '• ✅ Compatible — XX%',
                    '• ⚠️ Con moderación — XX%',
                    '• ❌ No recomendado — XX%',
                    'El porcentaje refleja qué tan bien encaja con el plan (macros, ingredientes, horario).',
                    'Ordena: primero los más compatibles, luego moderación, luego no recomendados.',
                    'Prioriza el día de HOY y el slot de comida según la hora actual.',
                    'Si NINGÚN plato del menú es aceptable (todos <50% o todos ❌), dilo explícitamente al inicio:',
                    '"Ninguna opción del menú encaja bien con tu plan." Luego explica por qué y sugiere 1-2 adaptaciones si es posible (ej. sin crema, proteína a la plancha).'
                ].join(' ')
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: [
                            'Plan de alimentación SEMANAL del paciente:',
                            planText,
                            '',
                            `Hoy es ${todayLabel}.`,
                            '',
                            'Tareas:',
                            '1) Lee todos los platos/opciones visibles en la foto del menú.',
                            '2) Compara cada plato con TODO el plan semanal (ingredientes, kcal, tipo de comida).',
                            '3) Lista cada plato con su categoría y porcentaje (ej. "✅ Pollo a la plancha — 88%").',
                            '4) Si ninguno es aceptable, avísalo primero y explica alternativas fuera del menú si aplica.'
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
