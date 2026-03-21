import {prisma} from '../src/lib/prisma';
type FoodMacro = {
    name: string;
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
};

async function main() {
    const allergens = [
        {
            name: 'Gluten',
            description: 'Proteína presente en trigo, cebada y centeno'
        },
        {name: 'Trigo', description: 'Alergia específica al trigo'},
        {name: 'Cebada', description: 'Alergia o sensibilidad a la cebada'},
        {name: 'Centeno', description: 'Alergia o sensibilidad al centeno'},
        {
            name: 'Avena',
            description:
                'Posible sensibilidad a avena o avena contaminada con gluten'
        },

        {
            name: 'Lactosa',
            description: 'Azúcar presente en la leche y productos lácteos'
        },
        {name: 'Leche', description: 'Alergia a la proteína de la leche'},
        {name: 'Caseína', description: 'Proteína presente en la leche'},
        {
            name: 'Suero de leche (Whey)',
            description: 'Proteína del suero de la leche'
        },

        {
            name: 'Huevo',
            description: 'Alergia a proteínas presentes en el huevo'
        },
        {
            name: 'Clara de huevo',
            description: 'Alergia a la proteína de la clara'
        },
        {
            name: 'Yema de huevo',
            description: 'Alergia a proteínas presentes en la yema'
        },

        {name: 'Maní', description: 'Alergia al cacahuate o maní'},

        {
            name: 'Nueces de árbol',
            description: 'Incluye almendras, nueces, pistaches, etc.'
        },
        {name: 'Almendra', description: 'Alergia específica a la almendra'},
        {name: 'Nuez', description: 'Alergia a nuez común'},
        {name: 'Avellana', description: 'Alergia a avellanas'},
        {name: 'Pistache', description: 'Alergia a pistaches'},
        {name: 'Anacardo (Cashew)', description: 'Alergia a anacardos'},
        {name: 'Nuez de macadamia', description: 'Alergia a nuez de macadamia'},
        {name: 'Nuez de Brasil', description: 'Alergia a nuez de Brasil'},
        {name: 'Piñones', description: 'Alergia a piñones'},

        {name: 'Soya', description: 'Alergia a la soya'},
        {
            name: 'Lecitina de soya',
            description: 'Derivado de soya presente en alimentos procesados'
        },

        {name: 'Pescado', description: 'Alergia a pescado'},
        {name: 'Atún', description: 'Alergia específica al atún'},
        {name: 'Salmón', description: 'Alergia específica al salmón'},
        {name: 'Bacalao', description: 'Alergia específica al bacalao'},

        {
            name: 'Mariscos',
            description:
                'Alergia a crustáceos como camarón, langosta o cangrejo'
        },
        {name: 'Camarón', description: 'Alergia al camarón'},
        {name: 'Langosta', description: 'Alergia a la langosta'},
        {name: 'Cangrejo', description: 'Alergia al cangrejo'},

        {
            name: 'Moluscos',
            description:
                'Alergia a moluscos como almejas, mejillones o ostiones'
        },
        {name: 'Almejas', description: 'Alergia a almejas'},
        {name: 'Mejillones', description: 'Alergia a mejillones'},
        {name: 'Ostiones', description: 'Alergia a ostiones'},
        {name: 'Calamar', description: 'Alergia al calamar'},
        {name: 'Pulpo', description: 'Alergia al pulpo'},

        {name: 'Sésamo', description: 'Alergia a semillas de sésamo'},
        {name: 'Mostaza', description: 'Alergia a mostaza'},
        {name: 'Apio', description: 'Alergia al apio'},
        {name: 'Altramuz', description: 'Alergia al lupino (lupin)'},

        {name: 'Maíz', description: 'Alergia al maíz'},
        {name: 'Arroz', description: 'Alergia al arroz'},

        {name: 'Tomate', description: 'Alergia al tomate'},
        {name: 'Fresa', description: 'Alergia a la fresa'},
        {name: 'Kiwi', description: 'Alergia al kiwi'},
        {name: 'Plátano', description: 'Alergia al plátano'},
        {name: 'Aguacate', description: 'Alergia al aguacate'},
        {name: 'Piña', description: 'Alergia a la piña'},
        {name: 'Mango', description: 'Alergia al mango'},

        {name: 'Ajo', description: 'Alergia al ajo'},
        {name: 'Cebolla', description: 'Alergia a la cebolla'},

        {name: 'Chocolate', description: 'Alergia o sensibilidad al cacao'},
        {name: 'Cacao', description: 'Alergia al cacao'},

        {
            name: 'Colorantes artificiales',
            description: 'Sensibilidad a colorantes alimentarios'
        },
        {
            name: 'Tartrazina',
            description:
                'Colorante alimentario amarillo asociado a reacciones alérgicas'
        },

        {
            name: 'Sulfitos',
            description: 'Conservadores usados en alimentos y bebidas'
        },
        {
            name: 'Benzoato de sodio',
            description: 'Conservador alimentario que puede causar reacciones'
        }
    ];

    for (const allergen of allergens) {
        await prisma.allergen.create({
            data: allergen
        });
    }

    const conditions = [
        {
            name: 'Diabetes tipo 1',
            description:
                'Enfermedad autoinmune que afecta la producción de insulina'
        },
        {
            name: 'Diabetes tipo 2',
            description:
                'Resistencia a la insulina y niveles elevados de glucosa'
        },
        {
            name: 'Prediabetes',
            description:
                'Niveles de glucosa elevados pero no lo suficiente para diagnóstico de diabetes'
        },

        {name: 'Hipertensión', description: 'Presión arterial elevada'},
        {name: 'Hipotensión', description: 'Presión arterial baja'},

        {
            name: 'Obesidad',
            description: 'Exceso de grasa corporal que afecta la salud'
        },
        {
            name: 'Sobrepeso',
            description:
                'Peso corporal superior al recomendado para la estatura'
        },

        {
            name: 'Dislipidemia',
            description: 'Niveles anormales de colesterol o triglicéridos'
        },
        {name: 'Colesterol alto', description: 'Elevación del colesterol LDL'},
        {
            name: 'Triglicéridos altos',
            description: 'Elevación de triglicéridos en sangre'
        },

        {
            name: 'Síndrome metabólico',
            description:
                'Conjunto de condiciones que aumentan el riesgo cardiovascular'
        },

        {
            name: 'Enfermedad renal crónica',
            description: 'Deterioro progresivo de la función renal'
        },
        {
            name: 'Insuficiencia renal',
            description: 'Pérdida significativa de la función renal'
        },

        {
            name: 'Hígado graso',
            description: 'Acumulación de grasa en el hígado'
        },
        {
            name: 'Enfermedad hepática',
            description: 'Alteraciones en la función del hígado'
        },

        {
            name: 'Síndrome de intestino irritable',
            description: 'Trastorno gastrointestinal funcional'
        },
        {
            name: 'Enfermedad celíaca',
            description: 'Respuesta inmunitaria al gluten'
        },
        {
            name: 'Intolerancia al gluten',
            description: 'Sensibilidad al gluten sin ser enfermedad celíaca'
        },
        {
            name: 'Intolerancia a la lactosa',
            description: 'Dificultad para digerir lactosa'
        },

        {
            name: 'Gastritis',
            description: 'Inflamación del revestimiento del estómago'
        },
        {
            name: 'Reflujo gastroesofágico',
            description: 'Ácido estomacal que regresa al esófago'
        },

        {
            name: 'Anemia',
            description: 'Disminución de glóbulos rojos o hemoglobina'
        },
        {
            name: 'Deficiencia de hierro',
            description: 'Bajos niveles de hierro en el organismo'
        },

        {
            name: 'Hipotiroidismo',
            description: 'Producción insuficiente de hormonas tiroideas'
        },
        {
            name: 'Hipertiroidismo',
            description: 'Producción excesiva de hormonas tiroideas'
        },

        {
            name: 'Síndrome de ovario poliquístico',
            description:
                'Trastorno hormonal que afecta a mujeres en edad reproductiva'
        },

        {name: 'Osteoporosis', description: 'Disminución de la densidad ósea'},
        {name: 'Artritis', description: 'Inflamación de las articulaciones'},

        {
            name: 'Alergias alimentarias',
            description: 'Reacción del sistema inmunológico a ciertos alimentos'
        }
    ];

    for (const condition of conditions) {
        await prisma.condition.create({
            data: condition
        });
    }

    // 🧱 Crear FoodGroups
    const foodGroups = [
        {name: 'VEGETALES', isFree: true},
        {name: 'FRUTAS', isFree: false},
        {name: 'CEREALES', isFree: false},
        {name: 'LEGUMINOSAS', isFree: false},
        {name: 'TUBERCULOS', isFree: false},
        {name: 'PROTEINAS', isFree: false},
        {name: 'LACTEOS', isFree: false},
        {name: 'GRASAS', isFree: false},
        {name: 'BEBIDAS', isFree: false},
        {name: 'LIQUADOS', isFree: false},
        {name: 'FRUTOS ROJOS', isFree: false},
        {name: 'SEMILLAS', isFree: false},
        {name: 'FRUTOS SECOS', isFree: false},
        {name: 'OTROS', isFree: false}
    ];

    for (const group of foodGroups) {
        await prisma.foodGroup.create({
            data: group
        });
    }

    // Get food groups for reference
    const foodGroupMap: {[key: string]: string} = {};
    const allGroups = await prisma.foodGroup.findMany();
    for (const group of allGroups) {
        foodGroupMap[group.name] = group.id;
    }

    // PROTEÍNAS
    const proteins = [
        {name: 'Bistec de res', protein: 26, carbs: 0, fat: 15, calories: 250},
        {name: 'Camarones', protein: 24, carbs: 0.2, fat: 0.3, calories: 99},
        {
            name: 'Carne molida de pollo',
            protein: 27,
            carbs: 0,
            fat: 8,
            calories: 180
        },
        {
            name: 'Carne molida de res',
            protein: 26,
            carbs: 0,
            fat: 20,
            calories: 290
        },
        {
            name: 'Filete de pescado',
            protein: 22,
            carbs: 0,
            fat: 5,
            calories: 120
        },
        {name: 'Huevo entero', protein: 13, carbs: 1.1, fat: 11, calories: 155},
        {
            name: 'Huevo estrellado',
            protein: 6.3,
            carbs: 0.38,
            fat: 6.8,
            calories: 90
        },
        {name: 'Lata de salmón', protein: 25, carbs: 0, fat: 13, calories: 200},
        {
            name: 'Pechuga de pollo',
            protein: 31,
            carbs: 0,
            fat: 3.6,
            calories: 165
        },
        {name: 'Salmón', protein: 25, carbs: 0, fat: 13, calories: 208},
        {name: 'Tronco de atún', protein: 29, carbs: 0, fat: 1, calories: 130},
        {name: 'Tofu', protein: 8, carbs: 2, fat: 5, calories: 76},
        {
            name: 'Soja texturizada',
            protein: 50,
            carbs: 30,
            fat: 1,
            calories: 330
        },
        {name: 'Pechuga de pavo', protein: 29, carbs: 0, fat: 1, calories: 135},
        {name: 'Muslo de pollo', protein: 24, carbs: 0, fat: 10, calories: 209},
        {name: 'Filete de res', protein: 26, carbs: 0, fat: 15, calories: 250},
        {name: 'Atún en agua', protein: 26, carbs: 0, fat: 1, calories: 116},
        {name: 'Atún en aceite', protein: 25, carbs: 0, fat: 8, calories: 198},
        {name: 'Lomo de cerdo', protein: 27, carbs: 0, fat: 14, calories: 242},
        {name: 'Trucha', protein: 20, carbs: 0, fat: 6, calories: 140},
        {name: 'Tilapia', protein: 26, carbs: 0, fat: 2.7, calories: 128},
        {name: 'Huachinango', protein: 22, carbs: 0, fat: 3, calories: 110},
        {name: 'Robalo', protein: 20, carbs: 0, fat: 2, calories: 97},
        {name: 'Bacalao', protein: 18, carbs: 0, fat: 0.7, calories: 82},
        {
            name: 'Clara de huevo',
            protein: 11,
            carbs: 0.7,
            fat: 0.2,
            calories: 52
        }
    ];

    for (const protein of proteins) {
        const proteinFoodData = {
            name: protein.name,
            groupId: foodGroupMap['PROTEINAS'],
            proteinPer100g: protein.protein,
            carbsPer100g: protein.carbs,
            fatPer100g: protein.fat,
            caloriesPer100g: protein.calories
        };

        await prisma.food.create({
            data: proteinFoodData
        });
    }

    // FRUTOS ROJOS
    const redFruits = [
        {name: 'Fresa', protein: 0.7, carbs: 7.7, fat: 0.3, calories: 32},
        {name: 'Frambuesa', protein: 1.2, carbs: 12, fat: 0.7, calories: 52},
        {name: 'Cereza', protein: 1.0, carbs: 16, fat: 0.3, calories: 63},
        {name: 'Arándano', protein: 0.7, carbs: 14, fat: 0.3, calories: 57},
        {name: 'Mora', protein: 1.4, carbs: 10, fat: 0.5, calories: 43},
        {name: 'Grosella', protein: 1.4, carbs: 15, fat: 0.2, calories: 56},
        {name: 'Zarzamora', protein: 1.4, carbs: 10, fat: 0.5, calories: 43}
    ];

    for (const fruit of redFruits) {
        const fruitFoodData = {
            name: fruit.name,
            groupId: foodGroupMap['FRUTOS ROJOS'],
            proteinPer100g: fruit.protein,
            carbsPer100g: fruit.carbs,
            fatPer100g: fruit.fat,
            caloriesPer100g: fruit.calories
        };
        await prisma.food.create({
            data: fruitFoodData
        });
    }

    // FRUTAS
    const fruits = [
        {name: 'Manzana', protein: 0.3, carbs: 14, fat: 0.2, calories: 52},
        {name: 'Plátano', protein: 1.3, carbs: 23, fat: 0.3, calories: 89},
        {name: 'Naranja', protein: 0.9, carbs: 12, fat: 0.1, calories: 47},
        {name: 'Pera', protein: 0.4, carbs: 15, fat: 0.1, calories: 57},
        {name: 'Melón', protein: 0.8, carbs: 8, fat: 0.2, calories: 34},
        {name: 'Mango', protein: 0.8, carbs: 15, fat: 0.4, calories: 60},
        {name: 'Papaya', protein: 0.5, carbs: 11, fat: 0.3, calories: 43},
        {name: 'Piña', protein: 0.5, carbs: 13, fat: 0.1, calories: 50},
        {name: 'Sandía', protein: 0.6, carbs: 8, fat: 0.2, calories: 30},
        {name: 'Uva', protein: 0.6, carbs: 17, fat: 0.2, calories: 69},
        {name: 'Durazno', protein: 0.9, carbs: 10, fat: 0.3, calories: 39},
        {name: 'Toronja', protein: 0.8, carbs: 8, fat: 0.1, calories: 42},
        {name: 'Mandarina', protein: 0.8, carbs: 13, fat: 0.3, calories: 53},
        {name: 'Limón', protein: 1.1, carbs: 9, fat: 0.3, calories: 29},
        {name: 'Guayaba', protein: 2.6, carbs: 14, fat: 1.0, calories: 68},
        {name: 'Kiwi', protein: 1.1, carbs: 15, fat: 0.5, calories: 61}
    ];

    for (const fruit of fruits) {
        const fruitFoodData = {
            name: fruit.name,
            groupId: foodGroupMap['FRUTAS'],
            proteinPer100g: fruit.protein,
            carbsPer100g: fruit.carbs,
            fatPer100g: fruit.fat,
            caloriesPer100g: fruit.calories
        };
        await prisma.food.create({
            data: fruitFoodData
        });
    }

    // CEREALES
    const cereals = [
        {
            name: 'Arroz integral',
            protein: 2.6,
            carbs: 23,
            fat: 0.9,
            calories: 111
        },
        {
            name: 'Arroz basmati',
            protein: 2.7,
            carbs: 25,
            fat: 0.3,
            calories: 121
        },
        {
            name: 'Pasta integral',
            protein: 5,
            carbs: 30,
            fat: 1.1,
            calories: 150
        },
        {name: 'Pasta blanca', protein: 5, carbs: 31, fat: 1, calories: 158},
        {name: 'Tortilla de maíz', protein: 2, carbs: 12, fat: 1, calories: 60},
        {
            name: 'Tortilla de harina integral',
            protein: 6,
            carbs: 45,
            fat: 5,
            calories: 250
        },
        {name: 'Quinoa', protein: 4.4, carbs: 21, fat: 1.9, calories: 120},
        {name: 'Avena', protein: 17, carbs: 66, fat: 7, calories: 389},
        {name: 'Pan integral', protein: 13, carbs: 41, fat: 4, calories: 247},
        {name: 'Pan blanco', protein: 9, carbs: 49, fat: 3, calories: 265},
        {
            name: 'Pan pita integral',
            protein: 9,
            carbs: 55,
            fat: 1.2,
            calories: 275
        },
        {
            name: 'Pan pita normal',
            protein: 9,
            carbs: 56,
            fat: 1.2,
            calories: 275
        },
        {
            name: 'Granos de elote',
            protein: 3.4,
            carbs: 19,
            fat: 1.5,
            calories: 96
        },
        {
            name: 'Tostadas horneadas',
            protein: 7,
            carbs: 73,
            fat: 5,
            calories: 380
        },
        {
            name: 'Tostadas de nopal',
            protein: 2,
            carbs: 10,
            fat: 1,
            calories: 50
        },
        {
            name: 'Palomitas naturales',
            protein: 13,
            carbs: 78,
            fat: 4.5,
            calories: 387
        }
    ];

    for (const cereal of cereals) {
        const cerealFoodData = {
            name: cereal.name,
            groupId: foodGroupMap['CEREALES'],
            proteinPer100g: cereal.protein,
            carbsPer100g: cereal.carbs,
            fatPer100g: cereal.fat,
            caloriesPer100g: cereal.calories
        };

        await prisma.food.create({
            data: cerealFoodData
        });
    }

    // LEGUMINOSAS
    const legumes = [
        {name: 'Frijol', protein: 9, carbs: 27, fat: 0.5, calories: 127},
        {name: 'Habas', protein: 8, carbs: 19, fat: 0.7, calories: 110},
        {name: 'Lenteja', protein: 9, carbs: 20, fat: 0.4, calories: 116},
        {name: 'Garbanzo', protein: 8.9, carbs: 27, fat: 2.6, calories: 164},
        {name: 'Edamame', protein: 11, carbs: 10, fat: 5, calories: 121},
        {name: 'Chícharos', protein: 5, carbs: 14, fat: 0.4, calories: 81}
    ];

    for (const legume of legumes) {
        const legumeFoodData = {
            name: legume.name,
            groupId: foodGroupMap['LEGUMINOSAS'],
            proteinPer100g: legume.protein,
            carbsPer100g: legume.carbs,
            fatPer100g: legume.fat,
            caloriesPer100g: legume.calories
        };
        await prisma.food.create({
            data: legumeFoodData
        });
    }

    // TUBERCULOS
    const tubers = [
        {name: 'Papa', protein: 2, carbs: 17, fat: 0.1, calories: 77},
        {name: 'Camote', protein: 1.6, carbs: 20, fat: 0.1, calories: 86},
        {name: 'Yuca', protein: 1.4, carbs: 38, fat: 0.3, calories: 160},
        {name: 'Jícama', protein: 0.7, carbs: 9, fat: 0.1, calories: 38},
        {name: 'Betabel', protein: 1.6, carbs: 10, fat: 0.2, calories: 43},
        {name: 'Zanahoria', protein: 0.9, carbs: 10, fat: 0.2, calories: 41},
        {name: 'Rabano', protein: 0.7, carbs: 3.4, fat: 0.1, calories: 16},
        {name: 'Chirivia', protein: 1.2, carbs: 18, fat: 0.3, calories: 75}
    ];

    for (const tuber of tubers) {
        const tuberFoodData = {
            name: tuber.name,
            groupId: foodGroupMap['TUBERCULOS'],
            proteinPer100g: tuber.protein,
            carbsPer100g: tuber.carbs,
            fatPer100g: tuber.fat,
            caloriesPer100g: tuber.calories
        };
        await prisma.food.create({
            data: tuberFoodData
        });
    }

    // GRASAS
    const fats = [
        {
            name: 'Aceite de oliva',
            protein: 0,
            carbs: 0,
            fat: 100,
            calories: 884
        },
        {
            name: 'Aceite de canola',
            protein: 0,
            carbs: 0,
            fat: 100,
            calories: 884
        },
        {name: 'Ghee', protein: 0, carbs: 0, fat: 100, calories: 900},
        {name: 'Aguacate', protein: 2, carbs: 9, fat: 15, calories: 160}
    ];

    for (const fat of fats) {
        const fatFoodData = {
            name: fat.name,
            groupId: foodGroupMap['GRASAS'],
            proteinPer100g: fat.protein,
            carbsPer100g: fat.carbs,
            fatPer100g: fat.fat,
            caloriesPer100g: fat.calories
        };
        await prisma.food.create({
            data: fatFoodData
        });
    }

    // FRUTOS SECOS
    const nuts = [
        {name: 'Almendra', protein: 21, carbs: 22, fat: 49, calories: 579},
        {
            name: 'Almendras fileteadas',
            protein: 21,
            carbs: 22,
            fat: 49,
            calories: 579
        },
        {
            name: 'Nuez de castilla',
            protein: 15,
            carbs: 14,
            fat: 65,
            calories: 654
        },
        {
            name: 'Nuez de macadamia',
            protein: 8,
            carbs: 14,
            fat: 76,
            calories: 718
        },
        {name: 'Nuez brasil', protein: 14, carbs: 12, fat: 66, calories: 659},
        {name: 'Macadamias', protein: 8, carbs: 14, fat: 76, calories: 718},
        {name: 'Avellana', protein: 15, carbs: 17, fat: 61, calories: 628},
        {name: 'Pistache', protein: 20, carbs: 28, fat: 45, calories: 562}
    ];

    for (const nut of nuts) {
        const nutFoodData = {
            name: nut.name,
            groupId: foodGroupMap['FRUTOS SECOS'],
            proteinPer100g: nut.protein,
            carbsPer100g: nut.carbs,
            fatPer100g: nut.fat,
            caloriesPer100g: nut.calories
        };
        await prisma.food.create({
            data: nutFoodData
        });
    }

    // SEMILLAS
    const seeds = [
        {
            name: 'Semillas de chía',
            protein: 17,
            carbs: 42,
            fat: 31,
            calories: 486
        },
        {
            name: 'Semillas de linaza',
            protein: 18,
            carbs: 29,
            fat: 42,
            calories: 534
        },
        {
            name: 'Semillas de calabaza',
            protein: 30,
            carbs: 11,
            fat: 49,
            calories: 559
        },
        {
            name: 'Semillas de girasol',
            protein: 21,
            carbs: 20,
            fat: 51,
            calories: 584
        },
        {
            name: 'Semillas de sésamo',
            protein: 17,
            carbs: 23,
            fat: 50,
            calories: 573
        },
        {name: 'Hemp', protein: 31, carbs: 9, fat: 49, calories: 553},
        {name: 'Aceituna verde', protein: 1, carbs: 4, fat: 15, calories: 145},
        {name: 'Aceituna negra', protein: 1, carbs: 6, fat: 15, calories: 115},
        {name: 'Coco', protein: 3.3, carbs: 15, fat: 33, calories: 354}
    ];

    for (const seed of seeds) {
        const seedFoodData = {
            name: seed.name,
            groupId: foodGroupMap['SEMILLAS'],
            proteinPer100g: seed.protein,
            carbsPer100g: seed.carbs,
            fatPer100g: seed.fat,
            caloriesPer100g: seed.calories
        };
        await prisma.food.create({
            data: seedFoodData
        });
    }

    // VEGETALES
    const vegetables = [
        {name: 'Lechuga', protein: 1.4, carbs: 3, fat: 0.2, calories: 15},
        {name: 'Espinaca', protein: 2.9, carbs: 3.6, fat: 0.4, calories: 23},
        {name: 'Kale', protein: 4.3, carbs: 9, fat: 0.9, calories: 49},
        {name: 'Jitomate', protein: 0.9, carbs: 3.9, fat: 0.2, calories: 18},
        {name: 'Cebolla', protein: 1.1, carbs: 9, fat: 0.1, calories: 40},
        {name: 'Pepino', protein: 0.7, carbs: 4, fat: 0.1, calories: 16},
        {name: 'Brócoli', protein: 2.8, carbs: 7, fat: 0.4, calories: 34},
        {name: 'Coliflor', protein: 1.9, carbs: 5, fat: 0.3, calories: 25},
        {name: 'Acelgas', protein: 1.8, carbs: 3.7, fat: 0.2, calories: 19},
        {name: 'Arúgula', protein: 2.6, carbs: 3.7, fat: 0.7, calories: 25},
        {name: 'Calabaza', protein: 1.2, carbs: 3.1, fat: 0.3, calories: 17},
        {name: 'Espárragos', protein: 2.2, carbs: 3.9, fat: 0.1, calories: 20},
        {name: 'Alcachofa', protein: 3.3, carbs: 11, fat: 0.2, calories: 47},
        {name: 'Ejotes', protein: 1.8, carbs: 7, fat: 0.2, calories: 31},
        {name: 'Apio', protein: 0.7, carbs: 3, fat: 0.2, calories: 16},
        {name: 'Col', protein: 1.3, carbs: 6, fat: 0.1, calories: 25},
        {name: 'Chayotes', protein: 0.8, carbs: 4.5, fat: 0.1, calories: 19},
        {name: 'Col morada', protein: 1.4, carbs: 7, fat: 0.2, calories: 31},
        {name: 'Nopal', protein: 1.3, carbs: 3.3, fat: 0.1, calories: 16},
        {name: 'Setas', protein: 3.1, carbs: 3.3, fat: 0.3, calories: 22},
        {name: 'Champiñones', protein: 3.1, carbs: 3.3, fat: 0.3, calories: 22},
        {
            name: 'Flor de calabaza',
            protein: 1.2,
            carbs: 4,
            fat: 0.2,
            calories: 20
        },
        {name: 'Perejil', protein: 3, carbs: 6, fat: 0.8, calories: 36},
        {name: 'Cilantro', protein: 2.1, carbs: 3.7, fat: 0.5, calories: 23}
    ];

    for (const vegetable of vegetables) {
        const vegetableFoodData = {
            name: vegetable.name,
            groupId: foodGroupMap['VEGETALES'],
            proteinPer100g: vegetable.protein,
            carbsPer100g: vegetable.carbs,
            fatPer100g: vegetable.fat,
            caloriesPer100g: vegetable.calories
        };
        await prisma.food.create({
            data: vegetableFoodData
        });
    }

    console.log('✅ Seeded successfully!');
}

main()
    .catch(e => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
