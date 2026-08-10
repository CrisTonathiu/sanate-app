'use client';

import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {StepItem} from '@/components/widgets/recipe/StepItem';
import {MEAL_CONFIG, MealType} from '@/lib/config/meal-config';
import {
    DayMeals,
    MealIngredientPortion,
    MealSlot
} from '@/lib/interface/meal-interface';
import {
    formatScaledIngredientDisplay
} from '@/lib/services/protocol/protocol-meal-portions.mapper';
import {AnimatePresence, motion} from 'framer-motion';
import {
    Beef,
    Droplets,
    Eye,
    FileDown,
    FileText,
    Flame,
    ListOrdered,
    Loader2,
    Plus,
    Save,
    Wheat
} from 'lucide-react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ComponentType
} from 'react';
import type {MealType as PrismaMealType} from '@prisma/client';

const PLANNER_MEAL_TO_PRISMA: Record<MealType, PrismaMealType> = {
    smoothie: 'SMOOTHIE',
    breakfast: 'BREAKFAST',
    snack1: 'SNACK1',
    snack2: 'SNACK2',
    lunch: 'LUNCH',
    dinner: 'DINNER',
    drinks: 'DRINKS'
};

type RecipeInstructionRequest = {
    id: string;
    title: string;
    mealType: PrismaMealType;
    ingredients: string[];
};

interface ProtocolPreviewProps {
    weekPlan: DayMeals[];
    isFirstConsultation: boolean;
    protocolTitle?: string;
    durationLabel?: string;
    patientName?: string;
    isSavingTemplate?: boolean;
    templateSaveError?: string | null;
    onSaveTemplate?: (templateName: string) => Promise<boolean>;
    onInstructionsUpdate?: (
        recipeId: string,
        instructions: string[]
    ) => void;
    /** When true, generate AI instructions once on mount and overwrite existing steps. */
    shouldGenerateAiInstructions?: boolean;
    onAiInstructionsGenerated?: () => void;
}

type EditableStep = {
    id: string;
    instruction: string;
};

function createStepId() {
    return `step-${Math.random().toString(36).slice(2, 10)}`;
}

function toEditableSteps(instructions?: string[]): EditableStep[] {
    if (!instructions?.length) {
        return [];
    }

    return instructions.map(instruction => ({
        id: createStepId(),
        instruction
    }));
}

function getDisplayAmount(portion: MealIngredientPortion) {
    const {amount, unit} = formatScaledIngredientDisplay(
        {
            unit: portion.unit ?? 'GRAM',
            targetGrams: portion.targetGrams,
            targetQuantity: portion.targetQuantity ?? portion.targetGrams,
            isDiscrete: portion.isDiscrete
        },
        {
            quantity: portion.baseQuantity ?? portion.targetQuantity ?? null,
            grams: portion.baseGrams || portion.targetGrams,
            unit: portion.unit ?? 'GRAM'
        }
    );

    const unitLabel =
        unit === 'taza' ? 'tz' : unit === 'cdta' ? 'cdita' : unit;

    return {amount, unitLabel};
}

function formatPortionIngredientLine(portion: MealIngredientPortion): string {
    const name = portion.ingredientName.trim();
    if (!name) return '';

    const {amount, unitLabel} = getDisplayAmount(portion);
    return `${amount} ${unitLabel} ${name}`.trim();
}

function MealPreviewCard({
    meal,
    mealLabel,
    MealIcon,
    draftSteps,
    isSaving,
    saveError,
    saveSuccess,
    onStepsChange,
    onSave
}: {
    meal: MealSlot;
    mealLabel: string;
    MealIcon: ComponentType<{className?: string}>;
    draftSteps: EditableStep[];
    isSaving: boolean;
    saveError: string | null;
    saveSuccess: boolean;
    onStepsChange: (steps: EditableStep[]) => void;
    onSave: () => void;
}) {
    const hasUnsavedChanges = useMemo(() => {
        const saved = (meal.instructions ?? [])
            .map(step => step.trim())
            .filter(Boolean);
        const draft = draftSteps
            .map(step => step.instruction.trim())
            .filter(Boolean);

        if (saved.length !== draft.length) {
            return true;
        }

        return saved.some((step, index) => step !== draft[index]);
    }, [draftSteps, meal.instructions]);

    return (
        <div className='rounded-xl border border-border bg-background/60 overflow-hidden'>
            <div className='flex gap-3 p-3'>
                <div className='relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary/40'>
                    <img
                        src={meal.imageUrl ?? '/recipe-placeholder.svg'}
                        alt={meal.recipeName}
                        onError={event => {
                            event.currentTarget.src = '/recipe-placeholder.svg';
                        }}
                        className='h-full w-full object-cover'
                    />
                </div>

                <div className='min-w-0 flex-1 space-y-2'>
                    <div>
                        <span className='text-xs text-muted-foreground flex items-center gap-1'>
                            <MealIcon className='h-3 w-3' />
                            {mealLabel}
                        </span>
                        <h6 className='text-sm font-semibold text-foreground line-clamp-2'>
                            {meal.recipeName}
                        </h6>
                    </div>

                    <div className='flex flex-wrap gap-1.5'>
                        {meal.calories > 0 ? (
                            <Badge
                                variant='secondary'
                                className='gap-1 font-normal text-[11px]'>
                                <Flame className='h-3 w-3 text-amber-500' />
                                {meal.calories} kcal
                            </Badge>
                        ) : null}
                        {meal.protein != null && meal.protein > 0 ? (
                            <Badge
                                variant='secondary'
                                className='gap-1 font-normal text-[11px]'>
                                <Beef className='h-3 w-3 text-rose-500' />
                                {meal.protein} g prot
                            </Badge>
                        ) : null}
                        {meal.carbs != null && meal.carbs > 0 ? (
                            <Badge
                                variant='secondary'
                                className='gap-1 font-normal text-[11px]'>
                                <Wheat className='h-3 w-3 text-amber-600' />
                                {meal.carbs} g carb
                            </Badge>
                        ) : null}
                        {meal.fat != null && meal.fat > 0 ? (
                            <Badge
                                variant='secondary'
                                className='gap-1 font-normal text-[11px]'>
                                <Droplets className='h-3 w-3 text-sky-500' />
                                {meal.fat} g grasa
                            </Badge>
                        ) : null}
                    </div>
                </div>
            </div>

            {meal.ingredientPortions && meal.ingredientPortions.length > 0 ? (
                <div className='border-t border-border px-3 py-2.5'>
                    <p className='mb-1.5 text-xs font-medium text-foreground'>
                        Ingredientes
                    </p>
                    <ul className='space-y-0.5'>
                        {meal.ingredientPortions.map((portion, index) => {
                            const {amount, unitLabel} =
                                getDisplayAmount(portion);

                            return (
                                <li
                                    key={`${portion.ingredientName}-${index}`}
                                    className='text-xs text-muted-foreground'>
                                    {amount} {unitLabel}{' '}
                                    {portion.ingredientName}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : null}

            <div className='border-t border-border px-3 py-3 space-y-3'>
                <div className='flex items-center justify-between gap-2'>
                    <p className='text-xs font-medium text-foreground flex items-center gap-1.5'>
                        <ListOrdered className='h-3.5 w-3.5 text-primary' />
                        Instrucciones
                        {draftSteps.length > 0 ? (
                            <Badge variant='secondary' className='text-[10px]'>
                                {draftSteps.length} pasos
                            </Badge>
                        ) : null}
                    </p>
                    <Button
                        type='button'
                        size='sm'
                        onClick={onSave}
                        disabled={isSaving || !hasUnsavedChanges}
                        className='h-8 rounded-lg text-xs'>
                        {isSaving ? (
                            <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                        ) : (
                            <Save className='mr-1.5 h-3.5 w-3.5' />
                        )}
                        Guardar
                    </Button>
                </div>

                <AnimatePresence mode='popLayout'>
                    {draftSteps.length === 0 ? (
                        <p className='text-xs text-muted-foreground italic'>
                            Sin instrucciones. Agrega los pasos que verá el
                            paciente en el PDF.
                        </p>
                    ) : (
                        <div className='space-y-2'>
                            {draftSteps.map((step, index) => (
                                <StepItem
                                    key={step.id}
                                    step={step}
                                    index={index}
                                    onUpdate={instruction =>
                                        onStepsChange(
                                            draftSteps.map(item =>
                                                item.id === step.id
                                                    ? {...item, instruction}
                                                    : item
                                            )
                                        )
                                    }
                                    onRemove={() =>
                                        onStepsChange(
                                            draftSteps.filter(
                                                item => item.id !== step.id
                                            )
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </AnimatePresence>

                <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() =>
                        onStepsChange([
                            ...draftSteps,
                            {id: createStepId(), instruction: ''}
                        ])
                    }
                    className='w-full h-9 border-dashed text-xs'>
                    <Plus className='mr-1.5 h-3.5 w-3.5' />
                    Agregar paso
                </Button>

                {saveError ? (
                    <p className='text-xs text-destructive'>{saveError}</p>
                ) : null}
                {saveSuccess && !hasUnsavedChanges ? (
                    <p className='text-xs text-emerald-600'>
                        Instrucciones guardadas. Se incluirán en el PDF del
                        menú.
                    </p>
                ) : null}
            </div>
        </div>
    );
}

export default function ProtocolPreview({
    weekPlan,
    isFirstConsultation,
    protocolTitle,
    durationLabel,
    patientName,
    isSavingTemplate = false,
    templateSaveError,
    onSaveTemplate,
    onInstructionsUpdate,
    shouldGenerateAiInstructions = false,
    onAiInstructionsGenerated
}: ProtocolPreviewProps) {
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] =
        useState<boolean>(false);
    const [templateName, setTemplateName] = useState<string>('');
    const [draftsByRecipeId, setDraftsByRecipeId] = useState<
        Record<string, EditableStep[]>
    >({});
    const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);
    const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
    const [saveSuccessIds, setSaveSuccessIds] = useState<
        Record<string, boolean>
    >({});
    const [isGeneratingInstructions, setIsGeneratingInstructions] =
        useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const hasRequestedAiGeneration = useRef(false);
    const onInstructionsUpdateRef = useRef(onInstructionsUpdate);
    const onAiInstructionsGeneratedRef = useRef(onAiInstructionsGenerated);

    useEffect(() => {
        onInstructionsUpdateRef.current = onInstructionsUpdate;
    }, [onInstructionsUpdate]);

    useEffect(() => {
        onAiInstructionsGeneratedRef.current = onAiInstructionsGenerated;
    }, [onAiInstructionsGenerated]);

    const mealEntries = useMemo(
        () =>
            MEAL_CONFIG.map(({key, label, icon: Icon}) => ({
                key,
                label,
                Icon
            })),
        []
    );

    const uniqueRecipeIds = useMemo(() => {
        const ids = new Set<string>();

        for (const day of weekPlan) {
            for (const {key} of mealEntries) {
                const meal = day[key as MealType];
                if (meal?.id && meal.recipeName) {
                    ids.add(meal.id);
                }
            }
        }

        return [...ids];
    }, [weekPlan, mealEntries]);

    const recipesForAiGeneration = useMemo(() => {
        const byId = new Map<string, RecipeInstructionRequest>();

        for (const day of weekPlan) {
            for (const {key} of mealEntries) {
                const meal = day[key as MealType];
                if (!meal?.id || !meal.recipeName || byId.has(meal.id)) {
                    continue;
                }

                const ingredients = (meal.ingredientPortions ?? [])
                    .map(formatPortionIngredientLine)
                    .filter(Boolean);

                byId.set(meal.id, {
                    id: meal.id,
                    title: meal.recipeName,
                    mealType: PLANNER_MEAL_TO_PRISMA[key as MealType],
                    ingredients
                });
            }
        }

        return [...byId.values()];
    }, [weekPlan, mealEntries]);

    const uniqueRecipeIdsKey = uniqueRecipeIds.join(',');
    const recipesForAiKey = useMemo(
        () =>
            JSON.stringify(
                recipesForAiGeneration.map(recipe => ({
                    id: recipe.id,
                    ingredients: recipe.ingredients
                }))
            ),
        [recipesForAiGeneration]
    );

    useEffect(() => {
        if (!isTemplateDialogOpen) {
            setTemplateName(protocolTitle || 'Protocolo nutricional');
        }
    }, [isTemplateDialogOpen, protocolTitle]);

    useEffect(() => {
        setDraftsByRecipeId(prev => {
            const next = {...prev};
            let changed = false;

            for (const day of weekPlan) {
                for (const {key} of mealEntries) {
                    const meal = day[key as MealType];
                    if (!meal?.id || !meal.recipeName) {
                        continue;
                    }

                    if (next[meal.id] === undefined) {
                        next[meal.id] = toEditableSteps(meal.instructions);
                        changed = true;
                    }
                }
            }

            return changed ? next : prev;
        });
    }, [weekPlan, mealEntries]);

    useEffect(() => {
        if (!shouldGenerateAiInstructions) {
            return;
        }

        if (hasRequestedAiGeneration.current) {
            return;
        }

        if (uniqueRecipeIds.length === 0) {
            return;
        }

        hasRequestedAiGeneration.current = true;
        const recipeIds = [...uniqueRecipeIds];
        const recipes = [...recipesForAiGeneration];
        const controller = new AbortController();

        const generate = async () => {
            setIsGeneratingInstructions(true);
            setGenerationError(null);

            try {
                const response = await fetch(
                    '/api/recipes/generate-instructions',
                    {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        credentials: 'include',
                        signal: controller.signal,
                        body: JSON.stringify({recipeIds, recipes})
                    }
                );
                const payload = (await response.json()) as {
                    success?: boolean;
                    message?: string;
                    data?: {instructionsByRecipeId?: Record<string, string[]>};
                };

                if (!response.ok || payload.success === false) {
                    throw new Error(
                        payload.message ||
                            'No se pudieron generar las instrucciones'
                    );
                }

                const instructionsByRecipeId =
                    payload.data?.instructionsByRecipeId ?? {};

                const nextDrafts: Record<string, EditableStep[]> = {};

                for (const recipeId of recipeIds) {
                    const instructions =
                        instructionsByRecipeId[recipeId] ?? [];
                    nextDrafts[recipeId] = toEditableSteps(instructions);
                    onInstructionsUpdateRef.current?.(recipeId, instructions);
                }

                setDraftsByRecipeId(prev => ({
                    ...prev,
                    ...nextDrafts
                }));

                onAiInstructionsGeneratedRef.current?.();
            } catch (error) {
                if (controller.signal.aborted) {
                    hasRequestedAiGeneration.current = false;
                    return;
                }

                hasRequestedAiGeneration.current = false;
                setGenerationError(
                    error instanceof Error
                        ? error.message
                        : 'No se pudieron generar las instrucciones'
                );
            } finally {
                if (!controller.signal.aborted) {
                    setIsGeneratingInstructions(false);
                }
            }
        };

        void generate();

        return () => {
            controller.abort();
        };
    }, [
        shouldGenerateAiInstructions,
        uniqueRecipeIdsKey,
        uniqueRecipeIds,
        recipesForAiKey,
        recipesForAiGeneration
    ]);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1500);
    };

    const handleSaveNotes = () => {
        setIsSavingNotes(true);
        setTimeout(() => setIsSavingNotes(false), 1500);
    };

    const handleOpenTemplateDialog = () => {
        setTemplateName(protocolTitle || 'Protocolo nutricional');
        setIsTemplateDialogOpen(true);
    };

    const handleConfirmTemplateSave = async () => {
        const trimmedTemplateName = templateName.trim();

        if (!trimmedTemplateName || !onSaveTemplate) {
            return;
        }

        const didSave = await onSaveTemplate(trimmedTemplateName);

        if (didSave) {
            setIsTemplateDialogOpen(false);
        }
    };

    const handleSaveInstructions = async (recipeId: string) => {
        const draftSteps = draftsByRecipeId[recipeId] ?? [];
        const instructions = draftSteps
            .map(step => step.instruction.trim())
            .filter(Boolean);

        setSavingRecipeId(recipeId);
        setSaveErrors(prev => {
            const next = {...prev};
            delete next[recipeId];
            return next;
        });
        setSaveSuccessIds(prev => {
            const next = {...prev};
            delete next[recipeId];
            return next;
        });

        try {
            const response = await fetch(`/api/recipes/${recipeId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    steps: instructions.map(instruction => ({instruction}))
                })
            });
            const payload = (await response.json()) as {
                success?: boolean;
                message?: string;
            };

            if (!response.ok || payload.success === false) {
                throw new Error(
                    payload.message || 'No se pudieron guardar las instrucciones'
                );
            }

            setDraftsByRecipeId(prev => ({
                ...prev,
                [recipeId]: instructions.map(instruction => ({
                    id: createStepId(),
                    instruction
                }))
            }));
            onInstructionsUpdate?.(recipeId, instructions);
            setSaveSuccessIds(prev => ({...prev, [recipeId]: true}));
        } catch (error) {
            setSaveErrors(prev => ({
                ...prev,
                [recipeId]:
                    error instanceof Error
                        ? error.message
                        : 'No se pudieron guardar las instrucciones'
            }));
        } finally {
            setSavingRecipeId(null);
        }
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            className='space-y-6'>
            <Card>
                <CardHeader className='pb-3 border-b border-border'>
                    <CardTitle className='text-lg flex items-center gap-2'>
                        <Eye className='h-5 w-5 text-primary' />
                        {isFirstConsultation
                            ? 'Vista previa del protocolo'
                            : 'Vista previa de cambios del menu'}
                    </CardTitle>
                </CardHeader>
                <CardContent className='pt-6'>
                    <div className='mb-6'>
                        <h4 className='text-sm font-semibold text-foreground mb-1'>
                            {protocolTitle || 'Protocolo nutricional'}
                        </h4>
                        <p className='text-xs text-muted-foreground'>
                            {durationLabel || 'Duracion no definida'}
                            {patientName ? ` | Paciente: ${patientName}` : ''}
                        </p>
                        <p className='mt-2 text-xs text-muted-foreground'>
                            Revisa ingredientes y macros de cada comida. Solo
                            puedes editar las instrucciones; al guardarlas se
                            incluirán en el PDF del menú.
                        </p>
                        {isGeneratingInstructions ? (
                            <p className='mt-2 text-xs text-primary flex items-center gap-1.5'>
                                <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                Generando instrucciones con IA…
                            </p>
                        ) : null}
                        {generationError ? (
                            <p className='mt-2 text-xs text-destructive'>
                                {generationError}
                            </p>
                        ) : null}
                    </div>

                    <div className='space-y-4'>
                        {weekPlan.map(day => {
                            const dayMeals = mealEntries.filter(({key}) => {
                                const meal = day[key as MealType];
                                return Boolean(meal?.recipeName);
                            });

                            if (dayMeals.length === 0) {
                                return null;
                            }

                            return (
                                <div
                                    key={day.day}
                                    className='p-4 rounded-xl bg-secondary/30 border border-border space-y-3'>
                                    <h5 className='text-sm font-semibold text-foreground'>
                                        {day.day}
                                    </h5>
                                    <div className='grid grid-cols-1 xl:grid-cols-2 gap-3'>
                                        {dayMeals.map(({key, label, Icon}) => {
                                            const meal = day[
                                                key as MealType
                                            ] as MealSlot;
                                            const draftSteps =
                                                draftsByRecipeId[meal.id] ??
                                                toEditableSteps(
                                                    meal.instructions
                                                );

                                            return (
                                                <MealPreviewCard
                                                    key={`${day.day}-${key}`}
                                                    meal={meal}
                                                    mealLabel={label}
                                                    MealIcon={Icon}
                                                    draftSteps={draftSteps}
                                                    isSaving={
                                                        savingRecipeId ===
                                                        meal.id
                                                    }
                                                    saveError={
                                                        saveErrors[meal.id] ??
                                                        null
                                                    }
                                                    saveSuccess={Boolean(
                                                        saveSuccessIds[meal.id]
                                                    )}
                                                    onStepsChange={steps =>
                                                        setDraftsByRecipeId(
                                                            prev => ({
                                                                ...prev,
                                                                [meal.id]: steps
                                                            })
                                                        )
                                                    }
                                                    onSave={() => {
                                                        void handleSaveInstructions(
                                                            meal.id
                                                        );
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {isFirstConsultation ? (
                <div className='flex flex-col sm:flex-row gap-3'>
                    <Button
                        variant='outline'
                        onClick={handleOpenTemplateDialog}
                        className='flex-1 h-12 rounded-xl'>
                        <FileDown className='mr-2 h-5 w-5' />
                        Guardar como plantilla
                    </Button>
                </div>
            ) : (
                <div className='flex flex-col sm:flex-row gap-3'>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className='flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-lg shadow-primary/25'>
                        {isSaving ? (
                            <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                        ) : (
                            <Save className='mr-2 h-5 w-5' />
                        )}
                        Guardar cambios del menu
                    </Button>
                    <Button
                        variant='outline'
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className='flex-1 h-12 rounded-xl'>
                        {isSavingNotes ? (
                            <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                        ) : (
                            <FileText className='mr-2 h-5 w-5' />
                        )}
                        Guardar notas de consulta
                    </Button>
                </div>
            )}

            <Dialog
                open={isTemplateDialogOpen}
                onOpenChange={open => {
                    if (!isSavingTemplate) {
                        setIsTemplateDialogOpen(open);
                    }
                }}>
                <DialogContent className='rounded-2xl border-border bg-background sm:max-w-md'>
                    <DialogHeader>
                        <DialogTitle>Guardar como plantilla</DialogTitle>
                        <DialogDescription>
                            Escribe un nombre para identificar esta plantilla y
                            reutilizarla al crear nuevos protocolos.
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-2'>
                        <Label htmlFor='template-name'>
                            Nombre de plantilla
                        </Label>
                        <Input
                            id='template-name'
                            value={templateName}
                            onChange={event =>
                                setTemplateName(event.target.value)
                            }
                            placeholder='Ej. Plan base de recomposición'
                            disabled={isSavingTemplate}
                            maxLength={120}
                            aria-invalid={Boolean(templateSaveError)}
                        />
                        {templateSaveError ? (
                            <p className='text-sm text-destructive'>
                                {templateSaveError}
                            </p>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => setIsTemplateDialogOpen(false)}
                            disabled={isSavingTemplate}>
                            Cancelar
                        </Button>
                        <Button
                            type='button'
                            onClick={handleConfirmTemplateSave}
                            disabled={
                                isSavingTemplate ||
                                templateName.trim().length < 3 ||
                                !onSaveTemplate
                            }>
                            {isSavingTemplate ? (
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : (
                                <FileDown className='mr-2 h-4 w-4' />
                            )}
                            Guardar plantilla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
