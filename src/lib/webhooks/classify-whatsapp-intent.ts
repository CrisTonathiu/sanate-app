import {MEAL_CONFIG, type MealType} from '@/lib/config/meal-config';
import {analyzeMenuPhotoAgainstPlan} from '@/lib/services/ai/analyzeMenuPhoto';
import {formatMealResponse} from '@/lib/services/ai/formatMealResponse';
import {
    getPatientTodayMealByType,
    loadWeekProtocolMeals,
    type PatientMealByTypeResult,
    type WeekDayMealPlan
} from '@/lib/services/patient/patient-meal-by-type.service';
import {getPatientCurrentTodayMeal} from '@/lib/services/patient/patient-today-meal.service';
import type {MealSliderRecipe} from '@/lib/patient-portal/protocol-meal-slider-map';
import type {
    ParsedWhatsAppMessage,
    WhatsAppWebhookMedia
} from '@/lib/webhooks/parse-whatsapp-webhook';
import {fetchWhatsAppImageAsDataUrl} from '@/lib/webhooks/resolve-whatsapp-media';

export const WHATSAPP_INTENTS = [
    'TODAY_MEALS',
    'MEAL_TYPE_MENU',
    'MEAL_MACROS',
    'SUBSTITUTION',
    'MENU_ANALYSIS',
    'HELP',
    'UNKNOWN'
] as const;

export type WhatsAppIntentType = (typeof WHATSAPP_INTENTS)[number];

export type ClassifiedWhatsAppIntent = {
    intent: WhatsAppIntentType;
    /** Resolved meal slot when intent is MEAL_MACROS or MEAL_TYPE_MENU. */
    meal: MealType | null;
    /** Loaded recipe when intent is TODAY_MEALS or MEAL_TYPE_MENU. */
    todayMeal: MealSliderRecipe | null;
    /** Weekly plan when intent is MENU_ANALYSIS. */
    weekPlan: WeekDayMealPlan[] | null;
    /** Set when MEAL_TYPE_MENU enrichment could not load a recipe. */
    mealLoadReason?: Extract<
        PatientMealByTypeResult,
        {success: false}
    >['reason'];
    text: string | null;
};

export type WhatsAppIntentReplyContext = {
    media: WhatsAppWebhookMedia | null;
};

const MEAL_ALIASES: {meal: MealType; patterns: RegExp[]}[] = [
    {
        meal: 'breakfast',
        patterns: [/\bbreakfast\b/, /\bdesayuno\b/, /\bdesayunar\b/]
    },
    {
        meal: 'lunch',
        patterns: [/\blunch\b/, /\bcomida\b/, /\balmorzar\b/]
    },
    {
        meal: 'dinner',
        patterns: [/\bdinner\b/, /\bcena\b/, /\bcenar\b/]
    },
    {
        meal: 'smoothie',
        patterns: [/\bsmoothie\b/, /\bbatido\b/, /\blicuado\b/]
    },
    {
        meal: 'snack2',
        patterns: [/\bsnack\s*2\b/, /\bcolacion\s*2\b/, /\bcolación\s*2\b/]
    },
    {
        meal: 'snack1',
        patterns: [
            /\bsnack\s*1\b/,
            /\bcolacion\s*1\b/,
            /\bcolación\s*1\b/,
            /\bcolacion\b(?!\s*2\b)/,
            /\bcolación\b(?!\s*2\b)/
        ]
    },
    {
        meal: 'drinks',
        patterns: [/\bdrinks?\b/, /\bbebidas?\b/]
    }
];

function normalizeText(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim();
}

/** Meal-slot verbs: comer = comida (lunch), not a generic “what to eat”. */
const MEAL_SLOT_VERB_PATTERNS: {pattern: RegExp; meal: MealType}[] = [
    {pattern: /\bdesayunar\b/, meal: 'breakfast'},
    {pattern: /\bcenar\b/, meal: 'dinner'},
    {pattern: /\balmorzar\b/, meal: 'lunch'},
    {
        pattern:
            /\b(que me toca|qué me toca|que me toma|qué me toma|que voy a|qué voy a)\b.*\bcomer\b/,
        meal: 'lunch'
    }
];

function detectMealSlotVerb(text: string): MealType | null {
    for (const {pattern, meal} of MEAL_SLOT_VERB_PATTERNS) {
        if (pattern.test(text)) {
            return meal;
        }
    }

    return null;
}

function isMealSlotVerbQuery(text: string): boolean {
    return MEAL_SLOT_VERB_PATTERNS.some(({pattern}) => pattern.test(text));
}

function detectMeal(text: string): MealType | null {
    const fromVerb = detectMealSlotVerb(text);
    if (fromVerb) {
        return fromVerb;
    }

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

/** Spanish/English phrases for “what should I eat now / today”. */
const TODAY_MEALS_PATTERNS: RegExp[] = [
    // ¿Qué como / debo comer?
    /\b(what do i eat|que como|qué como|que debo comer|qué debo comer)\b/,
    /\b(que como hoy|qué como hoy|what do i eat today)\b/,
    /\b(que debo|qué debo|que tengo|qué tengo)\s+que\s+comer\b/,
    /\b(que como|qué como)\s+(hoy|ahora|en este momento)\b/,
    /\bwhat\s+should\s+i\s+eat\b/,

    // ¿Qué me toca? (generic — not “me toca comer/cenar/desayunar”, those are MEAL_TYPE_MENU)
    /\b(que me toca|qué me toca)\b.*\bcomida\b/,
    /\b(que me corresponde|qué me corresponde)\s+comer\b/,
    /\b(que tengo|qué tengo)\s+que\s+comer\s+(hoy|ahora)\b/,

    // Mi comida / menú de hoy
    /\bmi\s+(comida|menu|menú|receta|plan)\s+(de\s+)?(hoy|del dia|del día|ahora)\b/,
    /\b(cual|cuál)\s+(es\s+)?(mi\s+)?(comida|menu|menú|receta|plan)\s+(de\s+)?(hoy|del dia|del día)\b/,
    /\b(cual|cuál)\s+es\s+mi\s+(comida|menu|menú|receta)\b/,
    /\b(menu|menú|plan)\s+(de\s+|del\s+)?(hoy|dia|día)\b/,
    /\b(menu|menú|plan)\b.*\b(hoy|today|del dia|del día)\b/,
    /\bplan\s+de\s+comidas\b.*\b(hoy|del dia|del día)\b/,
    /\bmenu\s+del\s+dia\b/,
    /\b(my\s+)?(today'?s?)\s+(menu|meal|food|plan)\b/,

    // Siguiente comida / menú
    /\b(siguiente|proxima|próxima)\s+(comida|menu|menú|receta)\b/,
    /\bmi\s+siguiente\s+(comida|menu|menú|receta)\b/,
    /\b(cual|cuál)\s+es\s+mi\s+siguiente\b/,
    /\b(que sigue|qué sigue)\b.*\b(menu|menú|comida|plan|receta)\b/,
    /\b(my\s+)?next\s+(meal|menu|food)\b/,

    // Comida actual / ahora
    /\b(comida|receta)\s+(actual|de ahora|ahora)\b/,
    /\b(que como|qué como)\s+ahora\b/,
    /\bque\s+hay\s+en\s+mi\s+(plan|menu|menú|protocolo)\b/,
    /\b(protocolo|plan)\b.*\b(hoy|comer|comida|ahora)\b/,

    // Hoy + comer
    /\b(hoy|today)\b.*\b(comer|como|eat|meals?|comida|receta)\b/,
    /\b(comer|como|comida|receta)\b.*\b(hoy|today)\b/,

    // Pedir ver el menú
    /\b(dame|muestrame|muéstrame|ensename|enséñame|ver)\b.*\b(mi\s+)?(menu|menú|comida|plan|receta)\b/,
    /\bshow\s+(me\s+)?(my\s+)?(today'?s?\s+)?(menu|meal|food)\b/
];

function isTodayMealsIntent(text: string): boolean {
    if (isMealSlotVerbQuery(text)) {
        return false;
    }

    return TODAY_MEALS_PATTERNS.some(pattern => pattern.test(text));
}

/** User asks for a specific meal slot (desayuno, cena, colación, etc.). */
const MEAL_TYPE_MENU_PATTERNS: RegExp[] = [
    /\b(que me toca|qué me toca|que me toma|qué me toma)\b.*\b(cenar|desayunar|almorzar|comer)\b/,
    /\b(que voy a|qué voy a)\s+(desayunar|cenar|almorzar|comer)\b/,
    /\btengo\s+(menu|menú|comida|receta|colacion)\b/,
    /\btengo\s+(menu|menú)\s+para\b/,
    /\b(menu|menú|receta|comida)\s+(para|de|del)\s+(la\s+)?/,
    /\b(que hay|qué hay)\s+para\s+(el\s+)?/,
    /\b(que|qué)\s+(es|hay)\s+(mi\s+)?(desayuno|cena|comida|colacion|batido|bebida|licuado)\b/,
    /\b(dame|muestrame|muéstrame|ensename|enséñame|ver)\b.*\b(desayuno|cena|comida|colacion|batido|bebida|licuado)\b/,
    /\b(what is|what's)\s+my\s+(breakfast|lunch|dinner|snack)\b/,
    /\bshow\s+my\s+(breakfast|lunch|dinner)\b/
];

function isMealTypeMenuIntent(text: string): boolean {
    const meal = detectMeal(text);
    if (!meal) {
        return false;
    }

    return MEAL_TYPE_MENU_PATTERNS.some(pattern => pattern.test(text));
}

export function classifyWhatsAppIntent(
    message: ParsedWhatsAppMessage
): ClassifiedWhatsAppIntent {
    const text =
        message.message?.trim() ?? message.media?.caption?.trim() ?? null;
    const normalized = text ? normalizeText(text) : '';

    if (isMenuAnalysis(message)) {
        return {
            intent: 'MENU_ANALYSIS',
            meal: null,
            todayMeal: null,
            weekPlan: null,
            text
        };
    }

    if (normalized && isHelpIntent(normalized)) {
        return {
            intent: 'HELP',
            meal: null,
            todayMeal: null,
            weekPlan: null,
            text
        };
    }

    if (normalized && isSubstitutionIntent(normalized)) {
        return {
            intent: 'SUBSTITUTION',
            meal: null,
            todayMeal: null,
            weekPlan: null,
            text
        };
    }

    if (normalized && isMealMacrosIntent(normalized)) {
        return {
            intent: 'MEAL_MACROS',
            meal: detectMeal(normalized),
            todayMeal: null,
            weekPlan: null,
            text
        };
    }

    if (normalized && isMealTypeMenuIntent(normalized)) {
        return {
            intent: 'MEAL_TYPE_MENU',
            meal: detectMeal(normalized),
            todayMeal: null,
            weekPlan: null,
            text
        };
    }

    if (normalized && isTodayMealsIntent(normalized)) {
        return {
            intent: 'TODAY_MEALS',
            meal: null,
            todayMeal: null,
            weekPlan: null,
            text
        };
    }

    return {
        intent: 'UNKNOWN',
        meal: null,
        todayMeal: null,
        weekPlan: null,
        text
    };
}

/** Loads patient meal data for intents that need it. */
export async function enrichClassifiedWhatsAppIntent(
    classified: ClassifiedWhatsAppIntent,
    userId: string
): Promise<ClassifiedWhatsAppIntent> {
    const normalized = classified.text ? normalizeText(classified.text) : '';

    if (classified.intent === 'TODAY_MEALS') {
        const result = await getPatientCurrentTodayMeal(userId);
        return {
            ...classified,
            todayMeal: result.success ? result.meal : null
        };
    }

    if (classified.intent === 'MEAL_TYPE_MENU' && classified.meal) {
        const result = await getPatientTodayMealByType(
            userId,
            classified.meal,
            normalized
        );

        if (result.success) {
            return {...classified, todayMeal: result.meal};
        }

        return {
            ...classified,
            todayMeal: null,
            mealLoadReason: result.reason
        };
    }

    if (classified.intent === 'MENU_ANALYSIS') {
        const {weekPlan} = await loadWeekProtocolMeals(userId);

        return {...classified, weekPlan};
    }

    return classified;
}

function mealLabel(meal: MealType): string {
    return MEAL_CONFIG.find(entry => entry.key === meal)?.label ?? meal;
}

function mealLabelForIntent(meal: MealType, normalized: string): string {
    const genericColacion =
        (meal === 'snack1' || meal === 'snack2') &&
        /\bcolacion\b/.test(normalized) &&
        !/\bcolacion\s*[12]\b/.test(normalized) &&
        !/\bsnack\s*[12]\b/.test(normalized);

    return genericColacion ? 'Colación' : mealLabel(meal);
}

export async function replyForWhatsAppIntent(
    classified: ClassifiedWhatsAppIntent,
    context: WhatsAppIntentReplyContext
): Promise<string> {
    switch (classified.intent) {
        case 'TODAY_MEALS': {
            const meal = classified.todayMeal;
            if (!meal) {
                return 'No encontré comidas en tu plan de hoy. Si acabas de recibir tu protocolo, pide a tu nutrióloga que lo active.';
            }

            return formatMealResponse(meal);
        }
        case 'MEAL_TYPE_MENU': {
            const requestedMeal = classified.meal;
            const normalized = classified.text
                ? normalizeText(classified.text)
                : '';

            if (!requestedMeal) {
                return 'No entendí qué comida quieres ver. Por ejemplo: "¿Qué me toca cenar?" o "¿Tengo menú para el desayuno?"';
            }

            if (!classified.todayMeal) {
                if (classified.mealLoadReason === 'meal_not_assigned') {
                    const label = mealLabelForIntent(requestedMeal, normalized);
                    return `No tienes asignado ${label} en tu menú.`;
                }

                return 'No encontré comidas en tu plan de hoy. Si acabas de recibir tu protocolo, pide a tu nutrióloga que lo active.';
            }

            return formatMealResponse(classified.todayMeal);
        }
        case 'MEAL_MACROS': {
            const meal = classified.meal
                ? mealLabel(classified.meal)
                : 'esa comida';
            return `Voy a calcular los macros de ${meal}.`;
        }
        case 'SUBSTITUTION':
            return 'Cuéntame qué alimento quieres cambiar y por cuál, y reviso si encaja en tu plan.';
        case 'MENU_ANALYSIS': {
            if (!context.media || context.media.type !== 'image') {
                return 'Envía una foto del menú del restaurante para revisar qué opciones encajan con tu plan de hoy.';
            }

            const weekPlan = classified.weekPlan ?? [];
            if (weekPlan.length === 0) {
                return 'No encontré comidas en tu plan semanal. Si acabas de recibir tu protocolo, pide a tu nutrióloga que lo active.';
            }

            try {
                const imageDataUrl = await fetchWhatsAppImageAsDataUrl(
                    context.media
                );
                return await analyzeMenuPhotoAgainstPlan(imageDataUrl, weekPlan);
            } catch (error) {
                console.error(
                    '[whatsapp] MENU_ANALYSIS failed',
                    error instanceof Error ? error.message : error
                );
                return 'No pude analizar la foto del menú. Intenta enviar una imagen más clara o vuelve a intentar en un momento.';
            }
        }
        case 'HELP':
            return [
                'Puedo ayudarte con:',
                '• Qué comer hoy',
                '• Menú de una comida (ej. "¿Qué me toca cenar?")',
                '• Macros de una comida (ej. desayuno)',
                '• Sustituciones de alimentos',
                '• Análisis de un menú (envía una foto)',
                '',
                'Escríbeme en lenguaje natural, por ejemplo: "¿Qué como hoy?", "¿Qué me toca cenar?" o "Macros del desayuno".'
            ].join('\n');
        case 'UNKNOWN':
            return 'No entendí tu mensaje. Escribe "ayuda" para ver qué puedo hacer por ti.';
    }
}
