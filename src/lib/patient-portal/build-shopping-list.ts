import type {IngredientUnit} from '@prisma/client';
import {
    INGREDIENT_UNIT_LABEL,
    mapRecipeRowsToMealPortions
} from '@/lib/services/protocol/protocol-meal-portions.mapper';
import {formatIngredientQuantity} from '@/lib/utils/ingredient-quantity';
import type {
    ShoppingCategory,
    ShoppingItem,
    WeeklyShoppingList
} from './shopping-list.types';

const CATEGORY_ORDER: ShoppingCategory[] = [
    'produce',
    'protein',
    'dairy',
    'grains',
    'other'
];

const PRODUCE_GROUPS = new Set([
    'VEGETALES',
    'FRUTAS',
    'FRUTOS ROJOS',
    'TUBERCULOS'
]);
const PROTEIN_GROUPS = new Set(['PROTEINAS', 'LEGUMINOSAS']);
const DAIRY_GROUPS = new Set(['LACTEOS']);
const GRAIN_GROUPS = new Set(['CEREALES', 'SEMILLAS', 'FRUTOS SECOS']);

type IngredientMeta = {
    foodId: string | null;
    foodGroupName: string | null;
    isDiscrete: boolean;
};

type PortionRow = {
    ingredientName: string;
    unit: IngredientUnit;
    targetQuantity: number;
    targetGrams: number;
};

type RecipeIngredientRow = {
    grams: number;
    quantity: number | null;
    unit: string | null;
    ingredient: {
        id: string;
        name: string;
        food: {
            id: string;
            isDiscrete: boolean | null;
            group: {name: string} | null;
        } | null;
    };
};

type ProtocolMealInput = {
    portions: {
        ingredients: PortionRow[];
    } | null;
    recipe: {
        extraIngredients: Array<{name: string}>;
        ingredients: RecipeIngredientRow[];
    } | null;
};

type ProtocolWeekInput = {
    weekNumber: number;
    days: Array<{
        meals: ProtocolMealInput[];
    }>;
};

type AggregatedBucket = {
    key: string;
    name: string;
    category: ShoppingCategory;
    isDiscrete: boolean;
    gramTotal: number;
    pieceTotal: number;
    quantityByUnit: Partial<Record<IngredientUnit, number>>;
};

function normalizeName(name: string) {
    return name.trim().toLowerCase();
}

export function mapFoodGroupToShoppingCategory(
    groupName: string | null | undefined
): ShoppingCategory {
    const normalized = groupName?.trim().toUpperCase() ?? '';

    if (PRODUCE_GROUPS.has(normalized)) {
        return 'produce';
    }
    if (PROTEIN_GROUPS.has(normalized)) {
        return 'protein';
    }
    if (DAIRY_GROUPS.has(normalized)) {
        return 'dairy';
    }
    if (GRAIN_GROUPS.has(normalized)) {
        return 'grains';
    }

    return 'other';
}

function resolveIngredientMeta(
    ingredientName: string,
    recipeIngredients: RecipeIngredientRow[]
): IngredientMeta {
    const match = recipeIngredients.find(
        row =>
            normalizeName(row.ingredient.name) === normalizeName(ingredientName)
    );

    return {
        foodId: match?.ingredient.food?.id ?? null,
        foodGroupName: match?.ingredient.food?.group?.name ?? null,
        isDiscrete: match?.ingredient.food?.isDiscrete ?? false
    };
}

function aggregationKey(ingredientName: string, meta: IngredientMeta) {
    return meta.foodId ?? normalizeName(ingredientName);
}

function getOrCreateBucket(
    buckets: Map<string, AggregatedBucket>,
    key: string,
    name: string,
    category: ShoppingCategory,
    isDiscrete: boolean
) {
    const existing = buckets.get(key);
    if (existing) {
        return existing;
    }

    const bucket: AggregatedBucket = {
        key,
        name,
        category,
        isDiscrete,
        gramTotal: 0,
        pieceTotal: 0,
        quantityByUnit: {}
    };
    buckets.set(key, bucket);
    return bucket;
}

function addPortionToBucket(bucket: AggregatedBucket, portion: PortionRow) {
    bucket.gramTotal += portion.targetGrams;

    if (portion.unit === 'PIECE') {
        bucket.pieceTotal += portion.targetQuantity;
        return;
    }

    if (portion.unit !== 'GRAM') {
        bucket.quantityByUnit[portion.unit] =
            (bucket.quantityByUnit[portion.unit] ?? 0) + portion.targetQuantity;
    }
}

function formatAggregatedQuantity(bucket: AggregatedBucket): string {
    if (bucket.isDiscrete && bucket.pieceTotal > 0) {
        const amount = formatIngredientQuantity(bucket.pieceTotal, 'PIECE', {
            isDiscrete: true
        });
        return `${amount} ${INGREDIENT_UNIT_LABEL.PIECE}`;
    }

    const volumeUnits: IngredientUnit[] = [
        'CUP',
        'TBSP',
        'TSP',
        'ML',
        'OZ'
    ];

    for (const unit of volumeUnits) {
        const quantity = bucket.quantityByUnit[unit];
        if (quantity && quantity > 0) {
            const amount = formatIngredientQuantity(quantity, unit);
            return `${amount} ${INGREDIENT_UNIT_LABEL[unit]}`;
        }
    }

    if (bucket.pieceTotal > 0) {
        const amount = formatIngredientQuantity(bucket.pieceTotal, 'PIECE');
        return `${amount} ${INGREDIENT_UNIT_LABEL.PIECE}`;
    }

    if (bucket.gramTotal > 0) {
        const amount = formatIngredientQuantity(bucket.gramTotal, 'GRAM');
        return `${amount} ${INGREDIENT_UNIT_LABEL.GRAM}`;
    }

    return '—';
}

function mealPortions(meal: ProtocolMealInput): PortionRow[] {
    if (meal.portions?.ingredients.length) {
        return meal.portions.ingredients;
    }

    if (!meal.recipe?.ingredients.length) {
        return [];
    }

    return mapRecipeRowsToMealPortions(
        meal.recipe.ingredients.map(row => ({
            grams: row.grams,
            quantity: row.quantity,
            unit: row.unit,
            ingredient: {
                name: row.ingredient.name,
                food: row.ingredient.food
                    ? {
                          caloriesPer100g: null,
                          proteinPer100g: null,
                          carbsPer100g: null,
                          fatPer100g: null,
                          isDiscrete: row.ingredient.food.isDiscrete,
                          density: null
                      }
                    : null
            }
        }))
    ).map(portion => ({
        ingredientName: portion.ingredientName,
        unit: portion.unit as IngredientUnit,
        targetQuantity: portion.targetQuantity ?? 0,
        targetGrams: portion.targetGrams
    }));
}

function aggregateWeekMeals(meals: ProtocolMealInput[]) {
    const buckets = new Map<string, AggregatedBucket>();
    const extraCounts = new Map<string, number>();

    for (const meal of meals) {
        const recipeIngredients = meal.recipe?.ingredients ?? [];
        const portions = mealPortions(meal);

        for (const portion of portions) {
            const meta = resolveIngredientMeta(
                portion.ingredientName,
                recipeIngredients
            );
            const key = aggregationKey(portion.ingredientName, meta);
            const bucket = getOrCreateBucket(
                buckets,
                key,
                portion.ingredientName.trim(),
                mapFoodGroupToShoppingCategory(meta.foodGroupName),
                meta.isDiscrete
            );

            addPortionToBucket(bucket, portion);
        }

        for (const extra of meal.recipe?.extraIngredients ?? []) {
            const name = extra.name.trim();
            if (!name) {
                continue;
            }

            const key = `extra:${normalizeName(name)}`;
            extraCounts.set(key, (extraCounts.get(key) ?? 0) + 1);
        }
    }

    const items: ShoppingItem[] = [];

    for (const bucket of buckets.values()) {
        if (bucket.gramTotal <= 0 && bucket.pieceTotal <= 0) {
            const hasVolume = Object.values(bucket.quantityByUnit).some(
                value => (value ?? 0) > 0
            );
            if (!hasVolume) {
                continue;
            }
        }

        items.push({
            id: bucket.key,
            name: bucket.name,
            quantity: formatAggregatedQuantity(bucket),
            category: bucket.category
        });
    }

    for (const [key, count] of extraCounts) {
        const normalizedExtraName = key.replace(/^extra:/, '');

        let label = normalizedExtraName;
        for (const meal of meals) {
            const match = meal.recipe?.extraIngredients.find(
                extra => normalizeName(extra.name) === normalizedExtraName
            );
            if (match) {
                label = match.name.trim();
                break;
            }
        }

        items.push({
            id: key,
            name: label,
            quantity: count === 1 ? '1 porción' : `${count} porciones`,
            category: 'other'
        });
    }

    items.sort((a, b) => {
        const categoryDiff =
            CATEGORY_ORDER.indexOf(a.category) -
            CATEGORY_ORDER.indexOf(b.category);
        if (categoryDiff !== 0) {
            return categoryDiff;
        }

        return a.name.localeCompare(b.name, 'es');
    });

    return items;
}

const MONTH_FORMATTER = new Intl.DateTimeFormat('es-MX', {month: 'short'});
const DAY_FORMATTER = new Intl.DateTimeFormat('es-MX', {day: 'numeric'});

function formatWeekDateRange(planStart: Date, weekNumber: number) {
    const weekStart = new Date(planStart);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startMonth = MONTH_FORMATTER.format(weekStart).replace('.', '');
    const endMonth = MONTH_FORMATTER.format(weekEnd).replace('.', '');
    const startDay = DAY_FORMATTER.format(weekStart);
    const endDay = DAY_FORMATTER.format(weekEnd);

    if (startMonth === endMonth) {
        return `${startDay} - ${endDay} ${startMonth}`;
    }

    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
}

export function buildWeeklyShoppingLists(input: {
    weeks: ProtocolWeekInput[];
    planStart: Date;
    activeProtocolWeekIndex: number;
}): WeeklyShoppingList[] {
    return input.weeks.map(week => {
        const meals = week.days.flatMap(day => day.meals);

        return {
            id: String(week.weekNumber),
            weekNumber: week.weekNumber,
            dateRange: formatWeekDateRange(input.planStart, week.weekNumber),
            items: aggregateWeekMeals(meals),
            isExpanded: week.weekNumber === input.activeProtocolWeekIndex + 1
        };
    });
}
