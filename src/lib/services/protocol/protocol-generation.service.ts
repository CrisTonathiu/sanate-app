'use server';

import {MealType} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {openai} from '@/lib/openai';
import {
    GenerateProtocolPlanInput,
    ProtocolGoal
} from '@/lib/validations/protocol-generation.schema';
import {DayMeals, MealSlot} from '@/lib/interface/meal-interface';
import {ZodError, z} from 'zod';

type MealKey =
    | 'smoothie'
    | 'breakfast'
    | 'snack'
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
        grams: number;
    }>;
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
    'snack',
    'lunch',
    'dinner',
    'drinks'
];

const REQUIRED_MEAL_ORDER: MealKey[] = [
    // 'breakfast',
    // 'snack',
    'lunch'
    // 'dinner'
];

const MEAL_CALORIE_SPLIT: Record<MealKey, number> = {
    smoothie: 0.1,
    breakfast: 0.2,
    snack: 0.1,
    lunch: 0.3,
    dinner: 0.25,
    drinks: 0.05
};

const AI_RESPONSE_SCHEMA = z.object({
    dailyCalories: z.number().min(900).max(5000).optional(),
    macroPercents: z
        .object({
            protein: z.number().min(10).max(60),
            carbs: z.number().min(10).max(70),
            fat: z.number().min(10).max(60)
        })
        .optional(),
    weekPlan: z.array(
        z.object({
            day: z.string(),
            meals: z.object({
                breakfast: z.string(),
                snack: z.string(),
                lunch: z.string(),
                dinner: z.string(),
                smoothie: z.string().optional(),
                drinks: z.string().optional()
            })
        })
    )
});

function getActiveMealOrder(input: GenerateProtocolPlanInput): MealKey[] {
    return MEAL_ORDER.filter(mealKey => {
        if (REQUIRED_MEAL_ORDER.includes(mealKey)) return true;
        if (mealKey === 'smoothie') return input.includeSmoothie;
        if (mealKey === 'drinks') return input.includeDrinks;
        return false;
    });
}

function mapMealKeyToEnum(mealKey: MealKey): MealType {
    const map: Record<MealKey, MealType> = {
        smoothie: 'SMOOTHIE',
        breakfast: 'BREAKFAST',
        snack: 'SNACK',
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

function computeRecipeNutrition(recipe: {
    title: string;
    ingredients: Array<{
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
        console.log(
            'Procesando ingrediente:',
            item.ingredient.name,
            'Cantidad (g):',
            item.grams
        );
        const ratio = item.grams / 100;
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

function buildMealCatalog(recipes: RecipeSummary[]) {
    const catalog: Record<MealKey, RecipeSummary[]> = {
        smoothie: [],
        breakfast: [],
        snack: [],
        lunch: [],
        dinner: [],
        drinks: []
    };

    for (const recipe of recipes) {
        if (recipe.mealType === 'SMOOTHIE') catalog.smoothie.push(recipe);
        if (recipe.mealType === 'BREAKFAST') catalog.breakfast.push(recipe);
        if (recipe.mealType === 'SNACK') catalog.snack.push(recipe);
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
    return DAYS.map((day, dayIndex) => {
        const meals = Object.fromEntries(
            activeMealOrder.map(mealKey => [
                mealKey,
                catalog[mealKey][dayIndex % catalog[mealKey].length]?.id
            ])
        ) as Partial<Record<MealKey, string>>;

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

async function generateWithAI(args: {
    goal: ProtocolGoal;
    patientSummary: {
        age: number | null;
        gender: string;
        heightCm: number | null;
        weightKg: number | null;
        activityLevel:
            | 'sedentario'
            | 'ligero'
            | 'moderado'
            | 'activo'
            | 'muy_activo';
        conditions: string[];
        allergies: string[];
    };
    catalog: Record<MealKey, RecipeSummary[]>;
    activeMealOrder: MealKey[];
}) {
    console.info('[protocol.generate.ai] Inicio de generación con IA', {
        goal: args.goal,
        patientSummary: args.patientSummary
    });
    if (!process.env.OPENAI_API_KEY) return null;

    const compactCatalog = Object.fromEntries(
        args.activeMealOrder.map(mealKey => [
            mealKey,
            args.catalog[mealKey].map(item => ({
                id: item.id,
                title: item.title,
                calories: item.calories,
                protein: item.protein
            }))
        ])
    );

    const prompt = {
        goal: args.goal,
        patient: args.patientSummary,
        energyNeedsRule:
            'Estima calorías diarias usando peso, estatura, edad, nivel de actividad (usa moderado si falta) y objetivo.',
        weekDays: [...DAYS],
        mealSlots: args.activeMealOrder,
        rules: [
            'Devuelve solo JSON sin markdown.',
            'Usa solo ids de receta disponibles en cada lista de tiempo de comida.',
            'Incluye un weekPlan completo de 7 días.',
            'Evita repetir la misma receta en días consecutivos cuando haya alternativas.',
            'Asegura que macroPercents sume 100.'
        ],
        catalog: compactCatalog
    };

    console.debug('[protocol.generate.ai] Prompt preparado', {
        goal: prompt.goal,
        weekDays: prompt.weekDays.length,
        mealCatalogSizes: Object.fromEntries(
            args.activeMealOrder.map(mealKey => [
                mealKey,
                compactCatalog[mealKey].length
            ])
        )
    });

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4.1-nano',
            temperature: 0.2,
            response_format: {type: 'json_object'},
            messages: [
                {
                    role: 'system',
                    content:
                        'Eres un asistente de planificación nutricional clínica. Responde con resultados prácticos y JSON estricto.'
                },
                {
                    role: 'user',
                    content: JSON.stringify(prompt)
                }
            ]
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            console.warn('[protocol.generate.ai] Respuesta vacia de OpenAI');
            return null;
        }

        const parsed = AI_RESPONSE_SCHEMA.safeParse(JSON.parse(content));
        if (!parsed.success) {
            console.warn(
                '[protocol.generate.ai] Respuesta invalida de OpenAI',
                {
                    issues: parsed.error.issues.length
                }
            );
            return null;
        }

        console.info('[protocol.generate.ai] Respuesta valida recibida');

        return parsed.data;
    } catch (error) {
        console.error('[protocol.generate.ai] Error al consultar OpenAI', {
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
        return null;
    }
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
    if (catalog[mealKey].length === 0) return null;

    const byId = catalog[mealKey].find(item => item.id === recipeId);
    if (byId) return byId;
    return catalog[mealKey][dayIndex % catalog[mealKey].length] ?? null;
}

function toMealSlot(
    recipe: RecipeSummary | null,
    targetCalories: number,
    fallbackRecipeName = 'No incluido'
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
        return {
            id: recipe.id,
            recipeName: recipe.title,
            imageUrl: recipe.imageUrl ?? undefined,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            portionMultiplier: 0,
            ingredientPortions: recipe.ingredients.map(item => ({
                ingredientName: item.name,
                baseGrams: item.grams,
                targetGrams: 0
            })),
            scaledCalories: 0,
            scaledProtein: 0,
            scaledCarbs: 0,
            scaledFat: 0
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
            baseGrams: item.grams,
            targetGrams: round1(item.grams * scale)
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

        if (!patient) {
            console.warn('[protocol.generate] Paciente no encontrado', {
                patientId
            });
            return {success: false, message: 'Paciente no encontrado'};
        }

        const allergyNames = new Set(
            patient.allergies.map(item =>
                normalizeAllergenName(item.allergen.name)
            )
        );

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
                                        fatPer100g: true
                                    }
                                }
                            }
                        }
                    }
                },
                extraIngredients: true
            }
        });

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
                    ingredients: recipe.ingredients.map(item => ({
                        name: item.ingredient.name,
                        grams: item.grams
                    }))
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

        const catalog = buildMealCatalog(allowedRecipes);
        const activeMealOrder = getActiveMealOrder(input);

        const mealsWithoutOptions = activeMealOrder.filter(
            meal => catalog[meal].length === 0
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

        const aiData = await generateWithAI({
            goal: input.goal,
            patientSummary: {
                age,
                gender: patient.gender,
                heightCm: patient.height,
                weightKg:
                    input.weightKg ??
                    patient.vitals[0]?.weightKg ??
                    patient.initialWeight,
                activityLevel: input.activityLevel,
                conditions: patient.conditions.map(item => item.condition.name),
                allergies: [...allergyNames]
            },
            catalog,
            activeMealOrder
        });

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

        const dailyCalories = aiData?.dailyCalories ?? inferredCalories;

        console.info('[protocol.generate] Calorias objetivo calculadas', {
            fromAI: typeof aiData?.dailyCalories === 'number',
            inferredCalories,
            selectedDailyCalories: dailyCalories
        });

        const macroPercents =
            aiData?.macroPercents ?? getDefaultMacroPercent(input.goal);
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

        const fallbackWeekPlan = buildFallbackWeekPlan(
            catalog,
            activeMealOrder
        );
        const planFromAI = aiData?.weekPlan ?? fallbackWeekPlan;
        console.info('[protocol.generate] Origen del plan semanal', {
            source: aiData?.weekPlan ? 'ai' : 'fallback'
        });

        const weekPlan: DayMeals[] = DAYS.map((dayName, dayIndex) => {
            const aiDay = planFromAI[dayIndex] ?? fallbackWeekPlan[dayIndex];

            const recipeByMeal: Record<MealKey, RecipeSummary | null> = {
                smoothie: input.includeSmoothie
                    ? pickRecipeById(
                          catalog,
                          'smoothie',
                          aiDay.meals.smoothie,
                          dayIndex
                      )
                    : null,
                breakfast: pickRecipeById(
                    catalog,
                    'breakfast',
                    aiDay.meals.breakfast,
                    dayIndex
                ),
                snack: pickRecipeById(
                    catalog,
                    'snack',
                    aiDay.meals.snack,
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
                drinks: input.includeDrinks
                    ? pickRecipeById(
                          catalog,
                          'drinks',
                          aiDay.meals.drinks,
                          dayIndex
                      )
                    : null
            };

            return {
                day: dayName,
                smoothie: toMealSlot(
                    recipeByMeal.smoothie,
                    dailyCalories * MEAL_CALORIE_SPLIT.smoothie,
                    input.includeSmoothie
                        ? 'Sin batido asignado'
                        : 'Batido no incluido'
                ),
                breakfast: toMealSlot(
                    recipeByMeal.breakfast,
                    dailyCalories * MEAL_CALORIE_SPLIT.breakfast
                ),
                snack: toMealSlot(
                    recipeByMeal.snack,
                    dailyCalories * MEAL_CALORIE_SPLIT.snack
                ),
                lunch: toMealSlot(
                    recipeByMeal.lunch,
                    dailyCalories * MEAL_CALORIE_SPLIT.lunch
                ),
                dinner: toMealSlot(
                    recipeByMeal.dinner,
                    dailyCalories * MEAL_CALORIE_SPLIT.dinner
                ),
                drinks: toMealSlot(
                    recipeByMeal.drinks,
                    dailyCalories * MEAL_CALORIE_SPLIT.drinks,
                    input.includeDrinks
                        ? 'Sin bebida asignada'
                        : 'Bebida no incluida'
                )
            };
        });

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

                const mealsForDay = activeMealOrder.map(mealKey => ({
                    dayId: protocolDay.id,
                    mealType: mapMealKeyToEnum(mealKey),
                    recipeId: dayPlan[mealKey].id
                }));

                await tx.protocolMeal.createMany({
                    data: mealsForDay
                });
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
