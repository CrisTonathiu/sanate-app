/**
 * Suggests a portal swap category for every food from its name and group.
 *
 *   npx tsx scripts/apply-swap-categories.ts            # dry run, prints the plan
 *   npx tsx scripts/apply-swap-categories.ts --apply    # writes it
 *
 * Only foods without a category are touched; categories set in the admin
 * are kept. Foods with no suggestion are listed so staff can set them.
 */
import {prisma} from '../src/lib/prisma';
import {
    suggestFoodSwapCategory,
    type FoodSwapCategory
} from '../src/lib/food/swap-categories';

async function main() {
    const apply = process.argv.includes('--apply');

    const foods = await prisma.food.findMany({
        select: {
            id: true,
            name: true,
            swapCategory: true,
            isFreePortion: true,
            group: {select: {name: true, isFree: true}}
        },
        orderBy: [{group: {name: 'asc'}}, {name: 'asc'}]
    });

    const planned: Array<{id: string; name: string; group: string; category: FoodSwapCategory}> = [];
    const missing: Array<{name: string; group: string}> = [];
    let kept = 0;

    for (const food of foods) {
        if (food.isFreePortion || food.group.isFree) {
            continue;
        }
        if (food.swapCategory) {
            kept += 1;
            continue;
        }

        const category = suggestFoodSwapCategory(food.name, food.group.name);
        if (!category) {
            missing.push({name: food.name, group: food.group.name});
            continue;
        }

        planned.push({
            id: food.id,
            name: food.name,
            group: food.group.name,
            category
        });
    }

    console.log(apply ? 'Aplicando categorías:' : 'Propuesta (sin guardar):');
    for (const item of planned) {
        console.log(`  ${item.category.padEnd(20)} ${item.group.padEnd(15)} ${item.name}`);
    }

    console.log(`\nSin sugerencia (asignar en el admin): ${missing.length}`);
    for (const item of missing) {
        console.log(`  — ${item.group.padEnd(15)} ${item.name}`);
    }
    console.log(`\nYa tenían categoría (no se tocan): ${kept}`);

    if (!apply) {
        console.log('\nEjecuta con --apply para guardar.');
        return;
    }

    for (const item of planned) {
        await prisma.food.update({
            where: {id: item.id},
            data: {swapCategory: item.category}
        });
    }
    console.log(`\nActualizados: ${planned.length}`);
}

main()
    .catch(error => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
