'use client';

import PatientBreadcrumb from '@/components/widgets/profile-details/PatientBreadcrumb';
import {useRouter} from 'next/navigation';
import {AnimatePresence, motion} from 'framer-motion';
import {Button} from '@/components/ui/button';
import ProfileDetailsLoader from '@/components/loaders/ProfileDetailsLoader';
import {
    useGetPatientAllergies,
    useGetPatientConditions,
    useGetPatientProfile
} from '@/hooks/use-patients';
import {useState} from 'react';
import StepIndicator from '@/components/widgets/profile-details/StepIndicator';
import {StepKey} from '@/lib/types/patient-type';
import PatientSummaryCard from '@/components/widgets/profile-details/PatientSummaryCard';
import {getAgeFromDateString} from '@/lib/utils';
import ConsultationInputs from '@/components/widgets/profile-details/ConsultationInputs';
import {Check, ChevronLeft, ChevronRight} from 'lucide-react';
import ProtocolConfigCard, {
    GeneratePlanPayload
} from '@/components/widgets/profile-details/ProtocolConfigCard';
import {DayMeals} from '@/lib/interface/meal-interface';
import WeeklyMealPlanner from '@/components/widgets/profile-details/WeeklyMealPlanner';
import RecommendationsCard from '@/components/widgets/profile-details/RecommendationsCard';
import ProtocolPreview from '@/components/widgets/profile-details/ProtocolPreview';

interface ClientPageProps {
    patientId: string;
}

const INITIAL_WEEK_PLAN: DayMeals[] = [
    {
        day: 'Lunes',
        smoothie: {
            id: '0',
            recipeName: 'Smoothie de frutas',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 150,
            protein: 5
        },
        breakfast: {
            id: '1',
            recipeName: 'Avena con frutos rojos',
            imageUrl:
                'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=200&h=150&fit=crop',
            calories: 320,
            protein: 12
        },
        snack: {
            id: '5',
            recipeName: 'Almendras y manzana',
            imageUrl:
                'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=200&h=150&fit=crop',
            calories: 180,
            protein: 6
        },
        lunch: {
            id: '8',
            recipeName: 'Ensalada de pollo a la parrilla',
            imageUrl:
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop',
            calories: 420,
            protein: 35
        },
        dinner: {
            id: '11',
            recipeName: 'Salmon con vegetales',
            imageUrl:
                'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=150&fit=crop',
            calories: 450,
            protein: 38
        },
        drinks: {
            id: '14',
            recipeName: 'Agua con limón',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 0,
            protein: 0
        }
    },
    {
        day: 'Martes',
        smoothie: {
            id: '0',
            recipeName: 'Smoothie de frutas',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 150,
            protein: 5
        },
        breakfast: {
            id: '2',
            recipeName: 'Parfait de yogur griego',
            imageUrl:
                'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=150&fit=crop',
            calories: 280,
            protein: 18
        },
        snack: {
            id: '6',
            recipeName: 'Hummus con vegetales',
            imageUrl:
                'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=200&h=150&fit=crop',
            calories: 150,
            protein: 5
        },
        lunch: {
            id: '9',
            recipeName: 'Bowl de quinoa estilo Buddha',
            imageUrl:
                'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=150&fit=crop',
            calories: 480,
            protein: 18
        },
        dinner: {
            id: '12',
            recipeName: 'Salteado de carne magra',
            imageUrl:
                'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=200&h=150&fit=crop',
            calories: 520,
            protein: 32
        },
        drinks: {
            id: '14',
            recipeName: 'Agua con limón',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 0,
            protein: 0
        }
    },
    {
        day: 'Miércoles',
        smoothie: {
            id: '0',
            recipeName: 'Smoothie de frutas',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 150,
            protein: 5
        },
        breakfast: {
            id: '3',
            recipeName: 'Tostada de aguacate',
            imageUrl:
                'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=200&h=150&fit=crop',
            calories: 350,
            protein: 14
        },
        snack: {
            id: '7',
            recipeName: 'Barra de proteina',
            imageUrl:
                'https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=200&h=150&fit=crop',
            calories: 200,
            protein: 15
        },
        lunch: {
            id: '10',
            recipeName: 'Wrap de pavo',
            imageUrl:
                'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=150&fit=crop',
            calories: 380,
            protein: 28
        },
        dinner: {
            id: '13',
            recipeName: 'Tacos de pescado a la parrilla',
            imageUrl:
                'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=200&h=150&fit=crop',
            calories: 380,
            protein: 28
        },
        drinks: {
            id: '14',
            recipeName: 'Agua con limón',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 0,
            protein: 0
        }
    },
    {
        day: 'Jueves',
        smoothie: {
            id: '0',
            recipeName: 'Smoothie de frutas',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 150,
            protein: 5
        },
        breakfast: {
            id: '4',
            recipeName: 'Bowl de batido',
            imageUrl:
                'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200&h=150&fit=crop',
            calories: 290,
            protein: 8
        },
        snack: {
            id: '5',
            recipeName: 'Almendras y manzana',
            imageUrl:
                'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=200&h=150&fit=crop',
            calories: 180,
            protein: 6
        },
        lunch: {
            id: '8',
            recipeName: 'Ensalada de pollo a la parrilla',
            imageUrl:
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop',
            calories: 420,
            protein: 35
        },
        dinner: {
            id: '11',
            recipeName: 'Salmon con vegetales',
            imageUrl:
                'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=150&fit=crop',
            calories: 450,
            protein: 38
        },
        drinks: {
            id: '14',
            recipeName: 'Agua con limón',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 0,
            protein: 0
        }
    },
    {
        day: 'Viernes',
        smoothie: {
            id: '0',
            recipeName: 'Smoothie de frutas',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 150,
            protein: 5
        },
        breakfast: {
            id: '1',
            recipeName: 'Avena con frutos rojos',
            imageUrl:
                'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=200&h=150&fit=crop',
            calories: 320,
            protein: 12
        },
        snack: {
            id: '6',
            recipeName: 'Hummus con vegetales',
            imageUrl:
                'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=200&h=150&fit=crop',
            calories: 150,
            protein: 5
        },
        lunch: {
            id: '9',
            recipeName: 'Bowl de quinoa estilo Buddha',
            imageUrl:
                'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=150&fit=crop',
            calories: 480,
            protein: 18
        },
        dinner: {
            id: '12',
            recipeName: 'Salteado de carne magra',
            imageUrl:
                'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=200&h=150&fit=crop',
            calories: 520,
            protein: 32
        },
        drinks: {
            id: '14',
            recipeName: 'Agua con limón',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 0,
            protein: 0
        }
    },
    {
        day: 'Sábado',
        smoothie: {
            id: '0',
            recipeName: 'Smoothie de frutas',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 150,
            protein: 5
        },
        breakfast: {
            id: '2',
            recipeName: 'Parfait de yogur griego',
            imageUrl:
                'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=150&fit=crop',
            calories: 280,
            protein: 18
        },
        snack: {
            id: '7',
            recipeName: 'Barra de proteina',
            imageUrl:
                'https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=200&h=150&fit=crop',
            calories: 200,
            protein: 15
        },
        lunch: {
            id: '10',
            recipeName: 'Wrap de pavo',
            imageUrl:
                'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=150&fit=crop',
            calories: 380,
            protein: 28
        },
        dinner: {
            id: '13',
            recipeName: 'Tacos de pescado a la parrilla',
            imageUrl:
                'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=200&h=150&fit=crop',
            calories: 380,
            protein: 28
        },
        drinks: {
            id: '14',
            recipeName: 'Agua con limón',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 0,
            protein: 0
        }
    },
    {
        day: 'Domingo',
        smoothie: {
            id: '0',
            recipeName: 'Smoothie de frutas',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 150,
            protein: 5
        },
        breakfast: {
            id: '3',
            recipeName: 'Tostada de aguacate',
            imageUrl:
                'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=200&h=150&fit=crop',
            calories: 350,
            protein: 14
        },
        snack: {
            id: '5',
            recipeName: 'Almendras y manzana',
            imageUrl:
                'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=200&h=150&fit=crop',
            calories: 180,
            protein: 6
        },
        lunch: {
            id: '8',
            recipeName: 'Ensalada de pollo a la parrilla',
            imageUrl:
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop',
            calories: 420,
            protein: 35
        },
        dinner: {
            id: '11',
            recipeName: 'Salmon con vegetales',
            imageUrl:
                'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=150&fit=crop',
            calories: 450,
            protein: 38
        },
        drinks: {
            id: '14',
            recipeName: 'Agua con limón',
            imageUrl:
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=150&fit=crop',
            calories: 0,
            protein: 0
        }
    }
];

export default function PacienteProtocolClient({patientId}: ClientPageProps) {
    const router = useRouter();
    const {data: patient, isPending} = useGetPatientProfile(patientId);
    const {data: allergies = [], isPending: isPendingAllergies} =
        useGetPatientAllergies(patientId);
    const {data: conditions = [], isPending: isPendingConditions} =
        useGetPatientConditions(patientId);

    const [isFirstConsultation] = useState<boolean>(true);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [recipeModalOpen, setRecipeModalOpen] = useState<boolean>(false);
    const [includeSmoothie, setIncludeSmoothie] = useState<boolean>(false);
    const [includeDrinks, setIncludeDrinks] = useState<boolean>(false);

    const [weekPlan, setWeekPlan] = useState<DayMeals[]>(INITIAL_WEEK_PLAN);
    const [currentStep, setCurrentStep] = useState<StepKey>(1);

    const [selectedDayMeal, setSelectedDayMeal] = useState<{
        day: string;
        mealType:
            | 'smoothie'
            | 'breakfast'
            | 'snack'
            | 'lunch'
            | 'dinner'
            | 'drinks';
    } | null>(null);

    const maxStep = isFirstConsultation ? 5 : 3;

    const handleOpenRecipeModal = (
        day: string,
        mealType:
            | 'smoothie'
            | 'breakfast'
            | 'snack'
            | 'lunch'
            | 'dinner'
            | 'drinks'
    ) => {
        setSelectedDayMeal({day, mealType});
        setRecipeModalOpen(true);
    };

    const renderStepContent = () => {
        if (!patient) return null;
        if (isFirstConsultation) {
            // Create Protocol mode (5 steps)
            switch (currentStep) {
                case 1:
                    return (
                        <div className='space-y-4'>
                            <PatientSummaryCard
                                name={
                                    patient.firstName + ' ' + patient.lastName
                                }
                                age={
                                    getAgeFromDateString(patient.birthDate) || 0
                                }
                                gender={patient.gender || 'OTHER'}
                                height={patient.height || 0}
                                weight={patient.initialWeight || 0}
                                allergies={allergies}
                                conditions={conditions}
                            />
                            <ConsultationInputs patientId={patientId} />
                        </div>
                    );
                case 2:
                    return (
                        <ProtocolConfigCard
                            onGeneratePlan={handleGeneratePlan}
                            isGenerating={isGenerating}
                        />
                    );
                case 3:
                    return (
                        <WeeklyMealPlanner
                            weekPlan={weekPlan}
                            onOpenRecipeModal={handleOpenRecipeModal}
                            includeSmoothie={includeSmoothie}
                            includeDrinks={includeDrinks}
                        />
                    );
                case 4:
                    return <RecommendationsCard />;
                case 5:
                    return (
                        <ProtocolPreview
                            weekPlan={weekPlan}
                            isFirstConsultation={isFirstConsultation}
                        />
                    );
            }
        } else {
            // Edit Weekly Plan mode (3 steps)
            switch (currentStep) {
                case 1:
                    return (
                        <div className='space-y-4'>
                            <PatientSummaryCard
                                name={
                                    patient.firstName + ' ' + patient.lastName
                                }
                                age={
                                    getAgeFromDateString(patient.birthDate) || 0
                                }
                                gender={patient.gender || 'OTHER'}
                                height={patient.height || 0}
                                weight={patient.initialWeight || 0}
                                allergies={allergies}
                                conditions={conditions}
                            />
                            <ConsultationInputs patientId={patientId} />
                        </div>
                    );
            }
        }
    };

    const nextStep = () => {
        if (currentStep < maxStep) {
            setCurrentStep(prev => (prev + 1) as StepKey);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => (prev - 1) as StepKey);
        }
    };

    const handleGeneratePlan = async (payload: GeneratePlanPayload) => {
        setIsGenerating(true);
        setIncludeSmoothie(payload.includeSmoothie ?? false);
        setIncludeDrinks(payload.includeDrinks ?? false);

        try {
            const response = await fetch(
                `/api/patients/${patientId}/protocols/generate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                }
            );

            const result = await response.json();

            if (!response.ok || !result?.success) {
                throw new Error(
                    result?.message || 'No se pudo generar el plan semanal'
                );
            }

            const generatedWeekPlan = result?.data?.weekPlan as DayMeals[];
            if (!generatedWeekPlan || generatedWeekPlan.length === 0) {
                throw new Error('El servidor no devolvió un plan válido');
            }

            setWeekPlan(generatedWeekPlan);
            setCurrentStep(3);
        } catch (error) {
            window.alert(
                error instanceof Error
                    ? error.message
                    : 'No se pudo generar el plan semanal'
            );
        } finally {
            setIsGenerating(false);
        }
    };

    if (isPending || isPendingAllergies || isPendingConditions) {
        return <ProfileDetailsLoader />;
    }

    if (!patient) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                <div className='text-center'>
                    <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                        Paciente no encontrado
                    </h1>
                    <p className='text-muted-foreground mt-2'>
                        El paciente que buscas no existe o ha sido eliminado.
                    </p>
                    <Button
                        onClick={() => router.push('/pacientes')}
                        className='mt-4 bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)]'>
                        Volver a la lista
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className='relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
            {/* Patient Breadcrumb */}
            <PatientBreadcrumb
                patientId={patientId}
                currentPageLabel='Protocolo'
            />

            {/* Patient Header */}
            <motion.div
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.4}}
                className='mb-6 flex items-center justify-between'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
                            {isFirstConsultation
                                ? 'Nuevo Protocolo'
                                : 'Editar Plan Semanal'}
                        </h1>
                        <p className='text-sm text-muted-foreground mt-1'>
                            {isFirstConsultation
                                ? 'Diseña un plan de nutrición personalizado para tu paciente'
                                : 'Modifica el plan de comidas semanal para esta consulta de seguimiento'}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Step Indicator */}
            <StepIndicator
                currentStep={currentStep}
                onStepClick={setCurrentStep}
                isFirstConsultation={isFirstConsultation}
            />

            {/* Protocol Content */}
            {/* Step Content */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentStep}
                    initial={{opacity: 0, x: 20}}
                    animate={{opacity: 1, x: 0}}
                    exit={{opacity: 0, x: -20}}
                    transition={{duration: 0.3}}>
                    {renderStepContent()}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.2}}
                className='flex justify-between mt-8 pt-6 border-t border-border'>
                <Button
                    variant='outline'
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className='h-11 px-6 rounded-xl'>
                    <ChevronLeft className='mr-2 h-4 w-4' />
                    Anterior
                </Button>

                {currentStep < maxStep ? (
                    <Button onClick={nextStep} className='h-11 px-6 rounded-xl'>
                        Siguiente paso
                        <ChevronRight className='ml-2 h-4 w-4' />
                    </Button>
                ) : (
                    <Button className='h-11 px-6 rounded-xl'>
                        <Check className='mr-2 h-4 w-4' />
                        {isFirstConsultation
                            ? 'Completar protocolo'
                            : 'Completar cambios'}
                    </Button>
                )}
            </motion.div>
        </div>
    );
}
