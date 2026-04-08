'use server';

import {MealType} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {
    GenerateProtocolPlanInput,
    ProtocolGoal
} from '@/lib/validations/protocol-generation.schema';
import {DayMeals, MealSlot} from '@/lib/interface/meal-interface';
import {ZodError} from 'zod';

type MealKey =
    | 'smoothie'
    | 'breakfast'
    | 'snack1'
    | 'snack2'
    | 'lunch'
    | 'dinner'
    | 'drinks';

type MacroPlan = {
    dailyCalories: number;
    weeklyCalories: number;
    proteinGramsPerDay: number;
    carbsGramsPerDay: number;
    fatGramsPerDay: number;
    proteinGramsPerWeek: number;
    carbsGramsPerWeek: number;
    fatGramsPerWeek: number;
};

type RecipeIngredientUnit =
    | 'GRAM'
    | 'PIECE'
    | 'CUP'
    | 'TBSP'
    | 'TSP'
    | 'ML'
    | 'OZ';

type RecipeSummary = {
    id: string;
    title: string;
    imageUrl?: string | null;
    mealType: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: Array<{
        name: string;
        quantity: number;
        grams: number;
        unit: RecipeIngredientUnit;
        caloriesPer100g: number;
        proteinPer100g: number;
        carbsPer100g: number;
        fatPer100g: number;
        isDiscrete: boolean;
        maxPortionGrams: number | null;
    }>;
};

type IngredientPortionAdjustment = {
    name: string;
    quantity: number;
    unit: RecipeIngredientUnit;
    grams: number;
};

const DAYS = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
] as const;

const MEAL_ORDER: MealKey[] = [
    'smoothie',
    'breakfast',
    'snack1',
    'snack2',
    'lunch',
    'dinner',
    'drinks'
];

function buildMealCalorieSplit(
    activeMealOrder: MealKey[],
    mealDistribution?: Record<string, number>
): Record<MealKey, number> {
    const split: Record<MealKey, number> = {
        smoothie: 0,
        breakfast: 0,
        snack1: 0,
        snack2: 0,
        lunch: 0,
        dinner: 0,
        drinks: 0
    };

    if (mealDistribution) {
        for (const [uiKey, pct] of Object.entries(mealDistribution)) {
            const key = uiKey as MealKey;
            if (key in split) {
                split[key] = pct / 100;
            }
        }
        return split;
    }

    const equalShare =
        activeMealOrder.length > 0 ? 1 / activeMealOrder.length : 0;
    for (const key of activeMealOrder) {
        split[key] = equalShare;
    }

    return split;
}

function getActiveMealOrder(input: GenerateProtocolPlanInput): MealKey[] {
    const enabledUiKeys = Object.entries(input.mealDistribution ?? {})
        .filter(([, pct]) => pct > 0)
        .map(([k]) => k);
    const serviceKeys = new Set<MealKey>();
    for (const k of enabledUiKeys) {
        if (MEAL_ORDER.includes(k as MealKey)) serviceKeys.add(k as MealKey);
    }
    return MEAL_ORDER.filter(k => serviceKeys.has(k));
}

function mapMealKeyToEnum(mealKey: MealKey): MealType {
    const map: Record<MealKey, MealType> = {
        smoothie: 'SMOOTHIE',
        breakfast: 'BREAKFAST',
        snack1: 'SNACK1',
        snack2: 'SNACK2',
        lunch: 'LUNCH',
        dinner: 'DINNER',
        drinks: 'DRINKS'
    };

    return map[mealKey];
}

function getDefaultMacroPercent(goal: ProtocolGoal) {
    switch (goal) {
        case 'perdida_peso':
            return {protein: 35, carbs: 35, fat: 30};
        case 'ganancia_musculo':
            return {protein: 30, carbs: 45, fat: 25};
        case 'control_diabetes':
            return {protein: 30, carbs: 35, fat: 35};
        case 'antiinflamatorio':
            return {protein: 30, carbs: 35, fat: 35};
        default:
            return {protein: 30, carbs: 40, fat: 30};
    }
}

function getDefaultCalories(goal: ProtocolGoal): number {
    switch (goal) {
        case 'perdida_peso':
            return 1700;
        case 'ganancia_musculo':
            return 2400;
        case 'control_diabetes':
            return 1900;
        case 'antiinflamatorio':
            return 2000;
        default:
            return 2000;
    }
}

function normalizeAllergenName(value: string) {
    return value.trim().toLowerCase();
}

function round1(value: number) {
    return Number(value.toFixed(1));
}

function normalizeRecipeIngredientUnit(
    unit?: RecipeIngredientUnit | string | null
): RecipeIngredientUnit {
    const normalized = unit?.toString().trim().toUpperCase();
    if (normalized === 'GRAM') return 'GRAM';
    if (normalized === 'PIECE') return 'PIECE';
    if (normalized === 'CUP') return 'CUP';
    if (normalized === 'TBSP') return 'TBSP';
    if (normalized === 'TSP') return 'TSP';
    if (normalized === 'ML') return 'ML';
    if (normalized === 'OZ') return 'OZ';
    return 'GRAM';
}

function scaleQuantityByUnit(
    quantity: number,
    scale: number,
    unit: RecipeIngredientUnit
) {
    const scaled = quantity * scale;

    // Piece-like portions should remain user-friendly integers.
    if (unit === 'PIECE') {
        return Math.max(1, Math.round(scaled));
    }

    return round1(scaled);
}

function computeNutritionFromSummaryIngredients(
    ingredients: RecipeSummary['ingredients']
) {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const item of ingredients) {
        const ratio = item.grams / 100;
        calories += item.caloriesPer100g * ratio;
        protein += item.proteinPer100g * ratio;
        carbs += item.carbsPer100g * ratio;
        fat += item.fatPer100g * ratio;
    }

    return {
        calories: Math.round(calories),
        protein: round1(protein),
        carbs: round1(carbs),
        fat: round1(fat)
    };
}

function applyIngredientAdjustments(
    ingredients: RecipeSummary['ingredients'],
    adjustments?: IngredientPortionAdjustment[]
) {
    if (!adjustments || adjustments.length === 0) {
        return ingredients;
    }

    const adjustmentsByName = new Map(
        adjustments.map(item => [
            normalizeAllergenName(item.name),
            {
                quantity: item.quantity,
                unit: normalizeRecipeIngredientUnit(item.unit),
                grams: item.grams
            }
        ])
    );

    return ingredients.map(item => {
        const matched = adjustmentsByName.get(normalizeAllergenName(item.name));

        if (!matched) return item;

        return {
            ...item,
            quantity: matched.quantity,
            unit: matched.unit,
            grams: matched.grams
        };
    });
}

function computeRecipeNutrition(recipe: {
    title: string;
    ingredients: Array<{
        quantity?: number | null;
        unit?: RecipeIngredientUnit | null;
        grams: number;
        ingredient: {
            name: string;
            food: {
                caloriesPer100g: number | null;
                proteinPer100g: number | null;
                carbsPer100g: number | null;
                fatPer100g: number | null;
            } | null;
        };
    }>;
}) {
    console.log(
        '[computeRecipeNutrition] Calculando nutrición para receta',
        recipe.title
    );
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const item of recipe.ingredients) {
        const unit = normalizeRecipeIngredientUnit(item.unit);
        const quantity =
            typeof item.quantity === 'number' && item.quantity > 0
                ? item.quantity
                : unit === 'GRAM'
                  ? item.grams
                  : 1;

        const gramsForNutrition =
            typeof item.grams === 'number' && item.grams > 0
                ? item.grams
                : unit === 'GRAM'
                  ? quantity
                  : 100;

        console.log(
            'Procesando ingrediente:',
            item.ingredient.name,
            'Unidad:',
            unit,
            'Cantidad:',
            quantity,
            'Gramos:',
            gramsForNutrition
        );
        const ratio = gramsForNutrition / 100;
        const food = item.ingredient.food;

        if (!food) continue;

        protein += (food.proteinPer100g ?? 0) * ratio;
        carbs += (food.carbsPer100g ?? 0) * ratio;
        fat += (food.fatPer100g ?? 0) * ratio;

        const hasCalories = typeof food.caloriesPer100g === 'number';
        calories += hasCalories
            ? (food.caloriesPer100g ?? 0) * ratio
            : ((food.proteinPer100g ?? 0) * 4 +
                  (food.carbsPer100g ?? 0) * 4 +
                  (food.fatPer100g ?? 0) * 9) *
              ratio;
    }

    console.log(
        '[computeRecipeNutrition] Resultado para receta',
        recipe.title,
        {calories, protein, carbs, fat}
    );

    return {
        calories: Math.round(calories),
        protein: Number(protein.toFixed(1)),
        carbs: Number(carbs.toFixed(1)),
        fat: Number(fat.toFixed(1))
    };
}

function isRecipeAllowed(
    recipe: {
        ingredients: Array<{ingredient: {name: string}}>;
        extraIngredients: Array<{name: string}>;
    },
    patientAllergies: Set<string>
) {
    console.log('Paciente tiene alergias:', Array.from(patientAllergies));
    if (patientAllergies.size === 0) return true;

    const ingredientNames = recipe.ingredients.map(item =>
        normalizeAllergenName(item.ingredient.name)
    );
    const extraIngredientNames = recipe.extraIngredients.map(item =>
        normalizeAllergenName(item.name)
    );

    for (const allergy of patientAllergies) {
        if (
            ingredientNames.some(
                name => name.includes(allergy) || allergy.includes(name)
            ) ||
            extraIngredientNames.some(
                name => name.includes(allergy) || allergy.includes(name)
            )
        ) {
            return false;
        }
    }

    return true;
}

function isRealisticMeal(
    ingredients: RecipeSummary['ingredients'],
    scale: number
) {
    for (const item of ingredients) {
        const scaledGrams = item.grams * scale;

        // 🔴 regla 1: max gramos
        if (item.maxPortionGrams && scaledGrams > item.maxPortionGrams) {
            return false;
        }

        // 🔴 regla 2: unidades discretas (ej: tortilla)
        if (item.unit === 'PIECE') {
            const scaledQty = item.quantity * scale;

            if (scaledQty > 3) {
                // puedes ajustar este límite
                return false;
            }
        }
    }
}

function buildMealCatalog(recipes: RecipeSummary[]) {
    const catalog: Record<MealKey, RecipeSummary[]> = {
        smoothie: [],
        breakfast: [],
        snack1: [],
        snack2: [],
        lunch: [],
        dinner: [],
        drinks: []
    };

    for (const recipe of recipes) {
        if (recipe.mealType === 'SMOOTHIE') catalog.smoothie.push(recipe);
        if (recipe.mealType === 'BREAKFAST') catalog.breakfast.push(recipe);
        if (recipe.mealType === 'SNACK1') catalog.snack1.push(recipe);
        if (recipe.mealType === 'SNACK2') catalog.snack2.push(recipe);
        if (recipe.mealType === 'LUNCH') catalog.lunch.push(recipe);
        if (recipe.mealType === 'DINNER') catalog.dinner.push(recipe);
        if (recipe.mealType === 'DRINKS') catalog.drinks.push(recipe);
    }

    return catalog;
}

function buildFallbackWeekPlan(
    catalog: Record<MealKey, RecipeSummary[]>,
    activeMealOrder: MealKey[]
) {
    console.log(
        '[buildFallbackWeekPlan] Construyendo plan semanal de respaldo',
        {activeMealOrder}
    );
    return DAYS.map((day, dayIndex) => {
        const meals = Object.fromEntries(
            activeMealOrder.map(mealKey => [
                mealKey,
                catalog[mealKey][dayIndex % catalog[mealKey].length]?.id
            ])
        ) as Partial<Record<MealKey, string>>;
        console.log('Plan para', day, meals);
        return {day, meals};
    });
}

function computeMacroPlan(
    dailyCalories: number,
    macroPercents: {protein: number; carbs: number; fat: number}
): MacroPlan {
    const proteinGramsPerDay =
        (dailyCalories * (macroPercents.protein / 100)) / 4;
    const carbsGramsPerDay = (dailyCalories * (macroPercents.carbs / 100)) / 4;
    const fatGramsPerDay = (dailyCalories * (macroPercents.fat / 100)) / 9;

    return {
        dailyCalories,
        weeklyCalories: dailyCalories * 7,
        proteinGramsPerDay: Number(proteinGramsPerDay.toFixed(1)),
        carbsGramsPerDay: Number(carbsGramsPerDay.toFixed(1)),
        fatGramsPerDay: Number(fatGramsPerDay.toFixed(1)),
        proteinGramsPerWeek: Number((proteinGramsPerDay * 7).toFixed(1)),
        carbsGramsPerWeek: Number((carbsGramsPerDay * 7).toFixed(1)),
        fatGramsPerWeek: Number((fatGramsPerDay * 7).toFixed(1))
    };
}

function estimateDailyCalories(args: {
    goal: ProtocolGoal;
    gender: string;
    age: number | null;
    heightCm: number | null;
    weightKg: number | null;
    activityLevel?:
        | 'sedentario'
        | 'ligero'
        | 'moderado'
        | 'activo'
        | 'muy_activo';
}) {
    if (!args.weightKg || !args.heightCm || !args.age) {
        return getDefaultCalories(args.goal);
    }

    const normalizedGender = args.gender?.toUpperCase();
    const activityFactorMap = {
        sedentario: 1.2,
        ligero: 1.375,
        moderado: 1.55,
        activo: 1.725,
        muy_activo: 1.9
    } as const;

    const bmr =
        10 * args.weightKg +
        6.25 * args.heightCm -
        5 * args.age +
        (normalizedGender === 'MALE' ? 5 : -161);

    const maintenance =
        bmr *
        activityFactorMap[
            (args.activityLevel ?? 'moderado') as keyof typeof activityFactorMap
        ];

    let goalAdjustment = 0;
    if (args.goal === 'perdida_peso') goalAdjustment = -300;
    if (args.goal === 'ganancia_musculo') goalAdjustment = 250;
    if (args.goal === 'control_diabetes') goalAdjustment = -100;

    const estimated = maintenance + goalAdjustment;
    return Math.round(Math.max(1200, Math.min(4000, estimated)));
}

function pickRecipeById(
    catalog: Record<MealKey, RecipeSummary[]>,
    mealKey: MealKey,
    recipeId: string | undefined,
    dayIndex: number
) {
    console.log(
        `[pickRecipeById] Seleccionando receta para ${mealKey}, id solicitada: ${recipeId}`
    );
    if (catalog[mealKey].length === 0) return null;

    const byId = catalog[mealKey].find(item => item.id === recipeId);
    console.log(`[pickRecipeById] Receta encontrada por ID:`, byId);
    if (byId) return byId;
    console.log(
        `[pickRecipeById] No se encontró receta por ID, seleccionando por índice para ${mealKey} y día ${dayIndex}`
    );
    const byIndex =
        catalog[mealKey][dayIndex % catalog[mealKey].length] ?? null;
    console.log(`[pickRecipeById] Receta seleccionada por índice:`, byIndex);
    return byIndex;
}

function toMealSlot(
    recipe: RecipeSummary | null,
    targetCalories: number,
    fallbackRecipeName = 'No incluido',
    ingredientAdjustments?: IngredientPortionAdjustment[]
): MealSlot & {
    scaledCalories: number;
    scaledProtein: number;
    scaledCarbs: number;
    scaledFat: number;
} {
    if (!recipe) {
        return {
            id: 'optional-meal',
            recipeName: fallbackRecipeName,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            portionMultiplier: 0,
            ingredientPortions: [],
            scaledCalories: 0,
            scaledProtein: 0,
            scaledCarbs: 0,
            scaledFat: 0
        };
    }

    if (recipe.calories <= 0) {
        const adjustedIngredients = applyIngredientAdjustments(
            recipe.ingredients,
            ingredientAdjustments
        );

        return {
            id: recipe.id,
            recipeName: recipe.title,
            imageUrl: recipe.imageUrl ?? undefined,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            portionMultiplier: 0,
            ingredientPortions: adjustedIngredients.map(item => ({
                ingredientName: item.name,
                baseQuantity: item.quantity,
                targetQuantity: item.quantity,
                baseGrams: item.grams,
                targetGrams: item.grams,
                unit: item.unit
            })),
            scaledCalories: 0,
            scaledProtein: 0,
            scaledCarbs: 0,
            scaledFat: 0
        };
    }

    if (ingredientAdjustments && ingredientAdjustments.length > 0) {
        const adjustedIngredients = applyIngredientAdjustments(
            recipe.ingredients,
            ingredientAdjustments
        );
        const adjustedNutrition =
            computeNutritionFromSummaryIngredients(adjustedIngredients);

        return {
            id: recipe.id,
            recipeName: recipe.title,
            imageUrl: recipe.imageUrl ?? undefined,
            calories: adjustedNutrition.calories,
            protein: adjustedNutrition.protein,
            carbs: adjustedNutrition.carbs,
            fat: adjustedNutrition.fat,
            portionMultiplier: 1,
            ingredientPortions: adjustedIngredients.map(item => ({
                ingredientName: item.name,
                baseQuantity: item.quantity,
                targetQuantity: item.quantity,
                baseGrams: item.grams,
                targetGrams: item.grams,
                unit: item.unit
            })),
            scaledCalories: adjustedNutrition.calories,
            scaledProtein: adjustedNutrition.protein,
            scaledCarbs: adjustedNutrition.carbs,
            scaledFat: adjustedNutrition.fat
        };
    }

    const rawScale = targetCalories / recipe.calories;
    const scale = Math.max(0.6, Math.min(1.8, Number(rawScale.toFixed(2))));
    const scaledCalories = Math.round(recipe.calories * scale);
    const scaledProtein = round1(recipe.protein * scale);
    const scaledCarbs = round1(recipe.carbs * scale);
    const scaledFat = round1(recipe.fat * scale);

    return {
        id: recipe.id,
        recipeName: recipe.title,
        imageUrl: recipe.imageUrl ?? undefined,
        calories: scaledCalories,
        protein: scaledProtein,
        carbs: scaledCarbs,
        fat: scaledFat,
        portionMultiplier: scale,
        ingredientPortions: recipe.ingredients.map(item => ({
            ingredientName: item.name,
            baseQuantity: item.quantity,
            targetQuantity: scaleQuantityByUnit(
                item.quantity,
                scale,
                item.unit
            ),
            baseGrams: item.grams,
            targetGrams: round1(item.grams * scale),
            unit: item.unit
        })),
        scaledCalories,
        scaledProtein,
        scaledCarbs,
        scaledFat
    };
}

export async function generateProtocolPlanForPatient(
    patientId: string,
    input: GenerateProtocolPlanInput
) {
    try {
        console.info('[protocol.generate] Solicitud recibida', {
            patientId,
            goal: input.goal,
            activityLevel: input.activityLevel,
            weekCount: input.weekCount,
            hasWeightOverride: typeof input.weightKg === 'number'
        });

        // 1. Obtener datos del paciente y recetas desde la base de datos
        const patient = await prisma.patient.findUnique({
            where: {id: patientId},
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                vitals: {
                    orderBy: {
                        recordedAt: 'desc'
                    },
                    take: 1,
                    select: {
                        weightKg: true
                    }
                },
                allergies: {
                    include: {
                        allergen: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                conditions: {
                    include: {
                        condition: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        console.info('[protocol.generate] Datos del paciente obtenidos', {
            patientId,
            name: patient
                ? `${patient.user.firstName} ${patient.user.lastName}`
                : 'Paciente no encontrado',
            allergiesCount: patient?.allergies.length ?? 0,
            conditionsCount: patient?.conditions.length ?? 0
        });

        if (!patient) {
            console.warn('[protocol.generate] Paciente no encontrado', {
                patientId
            });
            return {success: false, message: 'Paciente no encontrado'};
        }

        // 2. Construir set de alergias para filtrado de recetas
        const allergyNames = new Set(
            patient.allergies.map(item =>
                normalizeAllergenName(item.allergen.name)
            )
        );

        // 3. Obtener recetas y sus ingredientes desde la base de datos
        const recipesFromDb = await prisma.recipe.findMany({
            include: {
                ingredients: {
                    include: {
                        ingredient: {
                            include: {
                                food: {
                                    select: {
                                        caloriesPer100g: true,
                                        proteinPer100g: true,
                                        carbsPer100g: true,
                                        fatPer100g: true,
                                        isDiscrete: true,
                                        maxPortionGrams: true
                                    }
                                }
                            }
                        }
                    }
                },
                extraIngredients: true
            }
        });

        console.info(
            '[protocol.generate] Recetas obtenidas de la base de datos',
            {
                totalRecipes: recipesFromDb.length
            }
        );

        // 4. Mapear recetas a formato de catálogo y filtrar por alergias
        const allowedRecipes: RecipeSummary[] = recipesFromDb
            .filter(recipe => isRecipeAllowed(recipe, allergyNames))
            .map(recipe => {
                const nutrition = computeRecipeNutrition(recipe);

                return {
                    id: recipe.id,
                    title: recipe.title,
                    imageUrl: recipe.imageUrl,
                    mealType: recipe.mealType,
                    calories: nutrition.calories,
                    protein: nutrition.protein,
                    carbs: nutrition.carbs,
                    fat: nutrition.fat,
                    ingredients: recipe.ingredients.map(item => {
                        const recipeIngredient = item as {
                            grams: number;
                            quantity?: number | null;
                            unit?: RecipeIngredientUnit | null;
                            ingredient: {name: string};
                        };

                        return {
                            name: recipeIngredient.ingredient.name,
                            quantity: recipeIngredient.quantity ?? 1,
                            grams: recipeIngredient.grams,
                            unit: normalizeRecipeIngredientUnit(
                                recipeIngredient.unit
                            ),
                            caloriesPer100g:
                                item.ingredient.food?.caloriesPer100g ?? 0,
                            proteinPer100g:
                                item.ingredient.food?.proteinPer100g ?? 0,
                            carbsPer100g:
                                item.ingredient.food?.carbsPer100g ?? 0,
                            fatPer100g: item.ingredient.food?.fatPer100g ?? 0,
                            isDiscrete:
                                item.ingredient.food?.isDiscrete ?? false,
                            maxPortionGrams:
                                item.ingredient.food?.maxPortionGrams ?? null
                        };
                    })
                };
            })
            .filter(
                recipe => recipe.calories > 0 || recipe.mealType === 'DRINKS'
            );

        console.info('[protocol.generate] Recetas analizadas', {
            totalRecipes: recipesFromDb.length,
            allowedRecipes: allowedRecipes.length,
            allergies: allergyNames.size
        });

        // 5. Construir catálogo de recetas por tipo de comida
        const catalog = buildMealCatalog(allowedRecipes);

        // 6. Validar que existan recetas para cada comida activa en la distribución
        const activeMealOrder = getActiveMealOrder(input);

        console.log('[protocol.generate] activeMealOrder', activeMealOrder);

        // 7. Identificar comidas sin opciones disponibles en el catálogo
        const mealsWithoutOptions = activeMealOrder.filter(
            meal => catalog[meal].length === 0
        );

        console.log(
            '[protocol.generate] mealsWithoutOptions',
            mealsWithoutOptions
        );

        if (mealsWithoutOptions.length > 0) {
            console.warn(
                '[protocol.generate] Faltan recetas por tipo de comida',
                {
                    mealsWithoutOptions
                }
            );
            return {
                success: false,
                message:
                    'No hay recetas disponibles para: ' +
                    mealsWithoutOptions.join(', ')
            };
        }

        const age = patient.birthDate
            ? Math.floor(
                  (Date.now() - new Date(patient.birthDate).getTime()) /
                      (1000 * 60 * 60 * 24 * 365.25)
              )
            : null;

        // Fallback con formula de Mifflin-St Jeor Equation
        const inferredCalories = estimateDailyCalories({
            goal: input.goal,
            gender: patient.gender,
            age,
            heightCm: patient.height,
            weightKg:
                input.weightKg ??
                patient.vitals[0]?.weightKg ??
                patient.initialWeight,
            activityLevel: input.activityLevel
        });

        const dailyCalories = input.planCalories ?? inferredCalories;

        console.info('[protocol.generate] Calorias objetivo calculadas', {
            fromUser: typeof input.planCalories === 'number',
            inferredCalories,
            selectedDailyCalories: dailyCalories
        });

        const macroPercents =
            input.macroPercents ?? getDefaultMacroPercent(input.goal);
        const percentTotal =
            macroPercents.protein + macroPercents.carbs + macroPercents.fat;

        const normalizedMacroPercents = {
            protein: Number(
                ((macroPercents.protein / percentTotal) * 100).toFixed(1)
            ),
            carbs: Number(
                ((macroPercents.carbs / percentTotal) * 100).toFixed(1)
            ),
            fat: Number(((macroPercents.fat / percentTotal) * 100).toFixed(1))
        };

        console.log(
            '[protocol.generate] Porcentajes de macronutrientes normalizados',
            {
                normalizedMacroPercents
            }
        );

        const mealCalorieSplit = buildMealCalorieSplit(
            activeMealOrder,
            input.mealDistribution
        );

        console.log('[protocol.generate] Distribución de calorías por comida', {
            mealCalorieSplit
        });

        // 8. Construir plan semanal de comidas, asignando recetas y ajustando por calorías objetivo
        const fallbackWeekPlan = buildFallbackWeekPlan(
            catalog,
            activeMealOrder
        );

        // El plan semanal se construye iterando sobre los días y asignando recetas a cada comida según el catálogo y la distribución calórica. Si no se encuentra una receta específica por ID, se selecciona una de forma cíclica del catálogo para ese tipo de comida.
        const weekPlan: DayMeals[] = DAYS.map((dayName, dayIndex) => {
            const aiDay = fallbackWeekPlan[dayIndex];

            const recipeByMeal: Record<MealKey, RecipeSummary | null> = {
                smoothie: pickRecipeById(
                    catalog,
                    'smoothie',
                    aiDay.meals.smoothie,
                    dayIndex
                ),
                breakfast: pickRecipeById(
                    catalog,
                    'breakfast',
                    aiDay.meals.breakfast,
                    dayIndex
                ),
                snack1: pickRecipeById(
                    catalog,
                    'snack1',
                    aiDay.meals.snack1,
                    dayIndex
                ),
                snack2: pickRecipeById(
                    catalog,
                    'snack2',
                    aiDay.meals.snack2,
                    dayIndex
                ),
                lunch: pickRecipeById(
                    catalog,
                    'lunch',
                    aiDay.meals.lunch,
                    dayIndex
                ),
                dinner: pickRecipeById(
                    catalog,
                    'dinner',
                    aiDay.meals.dinner,
                    dayIndex
                ),
                drinks: pickRecipeById(
                    catalog,
                    'drinks',
                    aiDay.meals.drinks,
                    dayIndex
                )
            };

            return {
                day: dayName,
                smoothie: toMealSlot(
                    recipeByMeal.smoothie,
                    dailyCalories * mealCalorieSplit.smoothie
                ),
                breakfast: toMealSlot(
                    recipeByMeal.breakfast,
                    dailyCalories * mealCalorieSplit.breakfast
                ),
                snack1: toMealSlot(
                    recipeByMeal.snack1,
                    dailyCalories * mealCalorieSplit.snack1
                ),
                snack2: toMealSlot(
                    recipeByMeal.snack2,
                    dailyCalories * mealCalorieSplit.snack2
                ),
                lunch: toMealSlot(
                    recipeByMeal.lunch,
                    dailyCalories * mealCalorieSplit.lunch
                ),
                dinner: toMealSlot(
                    recipeByMeal.dinner,
                    dailyCalories * mealCalorieSplit.dinner
                ),
                drinks: toMealSlot(
                    recipeByMeal.drinks,
                    dailyCalories * mealCalorieSplit.drinks
                )
            };
        });

        for (const day of weekPlan) {
            console.log(`Plan para ${day.day}:`);
            for (const mealKey of activeMealOrder) {
                const slot = day[mealKey] as MealSlot;
                console.log(
                    `  ${mealKey}: ${slot.recipeName} (${slot.calories} kcal)`
                );
            }
        }

        const macroPlan = computeMacroPlan(
            dailyCalories,
            normalizedMacroPercents
        );

        const latestConsultation = await prisma.consultation.findFirst({
            where: {patientId},
            orderBy: {createdAt: 'desc'},
            select: {id: true}
        });

        const persisted = await prisma.$transaction(async tx => {
            const protocol = await tx.protocol.create({
                data: {
                    title:
                        input.title ??
                        `Protocolo de ${patient.user.firstName} ${patient.user.lastName}`,
                    weekCount: input.weekCount,
                    patientId,
                    status: 'ACTIVE'
                }
            });

            const revision = await tx.protocolRevision.create({
                data: {
                    protocolId: protocol.id,
                    consultationId: latestConsultation?.id
                }
            });

            const protocolWeek = await tx.protocolWeek.create({
                data: {
                    protocolId: protocol.id,
                    weekNumber: 1
                }
            });

            for (const [dayIndex, dayPlan] of weekPlan.entries()) {
                const protocolDay = await tx.protocolDay.create({
                    data: {
                        weekId: protocolWeek.id,
                        dayIndex: dayIndex + 1
                    }
                });

                for (const mealKey of activeMealOrder) {
                    const slot = dayPlan[mealKey] as MealSlot & {
                        scaledCalories: number;
                        scaledProtein: number;
                        scaledCarbs: number;
                        scaledFat: number;
                    };

                    const meal = await tx.protocolMeal.create({
                        data: {
                            dayId: protocolDay.id,
                            mealType: mapMealKeyToEnum(mealKey),
                            recipeId:
                                slot.id === 'optional-meal'
                                    ? undefined
                                    : slot.id
                        }
                    });

                    if (
                        slot.id !== 'optional-meal' &&
                        slot.ingredientPortions &&
                        slot.ingredientPortions.length > 0
                    ) {
                        const targetCalories =
                            dailyCalories * mealCalorieSplit[mealKey];
                        const targetProtein = round1(
                            (targetCalories *
                                (normalizedMacroPercents.protein / 100)) /
                                4
                        );
                        const targetCarbs = round1(
                            (targetCalories *
                                (normalizedMacroPercents.carbs / 100)) /
                                4
                        );
                        const targetFat = round1(
                            (targetCalories *
                                (normalizedMacroPercents.fat / 100)) /
                                9
                        );

                        await tx.protocolMealPortions.create({
                            data: {
                                protocolMealId: meal.id,
                                targetCalories,
                                targetProtein,
                                targetCarbs,
                                targetFat,
                                actualCalories: slot.scaledCalories,
                                actualProtein: slot.scaledProtein,
                                actualCarbs: slot.scaledCarbs,
                                actualFat: slot.scaledFat,
                                portionMultiplier: slot.portionMultiplier ?? 1,
                                ingredients: {
                                    createMany: {
                                        data: slot.ingredientPortions.map(
                                            p => ({
                                                ingredientName:
                                                    p.ingredientName,
                                                unit: (p.unit?.toUpperCase() ??
                                                    'GRAM') as import('@prisma/client').IngredientUnit,
                                                baseQuantity:
                                                    p.baseQuantity ??
                                                    p.baseGrams,
                                                targetQuantity:
                                                    p.targetQuantity ??
                                                    p.targetGrams,
                                                baseGrams: p.baseGrams,
                                                targetGrams: p.targetGrams
                                            })
                                        )
                                    }
                                }
                            }
                        });
                    }
                }
            }

            return {
                protocolId: protocol.id,
                revisionId: revision.id
            };
        });

        console.info('[protocol.generate] Protocolo persistido', {
            protocolId: persisted.protocolId,
            revisionId: persisted.revisionId,
            daysCreated: weekPlan.length
        });

        return {
            success: true,
            message: 'Plan generado correctamente',
            data: {
                weekPlan,
                macroPlan,
                protocolId: persisted.protocolId,
                revisionId: persisted.revisionId,
                disclaimer:
                    'Los macronutrientes no incluyen ingredientes extra no calculados.'
            }
        };
    } catch (error) {
        console.error('[protocol.generate] Error general en generacion', {
            patientId,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });

        if (error instanceof ZodError) {
            return {
                success: false,
                message: 'Error de validación',
                errors: error.flatten()
            };
        }

        return {
            success: false,
            message: 'Error al generar el plan semanal',
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
