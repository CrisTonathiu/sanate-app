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
    includeDrinks: z.boolean().optional().default(false)
});

export type GenerateProtocolPlanInput = z.infer<
    typeof generateProtocolPlanSchema
>;

export type ProtocolGoal = z.infer<typeof protocolGoalSchema>;
