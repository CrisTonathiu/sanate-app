import {z} from 'zod';

export const protocolGoalSchema = z.enum([
    'perdida_peso',
    'ganancia_musculo',
    'control_diabetes',
    'antiinflamatorio',
    'personalizado'
]);

export const activityLevelSchema = z.enum([
    'sedentario',
    'ligero',
    'moderado',
    'activo',
    'muy_activo'
]);

export const generateProtocolPlanSchema = z.object({
    title: z.string().min(3).max(120).optional(),
    weekCount: z.number().int().min(1).max(4).default(1),
    goal: protocolGoalSchema.default('personalizado'),
    activityLevel: activityLevelSchema.default('moderado'),
    weightKg: z.number().min(20).max(400).optional(),
    includeSmoothie: z.boolean().optional().default(false),
    includeDrinks: z.boolean().optional().default(false),
    planCalories: z.number().min(500).max(6000).optional(),
    macroPercents: z
        .object({
            protein: z.number().min(5).max(70),
            carbs: z.number().min(5).max(80),
            fat: z.number().min(5).max(70)
        })
        .optional(),
    mealDistribution: z
        .record(z.string(), z.number().min(0).max(100))
        .optional()
});

export type GenerateProtocolPlanInput = z.infer<
    typeof generateProtocolPlanSchema
>;

export type ProtocolGoal = z.infer<typeof protocolGoalSchema>;
