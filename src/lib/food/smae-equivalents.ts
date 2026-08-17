export type SmaeEquivalentPatch = {
    gramsPerEquivalent?: number | null;
    equivalentDisplayText?: string | null;
    isFreePortion?: boolean;
};

/**
 * 1 equivalencia SMAE for catalog foods only.
 * Sources: https://www.sistemadigitaldealimentos.org/equivalentes/grupo/*
 * Unlisted catalog foods are left unchanged (no guessed portions).
 */
export const SMAE_EQUIVALENTS_BY_NAME: Record<string, SmaeEquivalentPatch> = {
    // PROTEINAS — origen animal + soja (leguminosas)
    'Atún en aceite': {
        gramsPerEquivalent: 30,
        equivalentDisplayText: '1/3 lata'
    },
    'Atún en agua': {
        gramsPerEquivalent: 30,
        equivalentDisplayText: '1/3 lata'
    },
    'Tronco de atún': {
        gramsPerEquivalent: 30,
        equivalentDisplayText: '1/3 lata'
    },
    'Bistec de res': {gramsPerEquivalent: 35},
    'Carne molida de res': {gramsPerEquivalent: 30},
    'Carne molida de pollo': {gramsPerEquivalent: 30},
    'Clara de huevo': {
        gramsPerEquivalent: 66,
        equivalentDisplayText: '2 pzas'
    },
    'Filete de pescado': {gramsPerEquivalent: 40},
    'Filete de res': {gramsPerEquivalent: 30},
    Huachinango: {gramsPerEquivalent: 36},
    'Huevo entero': {
        gramsPerEquivalent: 50,
        equivalentDisplayText: '1 pza'
    },
    'Huevo estrellado': {
        gramsPerEquivalent: 46,
        equivalentDisplayText: '1 pza'
    },
    'Lata de salmón': {gramsPerEquivalent: 30},
    'Lomo de cerdo': {gramsPerEquivalent: 30},
    'Muslo de pollo': {
        gramsPerEquivalent: 26,
        equivalentDisplayText: '1/4 pza'
    },
    'Pechuga de pavo': {
        gramsPerEquivalent: 42,
        equivalentDisplayText: '2 rebanadas'
    },
    'Pechuga de pollo': {gramsPerEquivalent: 30},
    Robalo: {gramsPerEquivalent: 30},
    Salmón: {gramsPerEquivalent: 30},
    'Soja texturizada': {
        gramsPerEquivalent: 30,
        equivalentDisplayText: '1/3 taza'
    },
    Trucha: {gramsPerEquivalent: 30},

    // LACTEOS (queso panela is listed under origen animal in SMAE)
    'Queso panela': {
        gramsPerEquivalent: 40,
        equivalentDisplayText: '1 rebanada'
    },

    // GRASAS
    'Aceite de canola': {
        gramsPerEquivalent: 5,
        equivalentDisplayText: '1 cdita'
    },
    'Aceite de oliva': {
        gramsPerEquivalent: 5,
        equivalentDisplayText: '1 cdita'
    },
    Aguacate: {
        gramsPerEquivalent: 31,
        equivalentDisplayText: '1/3 pza'
    },

    // FRUTOS SECOS (SMAE grasas)
    Almendra: {
        gramsPerEquivalent: 10,
        equivalentDisplayText: '10 pzas'
    },
    'Almendras fileteadas': {gramsPerEquivalent: 9},
    Avellana: {
        gramsPerEquivalent: 8,
        equivalentDisplayText: '8 pzas'
    },
    'Nuez de castilla': {
        gramsPerEquivalent: 9,
        equivalentDisplayText: '3 pzas'
    },
    Pistache: {gramsPerEquivalent: 13},

    // SEMILLAS (SMAE grasas / frutas)
    'Aceituna negra': {
        gramsPerEquivalent: 32,
        equivalentDisplayText: '5 pzas'
    },
    'Aceituna verde': {
        gramsPerEquivalent: 32,
        equivalentDisplayText: '5 pzas'
    },
    Coco: {
        gramsPerEquivalent: 100,
        equivalentDisplayText: '1/4 pza'
    },
    'Semillas de sésamo': {
        gramsPerEquivalent: 10,
        equivalentDisplayText: '4 cditas'
    },

    // CEREALES
    'Arroz basmati': {
        gramsPerEquivalent: 50,
        equivalentDisplayText: '1/4 taza'
    },
    'Arroz integral': {
        gramsPerEquivalent: 50,
        equivalentDisplayText: '1/4 taza'
    },
    Avena: {
        gramsPerEquivalent: 20,
        equivalentDisplayText: '1/2 taza'
    },
    'Granos de elote': {
        gramsPerEquivalent: 83,
        equivalentDisplayText: '1/2 taza'
    },
    'Palomitas naturales': {
        gramsPerEquivalent: 36,
        equivalentDisplayText: '2 tazas'
    },
    'Pan blanco': {
        gramsPerEquivalent: 30,
        equivalentDisplayText: '1 pza'
    },
    'Pan integral': {
        gramsPerEquivalent: 35,
        equivalentDisplayText: '1 pza'
    },
    'Pasta blanca': {
        gramsPerEquivalent: 60,
        equivalentDisplayText: '1/2 taza'
    },
    'Pasta integral': {gramsPerEquivalent: 56},
    Quinoa: {
        gramsPerEquivalent: 70,
        equivalentDisplayText: '1/3 taza'
    },
    'Tortilla de harina integral': {
        gramsPerEquivalent: 32,
        equivalentDisplayText: '1 pza'
    },
    'Tortilla de maíz': {
        gramsPerEquivalent: 30,
        equivalentDisplayText: '1 pza'
    },
    'Tostadas horneadas': {
        gramsPerEquivalent: 24,
        equivalentDisplayText: '1 pza'
    },

    // LEGUMINOSAS
    Chícharos: {
        gramsPerEquivalent: 40,
        equivalentDisplayText: '1/4 taza'
    },
    Edamame: {
        gramsPerEquivalent: 60,
        equivalentDisplayText: '1/4 taza'
    },
    Frijol: {
        gramsPerEquivalent: 90,
        equivalentDisplayText: '1/2 taza'
    },
    Garbanzo: {
        gramsPerEquivalent: 90,
        equivalentDisplayText: '1/2 taza'
    },
    Habas: {
        gramsPerEquivalent: 150,
        equivalentDisplayText: '2/3 taza'
    },
    Lenteja: {
        gramsPerEquivalent: 90,
        equivalentDisplayText: '1/2 taza'
    },

    // TUBERCULOS (papa/camote/yuca = cereales SMAE; jícama/zanahoria/etc = verduras)
    Papa: {
        gramsPerEquivalent: 85,
        equivalentDisplayText: '2/3 pza'
    },
    Camote: {
        gramsPerEquivalent: 60,
        equivalentDisplayText: '1/4 taza'
    },
    Yuca: {gramsPerEquivalent: 38},
    Jícama: {
        gramsPerEquivalent: 50,
        equivalentDisplayText: '1/2 taza'
    },
    Betabel: {
        gramsPerEquivalent: 39,
        equivalentDisplayText: '1/4 pza'
    },
    Zanahoria: {
        gramsPerEquivalent: 40,
        equivalentDisplayText: '1/2 taza'
    },
    Rabano: {
        gramsPerEquivalent: 117,
        equivalentDisplayText: '1 taza'
    },

    // FRUTAS
    Durazno: {
        gramsPerEquivalent: 156,
        equivalentDisplayText: '2 pzas'
    },
    Guayaba: {
        gramsPerEquivalent: 108,
        equivalentDisplayText: '3 pzas'
    },
    Kiwi: {
        gramsPerEquivalent: 102,
        equivalentDisplayText: '1 pza'
    },
    Limón: {
        gramsPerEquivalent: 150,
        equivalentDisplayText: '5 pzas'
    },
    Mandarina: {
        gramsPerEquivalent: 128,
        equivalentDisplayText: '2 pzas'
    },
    Mango: {
        gramsPerEquivalent: 90,
        equivalentDisplayText: '1/2 pza'
    },
    Manzana: {
        gramsPerEquivalent: 106,
        equivalentDisplayText: '1 pza'
    },
    Melón: {
        gramsPerEquivalent: 160,
        equivalentDisplayText: '1 taza'
    },
    Naranja: {
        gramsPerEquivalent: 152,
        equivalentDisplayText: '2 pzas'
    },
    Papaya: {
        gramsPerEquivalent: 150,
        equivalentDisplayText: '1 taza'
    },
    Pera: {
        gramsPerEquivalent: 97,
        equivalentDisplayText: '1/2 pza'
    },
    Piña: {
        gramsPerEquivalent: 114,
        equivalentDisplayText: '3/4 taza'
    },
    Plátano: {
        gramsPerEquivalent: 60,
        equivalentDisplayText: '1/2 pza'
    },
    Sandía: {
        gramsPerEquivalent: 180,
        equivalentDisplayText: '1 taza'
    },
    Uva: {
        gramsPerEquivalent: 84,
        equivalentDisplayText: '14 pzas'
    },

    // FRUTOS ROJOS — porción libre en el plan
    Arándano: {isFreePortion: true},
    Cereza: {isFreePortion: true},
    Frambuesa: {isFreePortion: true},
    Fresa: {isFreePortion: true},
    Grosella: {isFreePortion: true},
    Mora: {isFreePortion: true},
    Zarzamora: {isFreePortion: true}
};

import type {PrismaClient} from '@prisma/client';

export async function applySmaeEquivalentsToExistingFoods(
    prisma: PrismaClient
) {
    const foods = await prisma.food.findMany({
        select: {
            id: true,
            name: true,
            group: {select: {name: true}}
        },
        orderBy: {name: 'asc'}
    });

    const matched: string[] = [];
    const unmatched: Array<{name: string; group: string}> = [];

    for (const food of foods) {
        const patch = SMAE_EQUIVALENTS_BY_NAME[food.name];
        if (!patch) {
            unmatched.push({name: food.name, group: food.group.name});
            continue;
        }

        await prisma.food.update({
            where: {id: food.id},
            data: {
                gramsPerEquivalent: patch.gramsPerEquivalent ?? null,
                equivalentDisplayText: patch.equivalentDisplayText ?? null,
                isFreePortion: patch.isFreePortion ?? false
            }
        });
        matched.push(food.name);
    }

    return {matched, unmatched};
}
