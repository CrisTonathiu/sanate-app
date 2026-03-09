import {
    AllergyIdInput,
    allergyIdSchema,
    CreateAllergyInput,
    createAllergySchema,
    UpdateAllergyInput,
    updateAllergySchema
} from '../../validations/allergy.schema';
import {ZodError} from 'zod';
import {prisma} from '../../prisma';

export async function getAllAllergies() {
    try {
        const allergies = await prisma.allergen.findMany();
        return {success: true, data: allergies};
    } catch (error) {
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function createAllergy(input: CreateAllergyInput) {
    try {
        const validatedInput = createAllergySchema.parse(input);

        const result = await prisma.allergen.create({
            data: {
                name: validatedInput.name,
                description: validatedInput.description
            }
        });

        return {success: true, data: result};
    } catch (error) {
        if (error instanceof ZodError) {
            return {success: false, error: error.message, data: null};
        }
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function updateAllergy(input: UpdateAllergyInput) {
    try {
        const validatedInput = updateAllergySchema.parse(input);

        const result = await prisma.allergen.update({
            where: {
                id: validatedInput.id
            },
            data: {
                name: validatedInput.name,
                description: validatedInput.description
            }
        });

        return {success: true, data: result};
    } catch (error) {
        if (error instanceof ZodError) {
            return {success: false, error: error.message, data: null};
        }
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}

export async function deleteAllergy(input: AllergyIdInput) {
    try {
        const validatedInput = allergyIdSchema.parse(input);

        const result = await prisma.allergen.delete({
            where: {
                id: validatedInput
            }
        });

        return {success: true, data: result};
    } catch (error) {
        if (error instanceof ZodError) {
            return {success: false, error: error.message, data: null};
        }
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}
