import {prisma} from '../src/lib/prisma';

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
