import {z} from 'zod';

export const createConditionSchema = z.object({
    name: z.string().min(1, 'Condition name is required'),
    description: z.string().optional()
});

export type CreateConditionInput = z.infer<typeof createConditionSchema>;

export const conditionIdSchema = z.string().cuid('Invalid condition ID');

export type ConditionIdInput = z.infer<typeof conditionIdSchema>;

export const updateConditionSchema = z.object({
    id: z.string().cuid('Invalid condition ID'),
    name: z.string().min(1, 'Condition name is required'),
    description: z.string().optional()
});

export type UpdateConditionInput = z.infer<typeof updateConditionSchema>;
