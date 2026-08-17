import {prisma} from '@/lib/prisma';
import {
    buildEquivalenciasColumns,
    type AssignedMenuPortion,
    type EquivalenciasColumn,
    type EquivalenciasFoodRow
} from '@/lib/patient-portal/equivalencias';

export type {AssignedMenuPortion, EquivalenciasColumn};

export async function loadEquivalenciasColumns(
    assignedPortions: AssignedMenuPortion[] = []
): Promise<EquivalenciasColumn[]> {
    const foods = await prisma.food.findMany({
        select: {
            name: true,
            gramsPerEquivalent: true,
            equivalentDisplayText: true,
            isFreePortion: true,
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
        isFree: food.isFreePortion || food.group.isFree,
        gramsPerEquivalent: food.gramsPerEquivalent,
        equivalentDisplayText: food.equivalentDisplayText
    }));

    return buildEquivalenciasColumns(rows, assignedPortions);
}
