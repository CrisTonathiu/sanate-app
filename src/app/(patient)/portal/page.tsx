import {
    User,
    CalendarDays,
    FileText,
    Activity,
    Pill,
    MessageSquare,
    ShoppingBag,
    Video
} from 'lucide-react';
import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {prisma} from '@/lib/prisma';
import {CalorieProgress} from '@/components/widgets/patient-portal/CalorieProgress';
import {LogoutButton} from '@/components/widgets/patient-portal/LogoutButton';
import {WeekSelector} from '@/components/widgets/patient-portal/WeekSelector';
import {MealSlider} from '@/components/widgets/patient-portal/MealSlider';
import Link from 'next/link';
import PortalHeader from '@/components/widgets/patient-portal/PortalHeader';
import {calculateRecipeNutrition} from '@/lib/patient-portal/calculate-recipe-nutrition';
import {
    mapProtocolDayMealsToSliderRecipes,
    sortProtocolMealsByPlanOrder,
    validateProtocolWeekDays,
    type MealSliderRecipe
} from '@/lib/patient-portal/protocol-meal-slider-map';
import {AffiliateProducts} from '@/components/widgets/patient-portal/AffiliateProducts';
import type {AffiliateLink} from '@/components/widgets/profile-details/AffiliateLinksCard';

const DAY_SHORT_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MEAL_LABELS: Record<string, string> = {
    BREAKFAST: 'Desayuno',
    SNACK1: 'Colacion',
    LUNCH: 'Comida',
    SNACK2: 'Colacion',
    DINNER: 'Cena',
    SMOOTHIE: 'Licuado',
    DRINKS: 'Bebidas'
};

const MEAL_TIMES: Record<string, string> = {
    BREAKFAST: '7:00 - 9:00',
    SNACK1: '10:00 - 11:00',
    LUNCH: '12:00 - 14:00',
    SNACK2: '16:00 - 17:00',
    DINNER: '18:00 - 20:00',
    SMOOTHIE: '9:00 - 10:00',
    DRINKS: 'Cualquier hora'
};

function parseAffiliateLinks(value: unknown): AffiliateLink[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(
        (item): item is AffiliateLink =>
            typeof item === 'object' &&
            item !== null &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.url === 'string' &&
            item.name.trim().length > 0 &&
            item.url.trim().length > 0
    );
}

function getMondayOfCurrentWeek(now: Date) {
    const start = new Date(now);
    const mondayIndex = (now.getDay() + 6) % 7;
    start.setDate(now.getDate() - mondayIndex);
    return start;
}

async function getPortalData() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'PATIENT') {
        return null;
    }

    const patient = await prisma.patient.findUnique({
        where: {userId: user.id},
        select: {
            id: true,
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true
                }
            }
        }
    });

    if (!patient) {
        return null;
    }

    const protocol = await prisma.protocol.findFirst({
        where: {
            patientId: patient.id,
            status: 'ACTIVE'
        },
        orderBy: {createdAt: 'desc'},
        select: {
            affiliateLinks: true,
            weeksPlan: {
                orderBy: {weekNumber: 'asc'},
                take: 1,
                select: {
                    days: {
                        orderBy: {dayIndex: 'asc'},
                        select: {
                            id: true,
                            dayIndex: true,
                            meals: {
                                select: {
                                    id: true,
                                    mealType: true,
                                    recipe: {
                                        select: {
                                            id: true,
                                            title: true,
                                            imageUrl: true,
                                            ingredients: {
                                                select: {
                                                    grams: true,
                                                    quantity: true,
                                                    unit: true,
                                                    ingredient: {
                                                        select: {
                                                            name: true,
                                                            food: {
                                                                select: {
                                                                    caloriesPer100g: true,
                                                                    proteinPer100g: true,
                                                                    carbsPer100g: true,
                                                                    fatPer100g: true
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            },
                                            extraIngredients: {
                                                select: {
                                                    name: true
                                                }
                                            },
                                            steps: {
                                                select: {
                                                    stepNumber: true,
                                                    instruction: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!protocol) {
        return null;
    }

    const days = protocol.weeksPlan[0]?.days ?? [];
    validateProtocolWeekDays(days);
    const monday = getMondayOfCurrentWeek(new Date());

    const weekDays = Array.from({length: 7}, (_, dayIndex) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + dayIndex);

        return {
            dayName: DAY_SHORT_NAMES[dayIndex] || `Dia ${dayIndex + 1}`,
            date: date.getDate()
        };
    });

    const todayIndex = (new Date().getDay() + 6) % 7;
    const selectedDay =
        days.find(day => day.dayIndex === todayIndex) ??
        days.find(day => day.dayIndex === 0) ??
        days[0];

    const sortedMealsForDay = sortProtocolMealsByPlanOrder(
        (selectedDay?.meals ?? []).filter(meal => Boolean(meal.recipe))
    );

    const sliderRecipes: MealSliderRecipe[] =
        mapProtocolDayMealsToSliderRecipes(
            selectedDay?.meals ?? [],
            MEAL_TIMES
        );

    const menu = sortedMealsForDay.map(meal => {
        const recipe = meal.recipe!;
        const nutrition = calculateRecipeNutrition(recipe.ingredients);

        return {
            id: meal.id,
            name: MEAL_LABELS[meal.mealType] || meal.mealType,
            iconName: meal.mealType,
            time: MEAL_TIMES[meal.mealType] || 'Cualquier hora',
            calories: Math.round(nutrition.calories),
            items: [
                ...recipe.ingredients.map(item => item.ingredient.name),
                ...recipe.extraIngredients.map(item => item.name)
            ]
        };
    });

    const totals = menu.reduce(
        (acc, meal) => {
            acc.calories += meal.calories;
            return acc;
        },
        {calories: 0}
    );

    const protein = menu.reduce((sum, meal) => {
        const mealRecord = selectedDay?.meals.find(item => item.id === meal.id);
        if (!mealRecord?.recipe) return sum;
        const nutrition = calculateRecipeNutrition(
            mealRecord.recipe.ingredients
        );
        return sum + nutrition.protein;
    }, 0);

    const carbs = menu.reduce((sum, meal) => {
        const mealRecord = selectedDay?.meals.find(item => item.id === meal.id);
        if (!mealRecord?.recipe) return sum;
        const nutrition = calculateRecipeNutrition(
            mealRecord.recipe.ingredients
        );
        return sum + nutrition.carbs;
    }, 0);

    const fat = menu.reduce((sum, meal) => {
        const mealRecord = selectedDay?.meals.find(item => item.id === meal.id);
        if (!mealRecord?.recipe) return sum;
        const nutrition = calculateRecipeNutrition(
            mealRecord.recipe.ingredients
        );
        return sum + nutrition.fat;
    }, 0);

    const affiliateLinks = parseAffiliateLinks(protocol.affiliateLinks);

    return {
        patient,
        weekDays,
        todayIndex,
        menu,
        totals: {
            calories: Math.round(totals.calories),
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fat: Math.round(fat)
        },
        sliderRecipes,
        affiliateLinks
    };
}

const portalCards = [
    {
        title: 'Informacion personal',
        description: 'Consulta y actualiza los detalles de tu perfil',
        icon: User,
        path: '/portal/perfil'
    },
    {
        title: 'Videos',
        description: 'Accede a videos educativos sobre nutricion y bienestar',
        icon: Video,
        path: '/portal/videos'
    },
    {
        title: 'Documentos',
        description: 'Accede a tus expedientes y reportes medicos',
        icon: FileText,
        path: '/portal/documentos'
    },
    {
        title: 'Lista de compras',
        description: 'Lista de compras basada en tu plan de comidas',
        icon: ShoppingBag,
        path: '/portal/compras'
    }
];

export default async function PatientPortal() {
    const data = await getPortalData();

    const patientName = data
        ? `${data.patient.user.firstName} ${data.patient.user.lastName}`.trim()
        : 'Paciente';

    return (
        <main className='min-h-screen bg-background'>
            <div className='mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8'>
                <PortalHeader
                    avatarUrl={data?.patient.user.avatarUrl ?? ''}
                    name={patientName}
                />

                {data ? (
                    <div className='mt-6'>
                        <CalorieProgress
                            consumed={data.totals.calories}
                            goal={data.totals.calories}
                            logs={data.menu.length}
                            protein={{
                                current: data.totals.protein,
                                max: data.totals.protein
                            }}
                            carbs={{
                                current: data.totals.carbs,
                                max: data.totals.carbs
                            }}
                            fat={{
                                current: data.totals.fat,
                                max: data.totals.fat
                            }}
                        />

                        <section className='mt-8'>
                            <WeekSelector
                                days={data.weekDays}
                                initialSelectedIndex={data.todayIndex || 0}
                            />
                        </section>

                        <section
                            className='mt-8'
                            data-slider-meals={data.sliderRecipes.length}
                            key={data.sliderRecipes.map(r => r.id).join('|')}>
                            <MealSlider recipes={data.sliderRecipes} />
                        </section>
                    </div>
                ) : null}

                <AffiliateProducts
                    affiliateLinks={data?.affiliateLinks ?? []}
                />

                <section className='mt-8'>
                    <div className='mb-4 flex items-center justify-between'>
                        <div>
                            <h2 className='text-lg font-semibold text-foreground'>
                                Productos recomendados
                            </h2>
                            <p className='text-sm text-muted-foreground'></p>
                        </div>
                    </div>

                    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                        {portalCards.map(card => (
                            <Link
                                href={card.path}
                                key={card.title}
                                className='group cursor-pointer rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md'>
                                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10'>
                                    <card.icon className='h-6 w-6 text-primary' />
                                </div>
                                <h2 className='text-lg font-medium text-card-foreground'>
                                    {card.title}
                                </h2>
                                <p className='mt-1 text-sm text-muted-foreground'>
                                    {card.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
