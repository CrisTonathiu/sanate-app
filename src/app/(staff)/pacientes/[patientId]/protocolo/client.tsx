'use client';

import PatientBreadcrumb from '@/components/widgets/profile-details/PatientBreadcrumb';
import {useRouter} from 'next/navigation';
import {AnimatePresence, motion} from 'framer-motion';
import {Button} from '@/components/ui/button';
import ProfileDetailsLoader from '@/components/loaders/ProfileDetailsLoader';
import {
    useGetPatientAllergies,
    useGetPatientConditions,
    useGetPatientFoodDislikes,
    useGetPatientProfile
} from '@/hooks/use-patients';
import {useState} from 'react';
import StepIndicator from '@/components/widgets/profile-details/StepIndicator';
import {StepKey} from '@/lib/types/patient-type';
import PatientSummaryCard from '@/components/widgets/profile-details/PatientSummaryCard';
import {getAgeFromDateString} from '@/lib/utils';
import ConsultationInputs from '@/components/widgets/profile-details/ConsultationInputs';
import ProtocolConfigCard from '@/components/widgets/profile-details/ProtocolConfigCard';
import {DayMeals, MealSlot} from '@/lib/interface/meal-interface';
import WeeklyMealPlanner from '@/components/widgets/profile-details/WeeklyMealPlanner';
import RecommendationsCard from '@/components/widgets/profile-details/RecommendationsCard';
import ProtocolPreview from '@/components/widgets/profile-details/ProtocolPreview';
import ProtocolStartDialog, {
    ProtocolTemplateOption
} from '@/components/widgets/profile-details/ProtocolStartDialog';
import {ProtocolDistributionCard} from '@/components/widgets/profile-details/ProtocolDistributionCard';
import {
    DEFAULT_ENABLED_MEALS,
    MacroMealPercentages,
    MacroPercents,
    MealPercentages,
    MealType
} from '@/lib/config/meal-config';
import {ProtocolNavigation} from '@/components/widgets/profile-details/ProtocolNavigation';
import RecipePickerModal from '@/components/widgets/profile-details/RecipePickerModal';

interface ClientPageProps {
    patientId: string;
}

type MacroMealDistributionPayload = Record<
    string,
    {
        totalPercentage: number;
        totalKcal: number;
        carbsPercentage: number;
        carbsKcal: number;
        proteinPercentage: number;
        proteinKcal: number;
        fatPercentage: number;
        fatKcal: number;
    }
>;

type ProtocolTemplateRecord = {
    id: string;
    name: string;
    description?: string | null;
    updatedAt: string;
    weeklyPlan: DayMeals[];
    planCalories?: number | null;
    macroPercents?: Partial<MacroPercents> | null;
    enabledMeals?: Partial<Record<MealType, boolean>> | null;
    mealPercentages?: Partial<MealPercentages> | null;
    macroMealPercentages?: Partial<
        Record<keyof MacroMealPercentages, Partial<MealPercentages>>
    > | null;
};

const DEFAULT_MACRO_PERCENTS: MacroPercents = {
    carbs: 50,
    protein: 20,
    fat: 30
};

const DEFAULT_MEAL_PERCENTAGES: MealPercentages = {
    breakfast: 35,
    snack1: 0,
    lunch: 35,
    dinner: 30,
    snack2: 0,
    smoothie: 0,
    drinks: 0
};

const DEFAULT_MACRO_MEAL_PERCENTAGES: MacroMealPercentages = {
    carbs: {
        breakfast: 35,
        snack1: 0,
        lunch: 35,
        dinner: 30,
        snack2: 0,
        smoothie: 0,
        drinks: 0
    },
    protein: {
        breakfast: 35,
        snack1: 0,
        lunch: 35,
        dinner: 30,
        snack2: 0,
        smoothie: 0,
        drinks: 0
    },
    fat: {
        breakfast: 35,
        snack1: 0,
        lunch: 35,
        dinner: 30,
        snack2: 0,
        smoothie: 0,
        drinks: 0
    }
};

function round2(value: number) {
    return Number(value.toFixed(2));
}

export default function PacienteProtocolClient({patientId}: ClientPageProps) {
    const router = useRouter();
    const {data: patient, isPending} = useGetPatientProfile(patientId);
    const {data: allergies = [], isPending: isPendingAllergies} =
        useGetPatientAllergies(patientId);
    const {data: conditions = [], isPending: isPendingConditions} =
        useGetPatientConditions(patientId);
    const {data: foodDislikes = [], isPending: isPendingFoodDislikes} =
        useGetPatientFoodDislikes(patientId);

    // Consultation State
    const [reason, setReason] = useState<string>('');
    const [diagnosis, setDiagnosis] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const protocolTitle = diagnosis.trim() || 'Protocolo nutricional';
    const durationLabel = 'Duracion: 4 semanas';

    // Protocol State
    const [planCalories, setPlanCalories] = useState<number>(0);
    const [macroPercents, setMacroPercents] = useState<MacroPercents>(
        DEFAULT_MACRO_PERCENTS
    );

    // Meal distribution state (lifted from ProtocolDistributionCard)
    const [enabledMeals, setEnabledMeals] = useState<Record<MealType, boolean>>(
        DEFAULT_ENABLED_MEALS
    );
    const [mealPercentages, setMealPercentages] = useState<MealPercentages>(
        DEFAULT_MEAL_PERCENTAGES
    );
    const [macroMealPercentages, setMacroMealPercentages] =
        useState<MacroMealPercentages>(DEFAULT_MACRO_MEAL_PERCENTAGES);

    const [isFirstConsultation] = useState<boolean>(true);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [recipeModalOpen, setRecipeModalOpen] = useState<boolean>(false);
    const [isStartDialogOpen, setIsStartDialogOpen] =
        useState<boolean>(isFirstConsultation);
    const [protocolTemplates, setProtocolTemplates] = useState<
        ProtocolTemplateRecord[]
    >([]);
    const [isLoadingTemplates, setIsLoadingTemplates] =
        useState<boolean>(false);
    const [isApplyingTemplate, setIsApplyingTemplate] =
        useState<boolean>(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);
    const [isSavingProtocol, setIsSavingProtocol] = useState<boolean>(false);
    const [templateError, setTemplateError] = useState<string | null>(null);
    const [templateSaveError, setTemplateSaveError] = useState<string | null>(
        null
    );
    const [selectedTemplateName, setSelectedTemplateName] = useState<
        string | null
    >(null);

    const [weekPlan, setWeekPlan] = useState<DayMeals[]>([]);
    const [currentStep, setCurrentStep] = useState<StepKey>(1);

    const [selectedDayMeal, setSelectedDayMeal] = useState<{
        day: string;
        mealType: MealType;
    } | null>(null);

    const maxStep = isFirstConsultation ? 6 : 3;

    const handleOpenRecipeModal = (day: string, mealType: MealType) => {
        setSelectedDayMeal({day, mealType});
        setRecipeModalOpen(true);
    };

    const handleMealUpdate = (
        day: string,
        mealType: MealType,
        updatedMeal: MealSlot
    ) => {
        setWeekPlan(prev =>
            prev.map(d => (d.day === day ? {...d, [mealType]: updatedMeal} : d))
        );
    };

    const fetchProtocolTemplates = async (force = false) => {
        if (isLoadingTemplates) {
            return;
        }

        if (!force && protocolTemplates.length > 0) {
            return;
        }

        setIsLoadingTemplates(true);
        setTemplateError(null);

        try {
            const response = await fetch('/api/protocol-templates');
            const result = await response.json();

            if (!response.ok || !result?.success) {
                throw new Error(
                    result?.message ||
                        'No se pudieron cargar las plantillas de protocolo'
                );
            }

            setProtocolTemplates(
                Array.isArray(result?.data)
                    ? (result.data as ProtocolTemplateRecord[])
                    : []
            );
        } catch (error) {
            setTemplateError(
                error instanceof Error
                    ? error.message
                    : 'No se pudieron cargar las plantillas de protocolo'
            );
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const handleStartCleanProtocol = () => {
        setSelectedTemplateName(null);
        setIsStartDialogOpen(false);
    };

    const handleApplyTemplate = async (templateId: string) => {
        const template = protocolTemplates.find(item => item.id === templateId);

        if (!template) {
            setTemplateError('La plantilla seleccionada no fue encontrada.');
            return;
        }

        setIsApplyingTemplate(true);

        try {
            setWeekPlan(template.weeklyPlan);
            setPlanCalories(template.planCalories ?? 0);
            setMacroPercents(prev => ({
                ...prev,
                ...(template.macroPercents ?? {})
            }));
            setEnabledMeals(prev => ({
                ...prev,
                ...(template.enabledMeals ?? {})
            }));
            setMealPercentages(prev => ({
                ...prev,
                ...(template.mealPercentages ?? {})
            }));
            setMacroMealPercentages(prev => ({
                carbs: {
                    ...prev.carbs,
                    ...(template.macroMealPercentages?.carbs ?? {})
                },
                protein: {
                    ...prev.protein,
                    ...(template.macroMealPercentages?.protein ?? {})
                },
                fat: {
                    ...prev.fat,
                    ...(template.macroMealPercentages?.fat ?? {})
                }
            }));
            setCurrentStep(1);
            setSelectedTemplateName(template.name);
            setIsStartDialogOpen(false);
        } finally {
            setIsApplyingTemplate(false);
        }
    };

    const handleSaveTemplate = async (templateName: string) => {
        setIsSavingTemplate(true);
        setTemplateSaveError(null);

        const templatePayload = {
            name: templateName,
            weeklyPlan: weekPlan,
            planCalories,
            macroPercents,
            enabledMeals,
            mealPercentages,
            macroMealPercentages
        };

        try {
            console.log(
                '[protocol-template.save] outgoing payload:',
                JSON.stringify(templatePayload, null, 2)
            );

            const response = await fetch('/api/protocol-templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(templatePayload)
            });

            const result = await response.json();

            console.log(
                '[protocol-template.save] server response:',
                JSON.stringify(result, null, 2)
            );

            if (!response.ok || !result?.success) {
                const nameFieldError = result?.errors?.fieldErrors?.name?.[0];
                const weeklyPlanFieldError =
                    result?.errors?.fieldErrors?.weeklyPlan?.[0];
                const formError = result?.errors?.formErrors?.[0];
                const nextErrorMessage =
                    nameFieldError ||
                    weeklyPlanFieldError ||
                    formError ||
                    result?.message ||
                    'No se pudo guardar la plantilla de protocolo';

                setTemplateSaveError(nextErrorMessage);
                return false;
            }

            const createdTemplate = result?.data as ProtocolTemplateRecord;

            if (createdTemplate) {
                setProtocolTemplates(prev => {
                    const nextTemplates = prev.filter(
                        template => template.id !== createdTemplate.id
                    );

                    return [createdTemplate, ...nextTemplates];
                });
            }

            setTemplateSaveError(null);
            window.alert('Plantilla guardada correctamente.');
            return true;
        } catch (error) {
            setTemplateSaveError(
                error instanceof Error
                    ? error.message
                    : 'No se pudo guardar la plantilla de protocolo'
            );
            return false;
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const protocolTemplateOptions: ProtocolTemplateOption[] =
        protocolTemplates.map(template => ({
            id: template.id,
            name: template.name,
            description: template.description,
            updatedAt: template.updatedAt,
            weekPlanLength: template.weeklyPlan.length
        }));

    const getTargetCaloriesForMeal = (mealType: MealType): number => {
        const total = (Object.keys(enabledMeals) as MealType[])
            .filter(k => enabledMeals[k])
            .reduce((sum, k) => sum + (mealPercentages[k] ?? 0), 0);
        const pct = mealPercentages[mealType] ?? 0;
        return total > 0 ? Math.round((pct / total) * planCalories) : 0;
    };

    const enabledMealKeys = (Object.keys(enabledMeals) as MealType[]).filter(
        key => enabledMeals[key]
    );
    const mealDistributionTotal = enabledMealKeys.reduce(
        (sum, key) => sum + (mealPercentages[key] ?? 0),
        0
    );
    const macroDistributionTotals = {
        carbs: enabledMealKeys.reduce(
            (sum, key) => sum + macroMealPercentages.carbs[key],
            0
        ),
        protein: enabledMealKeys.reduce(
            (sum, key) => sum + macroMealPercentages.protein[key],
            0
        ),
        fat: enabledMealKeys.reduce(
            (sum, key) => sum + macroMealPercentages.fat[key],
            0
        )
    };
    const isMealDistributionStepValid =
        mealDistributionTotal === 100 &&
        macroDistributionTotals.carbs === 100 &&
        macroDistributionTotals.protein === 100 &&
        macroDistributionTotals.fat === 100;

    const renderStepContent = () => {
        if (!patient) return null;
        if (isFirstConsultation) {
            // Create Protocol mode (5 steps)
            switch (currentStep) {
                case 1:
                    return (
                        <div className='space-y-4'>
                            <PatientSummaryCard
                                patientId={patientId}
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
                                foodDislikes={foodDislikes}
                            />
                            <ConsultationInputs
                                reason={reason}
                                setReason={setReason}
                                diagnosis={diagnosis}
                                setDiagnosis={setDiagnosis}
                                notes={notes}
                                setNotes={setNotes}
                            />
                        </div>
                    );
                case 2:
                    return (
                        <ProtocolConfigCard
                            height={patient.height || 0}
                            age={getAgeFromDateString(patient.birthDate) || 0}
                            gender={patient.gender as 'MALE' | 'FEMALE'}
                            planCalories={planCalories}
                            setPlanCalories={setPlanCalories}
                            macroPercents={macroPercents}
                            setMacroPercents={setMacroPercents}
                        />
                    );
                case 3:
                    return (
                        <ProtocolDistributionCard
                            planCalories={planCalories}
                            enabledMeals={enabledMeals}
                            setEnabledMeals={setEnabledMeals}
                            mealPercentages={mealPercentages}
                            setMealPercentages={setMealPercentages}
                            macroMealPercentages={macroMealPercentages}
                            setMacroMealPercentages={setMacroMealPercentages}
                            macroPercents={macroPercents}
                        />
                    );
                case 4:
                    return (
                        <WeeklyMealPlanner
                            weekPlan={weekPlan}
                            onOpenRecipeModal={handleOpenRecipeModal}
                            onMealUpdate={handleMealUpdate}
                        />
                    );
                case 5:
                    return <RecommendationsCard />;
                case 6:
                    return (
                        <ProtocolPreview
                            weekPlan={weekPlan}
                            isFirstConsultation={isFirstConsultation}
                            protocolTitle={protocolTitle}
                            durationLabel={durationLabel}
                            patientName={`${patient.firstName} ${patient.lastName}`}
                            isSavingTemplate={isSavingTemplate}
                            templateSaveError={templateSaveError}
                            onSaveTemplate={handleSaveTemplate}
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
                                patientId={patientId}
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
                                foodDislikes={foodDislikes}
                            />
                            <ConsultationInputs
                                reason={reason}
                                setReason={setReason}
                                diagnosis={diagnosis}
                                setDiagnosis={setDiagnosis}
                                notes={notes}
                                setNotes={setNotes}
                            />
                        </div>
                    );
            }
        }
    };

    const handleGeneratePlan = async (payload: {
        planCalories: number;
        macroPercents: {carbs: number; protein: number; fat: number};
        mealDistribution: Record<string, number>;
        macroMealDistribution: MacroMealDistributionPayload;
    }) => {
        setIsGenerating(true);

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

            console.log('API response:', result);

            if (!response.ok || !result?.success) {
                throw new Error(
                    result?.message || 'No se pudo generar el plan semanal'
                );
            }

            const generatedWeekPlan = result?.data?.weekPlan as DayMeals[];
            console.log(
                'Received week plan from server:',
                JSON.stringify(generatedWeekPlan, null, 2)
            );
            if (!generatedWeekPlan || generatedWeekPlan.length === 0) {
                throw new Error('El servidor no devolvió un plan válido');
            }

            setWeekPlan(generatedWeekPlan);
            setCurrentStep(4);
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

    const nextStep = () => {
        if (currentStep === 3) {
            if (mealDistributionTotal !== 100) {
                window.alert(
                    `La distribucion total de comidas debe ser 100%. Actualmente es ${mealDistributionTotal.toFixed(2)}%.`
                );
                return;
            }

            if (
                macroDistributionTotals.carbs !== 100 ||
                macroDistributionTotals.protein !== 100 ||
                macroDistributionTotals.fat !== 100
            ) {
                window.alert(
                    `La distribucion por macro debe sumar 100% para carbs, proteina y grasa. Totales actuales: carbs ${macroDistributionTotals.carbs.toFixed(2)}%, proteina ${macroDistributionTotals.protein.toFixed(2)}%, grasa ${macroDistributionTotals.fat.toFixed(2)}%.`
                );
                return;
            }

            // Build mealDistribution payload from enabled meals + percentages
            const mealDistribution: Record<string, number> = {};
            const macroCalories = {
                carbs: (planCalories * macroPercents.carbs) / 100,
                protein: (planCalories * macroPercents.protein) / 100,
                fat: (planCalories * macroPercents.fat) / 100
            };
            const macroMealDistribution: MacroMealDistributionPayload = {};

            (Object.keys(enabledMeals) as MealType[]).forEach(key => {
                if (enabledMeals[key]) {
                    mealDistribution[key] = mealPercentages[key];
                    macroMealDistribution[key] = {
                        totalPercentage: round2(mealPercentages[key]),
                        totalKcal: round2(
                            (planCalories * mealPercentages[key]) / 100
                        ),
                        carbsPercentage: round2(
                            macroMealPercentages.carbs[key]
                        ),
                        carbsKcal: round2(
                            (macroCalories.carbs *
                                macroMealPercentages.carbs[key]) /
                                100
                        ),
                        proteinPercentage: round2(
                            macroMealPercentages.protein[key]
                        ),
                        proteinKcal: round2(
                            (macroCalories.protein *
                                macroMealPercentages.protein[key]) /
                                100
                        ),
                        fatPercentage: round2(macroMealPercentages.fat[key]),
                        fatKcal: round2(
                            (macroCalories.fat *
                                macroMealPercentages.fat[key]) /
                                100
                        )
                    };
                }
            });
            handleGeneratePlan({
                planCalories,
                macroPercents,
                mealDistribution,
                macroMealDistribution
            });
            return;
        }
        if (currentStep < maxStep) {
            setCurrentStep(prev => (prev + 1) as StepKey);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => (prev - 1) as StepKey);
        }
    };

    const handleGenerateProtocol = async () => {
        if (weekPlan.length === 0) {
            window.alert(
                'Primero genera un plan semanal para crear el protocolo.'
            );
            return;
        }

        setIsSavingProtocol(true);

        try {
            const response = await fetch(
                `/api/patients/${patientId}/protocols`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: protocolTitle,
                        weekCount: 1,
                        status: 'ACTIVE',
                        weekPlan
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result?.success) {
                throw new Error(
                    result?.message || 'No se pudo generar el protocolo'
                );
            }

            window.alert('Protocolo generado correctamente.');
            router.refresh();
        } catch (error) {
            window.alert(
                error instanceof Error
                    ? error.message
                    : 'No se pudo generar el protocolo'
            );
        } finally {
            setIsSavingProtocol(false);
        }
    };

    const handleStepClick = (step: StepKey) => {
        if (step <= currentStep) {
            setCurrentStep(step);
        }
    };

    if (
        isPending ||
        isPendingAllergies ||
        isPendingConditions ||
        isPendingFoodDislikes
    ) {
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
        <div className='relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 pb-30'>
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

            {selectedTemplateName ? (
                <div className='mb-6 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3'>
                    <p className='text-sm text-foreground'>
                        Plantilla aplicada:{' '}
                        <span className='font-semibold'>
                            {selectedTemplateName}
                        </span>
                    </p>
                </div>
            ) : null}

            {/* Step Indicator */}
            <StepIndicator
                currentStep={currentStep}
                onStepClick={handleStepClick}
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
            <ProtocolNavigation
                currentStep={currentStep}
                maxStep={maxStep}
                isFirstConsultation={isFirstConsultation}
                nextStep={nextStep}
                prevStep={prevStep}
                onComplete={handleGenerateProtocol}
                isGenerating={isGenerating}
                isCompleting={isSavingProtocol}
                disableNextStep={
                    currentStep === 3 && !isMealDistributionStepValid
                }
            />

            {selectedDayMeal && (
                <RecipePickerModal
                    open={recipeModalOpen}
                    mealType={selectedDayMeal.mealType}
                    targetCalories={getTargetCaloriesForMeal(
                        selectedDayMeal.mealType
                    )}
                    onClose={() => {
                        setRecipeModalOpen(false);
                        setSelectedDayMeal(null);
                    }}
                    onSelect={meal =>
                        handleMealUpdate(
                            selectedDayMeal.day,
                            selectedDayMeal.mealType,
                            meal
                        )
                    }
                />
            )}

            {isFirstConsultation ? (
                <ProtocolStartDialog
                    open={isStartDialogOpen}
                    templates={protocolTemplateOptions}
                    isLoadingTemplates={isLoadingTemplates}
                    isApplyingTemplate={isApplyingTemplate}
                    templateError={templateError}
                    onStartClean={handleStartCleanProtocol}
                    onBrowseTemplates={() => fetchProtocolTemplates()}
                    onRetryTemplates={() => fetchProtocolTemplates(true)}
                    onApplyTemplate={handleApplyTemplate}
                />
            ) : null}
        </div>
    );
}
