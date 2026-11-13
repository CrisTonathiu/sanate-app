import type {FoodSwapCategory} from '@prisma/client';

export type {FoodSwapCategory};

/** Admin dropdown order and labels, grouped by macro. */
export const FOOD_SWAP_CATEGORY_OPTIONS: Array<{
    value: FoodSwapCategory;
    label: string;
}> = [
    {value: 'PAN', label: 'Pan'},
    {value: 'TORTILLA', label: 'Tortilla y tostada'},
    {value: 'GRANO', label: 'Granos (arroz, quinoa)'},
    {value: 'PASTA', label: 'Pasta'},
    {value: 'CEREAL_DESAYUNO', label: 'Cereal de desayuno (avena, granola)'},
    {value: 'SNACK_CEREAL', label: 'Snack de cereal (alegría, palomitas)'},
    {value: 'TUBERCULO', label: 'Tubérculo (papa, camote)'},
    {value: 'LEGUMINOSA', label: 'Leguminosa'},
    {value: 'FRUTA', label: 'Fruta fresca'},
    {value: 'FRUTA_DESHIDRATADA', label: 'Fruta deshidratada'},
    {value: 'AVE', label: 'Pollo y pavo'},
    {value: 'CARNE_ROJA', label: 'Res y cerdo'},
    {value: 'PESCADO_MARISCO', label: 'Pescado y marisco'},
    {value: 'HUEVO', label: 'Huevo'},
    {value: 'QUESO', label: 'Queso'},
    {value: 'LACTEO', label: 'Leche y yogur'},
    {value: 'PROTEINA_VEGETAL', label: 'Proteína vegetal (tofu, soya)'},
    {value: 'ACEITE', label: 'Aceite y grasa para cocinar'},
    {value: 'AGUACATE', label: 'Aguacate'},
    {value: 'FRUTO_SECO', label: 'Fruto seco'},
    {value: 'SEMILLA', label: 'Semilla'}
];

export const FOOD_SWAP_CATEGORY_VALUES = FOOD_SWAP_CATEGORY_OPTIONS.map(
    option => option.value
) as [FoodSwapCategory, ...FoodSwapCategory[]];

export function normalizeFoodName(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

/** First matching rule wins, so specific names go before generic ones. */
const NAME_RULES: Array<[RegExp, FoodSwapCategory]> = [
    [/\b(alegria|barra|palomitas|galleta)/, 'SNACK_CEREAL'],
    [/\b(avena|granola|cereal|salvado)/, 'CEREAL_DESAYUNO'],
    [/\btortilla|\btostada/, 'TORTILLA'],
    [/\b(pan|bolillo|baguette|bagel|muffin)\b/, 'PAN'],
    [/\b(pasta|espagueti|spaghetti|fideo|macarron)/, 'PASTA'],
    [/\b(arroz|quinoa|amaranto|cuscus|couscous|elote|trigo|cebada|mijo)/, 'GRANO'],
    [/\b(papa|camote|yuca|malanga)\b/, 'TUBERCULO'],
    [/\b(frijol|lenteja|garbanzo|haba|edamame|chicharo|alubia)/, 'LEGUMINOSA'],
    [/\b(goji|pasa|datil|deshidratad|ciruela pasa|arandano seco)/, 'FRUTA_DESHIDRATADA'],
    [/\b(tofu|tempeh|soja|soya|seitan)/, 'PROTEINA_VEGETAL'],
    [/\b(pollo|pavo|pechuga|muslo)/, 'AVE'],
    [/\b(res|cerdo|bistec|lomo|filete de res|carne molida de res)/, 'CARNE_ROJA'],
    [/\b(atun|salmon|pescado|camaron|trucha|tilapia|huachinango|robalo|bacalao|sardina|marisco|pulpo|calamar)/, 'PESCADO_MARISCO'],
    [/\b(huevo|clara)/, 'HUEVO'],
    [/\b(queso|panela|requeson|cottage|ricotta|mozzarella)/, 'QUESO'],
    [/\b(leche|yogur|yoghurt|kefir|jocoque)/, 'LACTEO'],
    [/\baguacate\b/, 'AGUACATE'],
    [/\b(almendra|nuez|nueces|macadamia|avellana|pistache|cacahuate|anacardo|maranon)/, 'FRUTO_SECO'],
    [/\b(aceite|ghee|mantequilla|manteca)/, 'ACEITE'],
    [/\b(semilla|chia|linaza|ajonjoli|sesamo|hemp|canamo)/, 'SEMILLA']
];

/** Fallback by food group when no name rule matches. */
const GROUP_RULES: Record<string, FoodSwapCategory> = {
    FRUTAS: 'FRUTA',
    LEGUMINOSAS: 'LEGUMINOSA',
    TUBERCULOS: 'TUBERCULO',
    'FRUTOS SECOS': 'FRUTO_SECO',
    SEMILLAS: 'SEMILLA'
};

/**
 * Suggested swap category from the food's name and group. Only a starting
 * point for the backfill script; staff can change it in the admin.
 * Free groups (verduras, frutos rojos) get none: they are never swapped.
 */
export function suggestFoodSwapCategory(
    name: string,
    groupName: string
): FoodSwapCategory | null {
    const group = groupName.trim().toUpperCase();
    if (group === 'VEGETALES' || group === 'FRUTOS ROJOS') {
        return null;
    }

    const normalized = normalizeFoodName(name);
    for (const [pattern, category] of NAME_RULES) {
        if (pattern.test(normalized)) {
            return category;
        }
    }

    return GROUP_RULES[group] ?? null;
}
