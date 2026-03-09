import {z} from 'zod';

export const createAllergySchema = z.object({
    name: z.string().min(1, 'Allergy name is required'),
    description: z.string().optional()
});

export type CreateAllergyInput = z.infer<typeof createAllergySchema>;

export const allergyIdSchema = z.string().cuid('Invalid allergy ID');

export type AllergyIdInput = z.infer<typeof allergyIdSchema>;

export const updateAllergySchema = z.object({
    id: z.string().cuid('Invalid allergy ID'),
    name: z.string().min(1, 'Allergy name is required').optional(),
    description: z.string().optional()
});

export type UpdateAllergyInput = z.infer<typeof updateAllergySchema>;
