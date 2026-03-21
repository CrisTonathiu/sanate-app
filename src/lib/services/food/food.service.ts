'use server';

import {prisma} from '@/lib/prisma';

export async function getAllFoods() {
    try {
        const foods = await prisma.food.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return {success: true, data: foods};
    } catch (error) {
        return {
            success: false,
            error: 'An unexpected error occurred',
            data: null
        };
    }
}
