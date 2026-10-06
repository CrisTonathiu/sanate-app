import {prisma} from '@/lib/prisma';
import {equivalenciasColumnKeyForGroup} from '@/lib/patient-portal/equivalencias';
import type {SwapCatalogFood} from '@/lib/patient-portal/ingredient-swaps';

function caloriesPer100g(food: {
    caloriesPer100g: number | null;
    proteinPer100g: number | null;
    carbsPer100g: number | null;
    fatPer100g: number | null;
}): number {
    if (food.caloriesPer100g != null) {
        return food.caloriesPer100g;
    }

    return (
        (food.proteinPer100g ?? 0) * 4 +
        (food.carbsPer100g ?? 0) * 4 +
        (food.fatPer100g ?? 0) * 9
    );
}

/**
 * Foods a patient can swap between on the portal. Free portions (verduras,
 * frutos rojos) and foods without calorie data are left out.
 */
export async function loadIngredientSwapCatalog(
    patientId: string
): Promise<SwapCatalogFood[]> {
    const [foods, foodDislikes, groupDislikes] = await Promise.all([
        prisma.food.findMany({
            where: {isFreePortion: false, group: {isFree: false}},
            select: {
                id: true,
                name: true,
                caloriesPer100g: true,
                proteinPer100g: true,
                carbsPer100g: true,
                fatPer100g: true,
                isDiscrete: true,
                allowPieceFractions: true,
                gramsPerPiece: true,
                gramsPerEquivalent: true,
                equivalentDisplayText: true,
                group: {select: {name: true}}
            }
        }),
        prisma.patientFoodDislike.findMany({
            where: {patientId},
            select: {foodId: true}
        }),
        prisma.patientFoodGroupDislike.findMany({
            where: {patientId},
            select: {group: {select: {items: {select: {foodId: true}}}}}
        })
    ]);

    const dislikedFoodIds = new Set([
        ...foodDislikes.map(dislike => dislike.foodId),
        ...groupDislikes.flatMap(dislike =>
            dislike.group.items.map(item => item.foodId)
        )
    ]);

    return foods.flatMap(food => {
        const columnKey = equivalenciasColumnKeyForGroup(food.group.name);
        const kcal = caloriesPer100g(food);
        if (!columnKey || !(kcal > 0)) {
            return [];
        }

        return [
            {
                id: food.id,
                name: food.name,
                columnKey,
                caloriesPer100g: kcal,
                isDiscrete: food.isDiscrete,
                allowPieceFractions: food.allowPieceFractions,
                gramsPerPiece: food.gramsPerPiece,
                gramsPerEquivalent: food.gramsPerEquivalent,
                equivalentDisplayText: food.equivalentDisplayText,
                disliked: dislikedFoodIds.has(food.id)
            }
        ];
    });
}
