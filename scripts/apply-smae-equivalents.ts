import {prisma} from '../src/lib/prisma';
import {applySmaeEquivalentsToExistingFoods} from '../src/lib/food/smae-equivalents';

async function main() {
    const {matched, unmatched} = await applySmaeEquivalentsToExistingFoods(
        prisma
    );

    console.log(`Actualizados: ${matched.length}`);
    for (const name of matched) {
        console.log(`  ✓ ${name}`);
    }

    const reportable = unmatched.filter(item => item.group !== 'VEGETALES');
    console.log(`\nSin match SMAE (excepto verduras libres): ${reportable.length}`);
    for (const item of reportable) {
        console.log(`  — ${item.group}\t${item.name}`);
    }
}

main()
    .catch(error => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
