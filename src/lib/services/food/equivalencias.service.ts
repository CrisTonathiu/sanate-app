import {prisma} from '@/lib/prisma';
import {
    buildEquivalenciasColumns,
    type EquivalenciasColumn,
    type EquivalenciasFoodRow
} from '@/lib/patient-portal/equivalencias';

export type {EquivalenciasColumn};

export async function loadEquivalenciasColumns(): Promise<EquivalenciasColumn[]> {
    const foods = await prisma.food.findMany({
        select: {
            name: true,
            maxPortionGrams: true,
            isDiscrete: true,
            group: {
                select: {
                    name: true,
                    isFree: true
                }
            }
        },
        orderBy: {name: 'asc'}
    });

    const rows: EquivalenciasFoodRow[] = foods.map(food => ({
        name: food.name,
        groupName: food.group.name,
        isFree: food.group.isFree,
        maxPortionGrams: food.maxPortionGrams,
        isDiscrete: food.isDiscrete
    }));

    return buildEquivalenciasColumns(rows);
}
