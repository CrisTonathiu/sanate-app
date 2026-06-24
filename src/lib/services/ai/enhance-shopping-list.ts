import OpenAI from 'openai';
import {z} from 'zod';
import type {
    ShoppingCategory,
    ShoppingItem
} from '@/lib/patient-portal/shopping-list.types';

const SHOPPING_LIST_MODEL =
    process.env.OPENAI_SHOPPING_LIST_MODEL?.trim() || 'gpt-4o-mini';

const SHOPPING_CATEGORIES = [
    'produce',
    'protein',
    'dairy',
    'grains',
    'other'
] as const;

const enhancedShoppingItemSchema = z.object({
    name: z.string().min(1),
    quantity: z.string().min(1),
    category: z.enum(SHOPPING_CATEGORIES)
});

const enhancedShoppingListSchema = z.object({
    items: z.array(enhancedShoppingItemSchema)
});

export type EnhanceShoppingListContext = {
    weekNumber: number;
    dateRange: string;
};

/** Recipe notes / garnishes — not supermarket line items. */
const NON_PURCHASABLE_NAME_PATTERN =
    /(si deseas|al gusto|opcional|para servir|para acompañar|para tu\b|al vapor|adereza con|sazona(?:r)? con|mezcla de especias|al gusto de)/i;

/** Preparation-only labels with no standalone product. */
const PREPARATION_ONLY_PATTERN =
    /^(verduras?|vegetales?|prote[ií]na|guarnici[oó]n)\s+(al vapor|asadas?|cocidas?|salteadas?|a la plancha)/i;

function slugifyIngredientName(name: string) {
    return name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizeIngredientKey(name: string) {
    return name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(
            /\b(cocida?s?|cocido?s?|cruda?s?|crudo?s?|asada?s?|asado?s?|molida?s?|molido?s?|fileteada?s?|en trozos|rebanada?s?|picada?s?|fresca?s?|fresco?s?)\b/gi,
            ''
        )
        .replace(/\s+/g, ' ')
        .trim();
}

function isNonPurchasableRawItem(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
        return true;
    }

    if (NON_PURCHASABLE_NAME_PATTERN.test(trimmed)) {
        return true;
    }

    if (PREPARATION_ONLY_PATTERN.test(trimmed)) {
        return true;
    }

    return false;
}

function filterPurchasableRawItems(items: ShoppingItem[]) {
    return items.filter(item => !isNonPurchasableRawItem(item.name));
}

function dedupeEnhancedItems(items: ShoppingItem[]) {
    const byKey = new Map<string, ShoppingItem>();

    for (const item of items) {
        const key = normalizeIngredientKey(item.name);
        if (!byKey.has(key)) {
            byKey.set(key, item);
        }
    }

    return Array.from(byKey.values());
}

/** Round gram amounts to shopper-friendly steps (57 g → 60 g). */
function roundShoppingGrams(grams: number): number {
    if (!Number.isFinite(grams) || grams <= 0) {
        return grams;
    }

    if (grams < 1000) {
        return Math.max(10, Math.round(grams / 10) * 10);
    }

    return Math.round(grams / 50) * 50;
}

function formatRoundedWeight(grams: number): string {
    if (grams >= 1000) {
        const kg = grams / 1000;
        const rounded =
            Math.abs(kg - Math.round(kg)) < 0.05
                ? String(Math.round(kg))
                : kg.toFixed(1).replace(/\.0$/, '');
        return `${rounded} kg`;
    }

    return `${grams} g`;
}

function roundQuantityString(quantity: string): string {
    let result = quantity.replace(
        /(\d+(?:[.,]\d+)?)\s*(kg)\b/gi,
        (_match, numStr: string) => {
            const kg = Number.parseFloat(numStr.replace(',', '.'));
            const roundedGrams = roundShoppingGrams(kg * 1000);
            return formatRoundedWeight(roundedGrams);
        }
    );

    result = result.replace(
        /(\d+(?:[.,]\d+)?)\s*(g|gr|gramos?)\b/gi,
        (_match, numStr: string) => {
            const grams = Number.parseFloat(numStr.replace(',', '.'));
            return formatRoundedWeight(roundShoppingGrams(grams));
        }
    );

    return result;
}

/** Fruits/veg sold whole with highly variable weight — always one piece + ~kg. */
const VARIABLE_WEIGHT_PRODUCE: ReadonlyArray<{
    pattern: RegExp;
    defaultKg: number;
}> = [
    {pattern: /\bsand[ií]a\b/i, defaultKg: 5},
    {pattern: /\bpapaya\b/i, defaultKg: 1.2},
    {pattern: /\bmel[oó]n\b/i, defaultKg: 2},
    {pattern: /\bpi[nñ]a\b/i, defaultKg: 2},
    {pattern: /\bcalabaza\b/i, defaultKg: 3},
    {pattern: /\bcoco\b/i, defaultKg: 1.5},
    {pattern: /\btuna\b/i, defaultKg: 0.4},
    {pattern: /\bjackfruit|yaca\b/i, defaultKg: 8}
];

function isVariableWeightProduce(name: string) {
    return VARIABLE_WEIGHT_PRODUCE.some(entry => entry.pattern.test(name));
}

function parseTotalGramsFromQuantity(quantity: string): number | null {
    let totalGrams = 0;
    let found = false;

    for (const match of quantity.matchAll(/(\d+(?:[.,]\d+)?)\s*kg/gi)) {
        totalGrams += Number.parseFloat(match[1].replace(',', '.')) * 1000;
        found = true;
    }

    for (const match of quantity.matchAll(
        /(\d+(?:[.,]\d+)?)\s*(?:g|gr|gramos?)\b/gi
    )) {
        totalGrams += Number.parseFloat(match[1].replace(',', '.'));
        found = true;
    }

    return found ? totalGrams : null;
}

function parsePieceCountFromQuantity(quantity: string): number | null {
    const explicitPieces = quantity.match(
        /(\d+(?:[.,]\d+)?)\s*(?:piezas?|pzas?|pz)\b/i
    );
    if (explicitPieces) {
        return Number.parseFloat(explicitPieces[1].replace(',', '.'));
    }

    const leadingCount = quantity.match(
        /^(\d+(?:[.,]\d+)?)\s+(?:sand[ií]as?|papayas?|mel[oó]nes?|pi[nñ]as?|cocos?)/i
    );
    if (leadingCount) {
        return Number.parseFloat(leadingCount[1].replace(',', '.'));
    }

    if (/^1\s+p/i.test(quantity)) {
        return 1;
    }

    return null;
}

function parsePerPieceKgFromQuantity(quantity: string): number | null {
    const perPiece = quantity.match(
        /~\s*(\d+(?:[.,]\d+)?)\s*kg(?:\s*(?:c\/u|cada|por pieza|x pieza))?/i
    );
    if (perPiece) {
        return Number.parseFloat(perPiece[1].replace(',', '.'));
    }

    return null;
}

function roundProduceKg(kg: number): string {
    const rounded = kg < 1 ? Math.ceil(kg * 10) / 10 : Math.ceil(kg * 2) / 2;
    return rounded.toFixed(1).replace(/\.0$/, '');
}

function normalizeVariableWeightQuantity(name: string, quantity: string): string {
    const produce = VARIABLE_WEIGHT_PRODUCE.find(entry =>
        entry.pattern.test(name)
    );
    if (!produce) {
        return quantity;
    }

    const pieceCount = parsePieceCountFromQuantity(quantity);
    const perPieceKg = parsePerPieceKgFromQuantity(quantity);
    let totalGrams = parseTotalGramsFromQuantity(quantity);

    if (totalGrams == null && pieceCount != null) {
        const kgPerPiece = perPieceKg ?? produce.defaultKg;
        totalGrams = pieceCount * kgPerPiece * 1000;
    }

    if (totalGrams == null) {
        return quantity;
    }

    const totalKg = totalGrams / 1000;
    return `1 pieza (~${roundProduceKg(totalKg)} kg)`;
}

/** Recipe units that are not how products are sold in Mexican supermarkets. */
const COOKING_UNIT_PATTERN =
    /\b(porciones?|cda?s?|cdta?s?|cucharadas?|cucharaditas?|tazas?|tbsp|tsp)\b/i;

const PACKAGED_PRODUCT_FORMAT: ReadonlyArray<{
    pattern: RegExp;
    packageUnit: string;
}> = [
    {
        pattern:
            /leche (?:vegetal|de almendra|de avena|de coco|de soya|de arroz)/i,
        packageUnit: 'caja'
    },
    {pattern: /mayonesa/i, packageUnit: 'frasco'},
    {pattern: /ghee|mantequilla clarificada/i, packageUnit: 'frasco'},
    {pattern: /ketchup|catsup/i, packageUnit: 'frasco'},
    {pattern: /mostaza/i, packageUnit: 'frasco'},
    {pattern: /salsa inglesa|salsa de soya|salsa soya/i, packageUnit: 'frasco'},
    {pattern: /salsa (?:roja|verde|picante|para)/i, packageUnit: 'frasco'},
    {pattern: /vinagre/i, packageUnit: 'botella'},
    {pattern: /aceite de oliva/i, packageUnit: 'botella'},
    {pattern: /aceite de aguacate/i, packageUnit: 'botella'},
    {pattern: /aceite/i, packageUnit: 'botella'},
    {pattern: /miel/i, packageUnit: 'frasco'},
    {
        pattern: /mantequilla de (?:mani|cacahuate)|crema de cacahuate/i,
        packageUnit: 'frasco'
    },
    {pattern: /at[uú]n/i, packageUnit: 'lata'},
    {pattern: /sardina/i, packageUnit: 'lata'},
    {pattern: /chiles en (?:lata|vinagre)|chipotle en adobo/i, packageUnit: 'lata'},
    {pattern: /leche(?!.*(?:vegetal|almendra|avena|coco|soya))/i, packageUnit: 'brick'},
    {pattern: /yogur|yogurt/i, packageUnit: 'bolsa'},
    {pattern: /crema|media crema/i, packageUnit: 'brick'},
    {pattern: /queso crema/i, packageUnit: 'barra'},
    {pattern: /mantequilla/i, packageUnit: 'barra'},
    {pattern: /caldo (?:de )?(?:pollo|verduras|res)/i, packageUnit: 'caja'},
    {pattern: /consom[eé]/i, packageUnit: 'caja'},
    {pattern: /pur[eé] de tomate/i, packageUnit: 'lata'},
    {pattern: /pasta de tomate/i, packageUnit: 'lata'}
];

const PACKAGE_PLURALS: Record<string, string> = {
    caja: 'cajas',
    frasco: 'frascos',
    botella: 'botellas',
    lata: 'latas',
    bolsa: 'bolsas',
    brick: 'bricks',
    barra: 'barras',
    pieza: 'piezas'
};

function usesCookingUnits(quantity: string) {
    return (
        COOKING_UNIT_PATTERN.test(quantity) ||
        /\bporci[oó]n(es)?\b/i.test(quantity)
    );
}

function inferDefaultPackage(name: string): string | null {
    if (/leche/i.test(name)) {
        return 'caja';
    }
    if (/salsa|aderezo|condimento|vinagre|aceite|miel/i.test(name)) {
        return 'frasco';
    }
    if (/at[uú]n|sardina|chile.*lata/i.test(name)) {
        return 'lata';
    }

    return null;
}

function formatStorePackageCount(count: number, unit: string) {
    if (count <= 1) {
        return `1 ${unit}`;
    }

    const plural = PACKAGE_PLURALS[unit] ?? `${unit}s`;
    return `${count} ${plural}`;
}

function normalizePackagedProductQuantity(name: string, quantity: string) {
    if (!usesCookingUnits(quantity)) {
        return quantity;
    }

    const product = PACKAGED_PRODUCT_FORMAT.find(entry =>
        entry.pattern.test(name)
    );
    const packageUnit = product?.packageUnit ?? inferDefaultPackage(name);

    if (!packageUnit) {
        return quantity;
    }

    const leadingCount = quantity.match(/^(\d+(?:[.,]\d+)?)/);
    const numericCount = leadingCount
        ? Number.parseFloat(leadingCount[1].replace(',', '.'))
        : 1;

    // Weekly recipe amounts in cda/cdta/porción → one retail unit at the store.
    let packages = 1;
    if (packageUnit === 'caja' && numericCount > 4) {
        packages = 2;
    }

    return formatStorePackageCount(packages, packageUnit);
}

function polishShoppingItems(items: ShoppingItem[]): ShoppingItem[] {
    return items.map(item => {
        let quantity = roundQuantityString(item.quantity);

        if (isVariableWeightProduce(item.name)) {
            quantity = normalizeVariableWeightQuantity(item.name, quantity);
        }

        quantity = normalizePackagedProductQuantity(item.name, quantity);

        return {
            ...item,
            quantity
        };
    });
}

function createOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
        return null;
    }

    return new OpenAI({apiKey});
}

const SYSTEM_PROMPT = [
    'Eres un experto en listas de compras para supermercados en México.',
    'Tu trabajo es transformar ingredientes de recetas en una lista de súper clara, sin duplicados y sin texto de cocina.',
    'NUNCA uses unidades de receta (cda, cdta, taza, porción) en la salida; usa presentaciones reales del súper (frasco, caja, brick, bolsa, lata, botella).',
    'NUNCA incluyas instrucciones, guarniciones opcionales, métodos de cocción ni nombres de platos preparados.',
    'Cada ingrediente aparece UNA sola vez.',
    'Responde únicamente JSON válido según el esquema solicitado.'
].join(' ');

function buildPrompt(
    items: ShoppingItem[],
    context?: EnhanceShoppingListContext
) {
    const weekLabel = context
        ? `Semana ${context.weekNumber} (${context.dateRange})`
        : 'esta semana';

    const rawList = items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        category: item.category
    }));

    return [
        `Convierte esta lista cruda de un plan nutricional (${weekLabel}) en una lista de compras para el súper en México.`,
        '',
        'LISTA CRUDA (JSON):',
        JSON.stringify(rawList, null, 2),
        '',
        '## EXCLUIR (no incluir en la salida)',
        '- Instrucciones u opcionales: "si deseas", "al gusto", "opcional", "para tu aguacate".',
        '- Platos o preparaciones: "verduras al vapor", "adereza con limón y sal", "proteína asada".',
        '- Condimentos triviales sin cantidad útil (una pizca de sal ya cubierta en despensa).',
        '- Ítems que no se compran tal cual en el súper; descompón SOLO si puedes nombrar el producto crudo (ej. "limón" sí; "adereza con limón y sal" no).',
        '',
        '## FUSIONAR (un solo renglón por producto)',
        '- Mismo alimento, distinto nombre o preparación: "pechuga de pollo" + "pechuga de pollo cocida" → "Pechuga de pollo".',
        '- "Limón", "limones", "jugo de limón" (si es poco) → un solo "Limón" con cantidad total.',
        '- No repitas nunca el mismo producto base.',
        '',
        '## CANTIDADES Y UNIDADES',
        '- PROHIBIDO dejar unidades de cocina en la lista final: porción, porciones, cda, cdta, cucharada, taza (mal: "3 cda", "1 porción").',
        '- Convierte SIEMPRE a cómo se vende en el súper en México: frasco, caja, brick, bolsa, lata, botella, barra, kg, g, piezas.',
        '- Condimentos y salsas (mayonesa, ghee, mostaza, ketchup): aunque la receta use poco, compra "1 frasco".',
        '- Leche vegetal / de almendra / de avena / de coco: "1 caja" (Tetra Pak), nunca "porción".',
        '- Leche de vaca: brick o litros. Yogurt: bolsa o pieza. Atún/sardina: lata.',
        '- PROHIBIDO dejar frutas/verduras enteras en tazas, cda o cdta (mal: "Sandía 8 tazas", "Papaya 2 tazas").',
        '- Convierte tazas de fruta/verdura a peso total en kg antes de responder.',
        '- Proteínas frescas: g, kg o piezas/paquetes típicos en México.',
        '- Redondea hacia arriba a presentaciones reales; no reduzcas el total.',
        '- REDONDEO DE GRAMOS: usa cantidades "redondas". Menos de 1 kg → múltiplos de 10 g (57 g → 60 g, 123 g → 120 g). 1 kg o más → múltiplos de 50 g o kg enteros (1.2 kg, 1.5 kg). Nunca cantidades como 57 g, 83 g o 347 g.',
        '',
        '## PESO VARIABLE — UNA SOLA PIEZA (sandía, papaya, melón, piña, calabaza, coco)',
        '- Estos productos varían mucho de peso; NUNCA sugieras 2 o más piezas (mal: "2 sandías", "3 papayas", "2 piezas de melón").',
        '- Siempre UNA sola pieza con peso aproximado en kg según el total necesario de la semana.',
        '- Suma todo el consumo semanal y expresa: "1 pieza (~X kg)".',
        '- Ejemplo: 800 g de papaya en la semana → "1 pieza (~1 kg)", NO "2 papayas" ni "2 piezas".',
        '- Ejemplo: 2.5 kg de sandía en la semana → "1 pieza (~2.5 kg)", NO "2 sandías medianas".',
        '- Ejemplo: 600 g de melón → "1 pieza (~1 kg)".',
        '- Productos de peso más uniforme (limón, aguacate, jitomate, plátano, huevo) SÍ pueden usar piezas contables.',
        '',
        '## NOMBRES',
        '- Nombres cortos de producto de súper, capitalización normal (no TODO MAYÚSCULAS).',
        '- Sin adjetivos de cocción en el nombre final.',
        '',
        '## ORDEN',
        'produce → protein → dairy → grains → other',
        '',
        '## EJEMPLOS',
        'Entrada: "Sandía" 8 tazas → Salida: {"name":"Sandía","quantity":"1 pieza (~2 kg)","category":"produce"}',
        'Entrada: "Papaya" 2 tazas → Salida: {"name":"Papaya","quantity":"1 pieza (~0.5 kg)","category":"produce"}',
        'Entrada: "Sandía" 2 piezas → Salida: {"name":"Sandía","quantity":"1 pieza (~5 kg)","category":"produce"}',
        'Entrada: "Papaya" 3 piezas medianas → Salida: {"name":"Papaya","quantity":"1 pieza (~2 kg)","category":"produce"}',
        'Entrada: "Verduras al vapor" → NO incluir',
        'Entrada: "Limón si deseas para tu aguacate" → NO incluir',
        'Entrada: "ADEREZA CON LIMÓN Y SAL" → NO incluir',
        'Entrada: "Pechuga de pollo" 500 g + "Pechuga de pollo cocida" 300 g → Salida: una línea "Pechuga de pollo" "800 g"',
        'Entrada: "Yogurt griego" 57 g → Salida: "Yogurt griego" "60 g"',
        'Entrada: "Jitomate" 450 g → Salida: "Jitomate" "450 g"',
        'Entrada: "Leche vegetal" 1 porción → Salida: "Leche vegetal" "1 caja"',
        'Entrada: "Mayonesa" 3 cda → Salida: "Mayonesa" "1 frasco"',
        'Entrada: "Ghee" 1 cda → Salida: "Ghee" "1 frasco"',
        '',
        'Responde SOLO JSON: {"items":[{"name":"...","quantity":"...","category":"produce|protein|dairy|grains|other"}]}'
    ].join('\n');
}

function mapEnhancedItems(
    items: z.infer<typeof enhancedShoppingListSchema>['items']
) {
    return items.map((item, index) => ({
        id: slugifyIngredientName(item.name) || `item-${index + 1}`,
        name: item.name.trim(),
        quantity: item.quantity.trim(),
        category: item.category as ShoppingCategory
    }));
}

/**
 * Uses OpenAI to turn raw protocol ingredient totals into a practical
 * Mexico-focused shopping list with merged items.
 * Falls back to the input list when the API key is missing or the call fails.
 */
export async function enhanceShoppingListWithAI(
    items: ShoppingItem[],
    context?: EnhanceShoppingListContext
): Promise<ShoppingItem[]> {
    const purchasableItems = filterPurchasableRawItems(items);

    if (purchasableItems.length === 0) {
        return [];
    }

    const client = createOpenAIClient();
    if (!client) {
        console.warn(
            '[shopping-list.ai] OPENAI_API_KEY missing; using raw list'
        );
        return polishShoppingItems(purchasableItems);
    }

    try {
        const completion = await client.chat.completions.create({
            model: SHOPPING_LIST_MODEL,
            temperature: 0.1,
            response_format: {type: 'json_object'},
            messages: [
                {
                    role: 'system',
                    content: SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: buildPrompt(purchasableItems, context)
                }
            ]
        });

        const rawContent = completion.choices[0]?.message?.content?.trim();
        if (!rawContent) {
            throw new Error('OpenAI returned empty shopping list response');
        }

        const parsed = enhancedShoppingListSchema.parse(JSON.parse(rawContent));
        if (parsed.items.length === 0) {
            return polishShoppingItems(purchasableItems);
        }

        const mapped = mapEnhancedItems(parsed.items);
        return polishShoppingItems(dedupeEnhancedItems(mapped));
    } catch (error) {
        console.error('[shopping-list.ai] Enhancement failed; using raw list', {
            error
        });
        return polishShoppingItems(purchasableItems);
    }
}

export async function enhanceWeeklyShoppingListsWithAI<
    T extends {
        weekNumber: number;
        dateRange: string;
        items: ShoppingItem[];
    }
>(weeklyLists: T[]): Promise<T[]> {
    return Promise.all(
        weeklyLists.map(async week => ({
            ...week,
            items: await enhanceShoppingListWithAI(week.items, {
                weekNumber: week.weekNumber,
                dateRange: week.dateRange
            })
        }))
    );
}
