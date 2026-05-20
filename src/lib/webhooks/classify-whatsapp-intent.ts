import {MEAL_CONFIG, type MealType} from '@/lib/config/meal-config';
import {getPatientCurrentTodayMeal} from '@/lib/services/patient/patient-today-meal.service';
import type {MealSliderRecipe} from '@/lib/patient-portal/protocol-meal-slider-map';
import type {ParsedWhatsAppMessage} from '@/lib/webhooks/parse-whatsapp-webhook';

export const WHATSAPP_INTENTS = [
    'TODAY_MEALS',
    'MEAL_MACROS',
    'SUBSTITUTION',
    'MENU_ANALYSIS',
    'HELP',
    'UNKNOWN'
] as const;

export type WhatsAppIntentType = (typeof WHATSAPP_INTENTS)[number];

export type ClassifiedWhatsAppIntent = {
    intent: WhatsAppIntentType;
    /** Resolved meal when intent is MEAL_MACROS and text mentions one. */
    meal: MealType | null;
    /** Current scheduled meal (with image) when intent is TODAY_MEALS. */
    todayMeal: MealSliderRecipe | null;
    text: string | null;
};

const MEAL_ALIASES: {meal: MealType; patterns: RegExp[]}[] = [
    {
        meal: 'breakfast',
        patterns: [/\bbreakfast\b/, /\bdesayuno\b/]
    },
    {
        meal: 'lunch',
        patterns: [/\blunch\b/, /\bcomida\b/]
    },
    {
        meal: 'dinner',
        patterns: [/\bdinner\b/, /\bcena\b/]
    },
    {
        meal: 'smoothie',
        patterns: [/\bsmoothie\b/, /\bbatido\b/]
    },
    {
        meal: 'snack1',
        patterns: [/\bsnack\s*1\b/, /\bcolacion\s*1\b/, /\bcolación\s*1\b/]
    },
    {
        meal: 'snack2',
        patterns: [/\bsnack\s*2\b/, /\bcolacion\s*2\b/, /\bcolación\s*2\b/]
    },
    {
        meal: 'drinks',
        patterns: [/\bdrinks?\b/, /\bbebida\b/]
    }
];

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .trim();
}

function detectMeal(text: string): MealType | null {
    for (const {meal, patterns} of MEAL_ALIASES) {
        if (patterns.some(pattern => pattern.test(text))) {
            return meal;
        }
    }

    return null;
}

function isMenuAnalysis(message: ParsedWhatsAppMessage): boolean {
    return message.media?.type === 'image';
}

function isHelpIntent(text: string): boolean {
    return (
        /^(help|ayuda|menu|menú)\b/.test(text) ||
        /\b(what can you do|que puedes hacer|qué puedes hacer|como funciona|cómo funciona)\b/.test(
            text
        ) ||
        /\b(que puedes|qué puedes)\b/.test(text)
    );
}

function isSubstitutionIntent(text: string): boolean {
    return (
        /\b(swap|sustituir|sustituyo|intercambiar|reemplazar)\b/.test(text) ||
        /\b(puedo cambiar|can i (swap|change|replace))\b/.test(text) ||
        /\bcambiar\b.+\bpor\b/.test(text)
    );
}

function isMealMacrosIntent(text: string): boolean {
    return (
        /\b(macros?|macronutrientes?|calorias?|kcal|proteina|carbs?|carbohidratos?|grasas?|lipidos?)\b/.test(
            text
        ) ||
        /\b(cuantas calorias|cuántas calorías|how many calories)\b/.test(text)
    );
}

function isTodayMealsIntent(text: string): boolean {
    const mentionsToday = /\b(hoy|today)\b/.test(text);
    const asksWhatToEat =
        /\b(what do i eat|que como|qué como|que debo comer|qué debo comer)\b/.test(
            text
        ) ||
        /\b(que como hoy|qué como hoy|what do i eat today)\b/.test(text);
    const asksMenu =
        /\b(menu|menú|plan)\b/.test(text) &&
        /\b(hoy|today|del dia|del día)\b/.test(text);

    return asksWhatToEat || (mentionsToday && /\b(comer|como|eat|meals?)\b/.test(text)) || asksMenu;
}

export function classifyWhatsAppIntent(
    message: ParsedWhatsAppMessage
): ClassifiedWhatsAppIntent {
    const text = message.message?.trim() ?? message.media?.caption?.trim() ?? null;
    const normalized = text ? normalizeText(text) : '';

    if (isMenuAnalysis(message)) {
        return {intent: 'MENU_ANALYSIS', meal: null, todayMeal: null, text};
    }

    if (normalized && isHelpIntent(normalized)) {
        return {intent: 'HELP', meal: null, todayMeal: null, text};
    }

    if (normalized && isSubstitutionIntent(normalized)) {
        return {intent: 'SUBSTITUTION', meal: null, todayMeal: null, text};
    }

    if (normalized && isMealMacrosIntent(normalized)) {
        return {
            intent: 'MEAL_MACROS',
            meal: detectMeal(normalized),
            todayMeal: null,
            text
        };
    }

    if (normalized && isTodayMealsIntent(normalized)) {
        return {intent: 'TODAY_MEALS', meal: null, todayMeal: null, text};
    }

    return {intent: 'UNKNOWN', meal: null, todayMeal: null, text};
}

/** Loads patient meal data for intents that need it (e.g. TODAY_MEALS). */
export async function enrichClassifiedWhatsAppIntent(
    classified: ClassifiedWhatsAppIntent,
    userId: string
): Promise<ClassifiedWhatsAppIntent> {
    if (classified.intent !== 'TODAY_MEALS') {
        return classified;
    }

    const result = await getPatientCurrentTodayMeal(userId);

    return {
        ...classified,
        todayMeal: result.success ? result.meal : null
    };
}

function mealLabel(meal: MealType): string {
    return MEAL_CONFIG.find(entry => entry.key === meal)?.label ?? meal;
}

/** Placeholder replies until intent handlers are wired to patient data. */
export function replyForWhatsAppIntent(
    classified: ClassifiedWhatsAppIntent
): string {
    switch (classified.intent) {
        case 'TODAY_MEALS': {
            const meal = classified.todayMeal;
            if (!meal) {
                return 'No encontré comidas en tu plan de hoy. Si acabas de recibir tu protocolo, pide a tu nutrióloga que lo active.';
            }
            return `Tu comida ahora: *${meal.name}* — ${meal.calories} kcal (${meal.time}).`;
        }
        case 'MEAL_MACROS': {
            const meal = classified.meal
                ? mealLabel(classified.meal)
                : 'esa comida';
            return `Voy a calcular los macros de ${meal}.`;
        }
        case 'SUBSTITUTION':
            return 'Cuéntame qué alimento quieres cambiar y por cuál, y reviso si encaja en tu plan.';
        case 'MENU_ANALYSIS':
            return 'Recibí tu imagen. Voy a analizar el menú y te comparto un resumen.';
        case 'HELP':
            return [
                'Puedo ayudarte con:',
                '• Qué comer hoy',
                '• Macros de una comida (ej. desayuno)',
                '• Sustituciones de alimentos',
                '• Análisis de un menú (envía una foto)',
                '',
                'Escríbeme en lenguaje natural, por ejemplo: "¿Qué como hoy?" o "Macros del desayuno".'
            ].join('\n');
        case 'UNKNOWN':
            return 'No entendí tu mensaje. Escribe "ayuda" para ver qué puedo hacer por ti.';
    }
}
