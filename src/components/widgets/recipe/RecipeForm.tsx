'use client';

import {useGetFoods} from '@/hooks/use-foods';
import {ExtraIngredientDTO, IngredientDTO} from '@/lib/dto/IngredientDTO';
import {useCallback, useEffect, useRef, useState} from 'react';
import {FormSkeleton} from './FormSkeleton';
import {AnimatePresence, motion} from 'framer-motion';
import {Button} from '@/components/ui/button';
import {
    ChevronLeft,
    ImagePlus,
    Info,
    ListOrdered,
    Loader2,
    Plus,
    Salad,
    Save,
    Trash2,
    Upload,
    UtensilsCrossed,
    X
} from 'lucide-react';
import Link from 'next/link';
import {NutritionCard} from './NutritionCard';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {StepItem} from './StepItem';
import {EmptyState} from './EmptyState';
import {Badge} from '@/components/ui/badge';
import {ExtraIngredientRow} from './ExtraIngredientRow';
import {IngredientRow} from './IngredientRow';
import {cn} from '@/lib/utils';
import {Label} from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {Input} from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {NutritionData, RecipeFormData, Step} from '@/lib/types/recipe-type';

// --- Constants ---
const MEAL_TYPES = [
    {value: 'SMOOTHIE', label: 'Licuado'},
    {value: 'BREAKFAST', label: 'Desayuno'},
    {value: 'SNACK', label: 'Colación'},
    {value: 'LUNCH', label: 'Comida'},
    {value: 'DINNER', label: 'Cena'},
    {value: 'DRINKS', label: 'Bebida'}
];

interface RecipeFormProps {
    mode: 'create' | 'edit';
    initialData?: RecipeFormData | null;
    isLoading?: boolean;
    onSave: (data: RecipeFormData) => Promise<void>;
    onDelete?: () => Promise<void>;
    onCancel: () => void;
}

// --- Helper Functions ---
const generateId = () => Math.random().toString(36).substring(2, 9);
type IngredientUnit = 'GRAM' | 'PIECE' | 'CUP' | 'TBSP' | 'TSP' | 'ML' | 'OZ';
type IngredientUiUnit = 'g' | 'piece' | 'cup' | 'tbsp' | 'tsp' | 'ml' | 'oz';

const UI_TO_DB_UNIT: Record<IngredientUiUnit, IngredientUnit> = {
    g: 'GRAM',
    piece: 'PIECE',
    cup: 'CUP',
    tbsp: 'TBSP',
    tsp: 'TSP',
    ml: 'ML',
    oz: 'OZ'
};

const DB_TO_UI_UNIT: Record<IngredientUnit, IngredientUiUnit> = {
    GRAM: 'g',
    PIECE: 'piece',
    CUP: 'cup',
    TBSP: 'tbsp',
    TSP: 'tsp',
    ML: 'ml',
    OZ: 'oz'
};

const normalizeUiUnit = (value?: string): IngredientUiUnit => {
    if (!value) return 'g';

    const normalized = value.trim().toLowerCase();

    if (normalized === 'gram' || normalized === 'gramo' || normalized === 'gramos') {
        return 'g';
    }

    if (
        normalized === 'piece' ||
        normalized === 'cup' ||
        normalized === 'tbsp' ||
        normalized === 'tsp' ||
        normalized === 'ml' ||
        normalized === 'oz' ||
        normalized === 'g'
    ) {
        return normalized;
    }

    const dbUnit = value.toUpperCase() as IngredientUnit;
    return DB_TO_UI_UNIT[dbUnit] ?? 'g';
};

const toDbUnit = (value?: string): IngredientUnit => {
    const uiUnit = normalizeUiUnit(value);
    return UI_TO_DB_UNIT[uiUnit];
};

export function RecipeForm(props: RecipeFormProps) {
    const {mode, initialData, isLoading, onSave, onDelete, onCancel} = props;

    // Form State
    const [title, setTitle] = useState('');
    const [mealType, setMealType] = useState('');
    const [ingredients, setIngredients] = useState<IngredientDTO[]>([]);
    const [extraIngredients, setExtraIngredients] = useState<
        ExtraIngredientDTO[]
    >([]);
    const [steps, setSteps] = useState<Step[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Image State
    const [recipeImage, setRecipeImage] = useState<string | null>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(
        null
    );
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Autocomplete State
    const [focusedIngredientId, setFocusedIngredientId] = useState<
        string | null
    >(null);

    // Dirty state and unsaved changes
    const [initialFormState, setInitialFormState] = useState<string>('');
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<
        (() => void) | null
    >(null);

    // Hooks
    const {data: allFoods = []} = useGetFoods();

    // Nutrition Data (calculated from ingredients)
    const nutrition: NutritionData = (() => {
        const totals = ingredients.reduce(
            (acc, ing) => {
                const gramsUsed = (() => {
                    if (
                        normalizeUiUnit(ing.unit) === 'g' &&
                        ing.quantity &&
                        (ing.quantity as number) > 0
                    )
                        return ing.quantity as number;
                    return 100;
                })();
                const factor = gramsUsed / 100;
                return {
                    calories:
                        acc.calories + (ing.caloriesPer100g ?? 0) * factor,
                    protein: acc.protein + (ing.proteinPer100g ?? 0) * factor,
                    carbs: acc.carbs + (ing.carbohydratesPer100g ?? 0) * factor,
                    fats: acc.fats + (ing.fatPer100g ?? 0) * factor
                };
            },
            {calories: 0, protein: 0, carbs: 0, fats: 0}
        );
        return {
            calories: Math.round(totals.calories),
            protein: Math.round(totals.protein * 10) / 10,
            carbs: Math.round(totals.carbs * 10) / 10,
            fats: Math.round(totals.fats * 10) / 10
        };
    })();

    // Initialize form with data when available
    useEffect(() => {
        if (initialData && mode === 'edit') {
            setTitle(initialData.title || '');
            setMealType(initialData.mealType || '');
            setIngredients(
                (initialData.ingredients || []).map(item => {
                    const matchedFood = allFoods.find(
                        food =>
                            food.id === item.foodId ||
                            food.name.toLowerCase() ===
                                item.foodId.toLowerCase()
                    );

                    return {
                        id: generateId(),
                        foodId: matchedFood?.id,
                        name: matchedFood?.name ?? item.foodId,
                        quantity: item.quantity ?? item.grams ?? 100,
                        unit: normalizeUiUnit(item.unit),
                        caloriesPer100g: matchedFood?.caloriesPer100g ?? 0,
                        carbohydratesPer100g: matchedFood?.carbsPer100g ?? 0,
                        proteinPer100g: matchedFood?.proteinPer100g ?? 0,
                        fatPer100g: matchedFood?.fatPer100g ?? 0
                    };
                })
            );
            setExtraIngredients(
                (initialData.extraIngredients || []).map(item => ({
                    id: generateId(),
                    name: item.name
                }))
            );
            setSteps(
                (initialData.steps || []).map(item => ({
                    id: generateId(),
                    instruction: item.instruction
                }))
            );
            setRecipeImage(initialData.imageUrl || null);
            setUploadedImageUrl(initialData.imageUrl || null);

            // Store initial state for dirty checking
            const state = JSON.stringify({
                title: initialData.title,
                mealType: initialData.mealType,
                ingredients: initialData.ingredients,
                extraIngredients: initialData.extraIngredients,
                steps: initialData.steps,
                imageUrl: initialData.imageUrl
            });
            setInitialFormState(state);
        } else if (mode === 'create') {
            // Set initial state for create mode
            setUploadedImageUrl(null);
            setInitialFormState(
                JSON.stringify({
                    title: '',
                    mealType: '',
                    ingredients: [],
                    extraIngredients: [],
                    steps: [],
                    imageUrl: null
                })
            );
        }
    }, [initialData, mode, allFoods]);

    // Current form state for dirty checking
    const getCurrentFormState = useCallback(() => {
        return JSON.stringify({
            title,
            mealType,
            ingredients,
            extraIngredients,
            steps,
            imageUrl: recipeImage
        });
    }, [title, mealType, ingredients, extraIngredients, steps, recipeImage]);

    // Check if form has unsaved changes
    const isDirty =
        initialFormState !== '' && getCurrentFormState() !== initialFormState;

    // Handle navigation with unsaved changes
    const handleNavigationWithCheck = useCallback(
        (action: () => void) => {
            if (isDirty) {
                setPendingNavigation(() => action);
                setShowUnsavedDialog(true);
            } else {
                action();
            }
        },
        [isDirty]
    );

    // Confirm leave with unsaved changes
    const confirmLeave = () => {
        setShowUnsavedDialog(false);
        if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
        }
    };

    // Cancel leave
    const cancelLeave = () => {
        setShowUnsavedDialog(false);
        setPendingNavigation(null);
    };

    // Image Handlers
    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Selecciona un archivo de imagen valido.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen no debe exceder 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setRecipeImage(reader.result as string);
        };
        reader.readAsDataURL(file);

        setIsUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/uploads/recipes', {
                method: 'POST',
                body: formData
            });

            const responseBody = await response.json().catch(() => null);

            if (!response.ok || !responseBody?.success) {
                throw new Error(
                    responseBody?.message || 'No se pudo subir la imagen.'
                );
            }

            setUploadedImageUrl(responseBody.data.imageUrl);
        } catch (error) {
            setRecipeImage(null);
            setUploadedImageUrl(null);
            alert(error instanceof Error ? error.message : 'Error inesperado');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const removeImage = () => {
        setRecipeImage(null);
        setUploadedImageUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Ingredient Handlers
    const addIngredient = () => {
        setIngredients([
            ...ingredients,
            {
                id: generateId(),
                foodId: undefined,
                name: '',
                quantity: 100,
                unit: 'g',
                caloriesPer100g: 0,
                carbohydratesPer100g: 0,
                proteinPer100g: 0,
                fatPer100g: 0
            }
        ]);
    };

    const updateIngredient = (
        id: string,
        field: keyof IngredientDTO,
        value: string | number
    ) => {
        setIngredients(
            ingredients.map(ing => {
                if (ing.id !== id) return ing;
                const updated = {...ing, [field]: value};
                if (field === 'name' && typeof value === 'string') {
                    const food = allFoods.find(
                        f => f.name.toLowerCase() === value.toLowerCase()
                    );
                    if (food) {
                        updated.foodId = food.id;
                        updated.caloriesPer100g = food.caloriesPer100g ?? 0;
                        updated.carbohydratesPer100g = food.carbsPer100g ?? 0;
                        updated.proteinPer100g = food.proteinPer100g ?? 0;
                        updated.fatPer100g = food.fatPer100g ?? 0;
                    } else {
                        updated.foodId = undefined;
                    }
                }
                return updated;
            })
        );
    };

    const removeIngredient = (id: string) => {
        setIngredients(ingredients.filter(ing => ing.id !== id));
    };

    const selectIngredientFood = (id: string, foodName: string) => {
        const food = allFoods.find(f => f.name === foodName);
        setIngredients(prev =>
            prev.map(ing =>
                ing.id === id
                    ? {
                          ...ing,
                          foodId: food?.id,
                          name: foodName,
                          caloriesPer100g: food?.caloriesPer100g ?? 0,
                          carbohydratesPer100g: food?.carbsPer100g ?? 0,
                          proteinPer100g: food?.proteinPer100g ?? 0,
                          fatPer100g: food?.fatPer100g ?? 0
                      }
                    : ing
            )
        );
    };

    // Extra Ingredients Handlers
    const addExtraIngredient = () => {
        setExtraIngredients([
            ...extraIngredients,
            {id: generateId(), name: ''}
        ]);
    };

    const updateExtraIngredient = (
        id: string,
        field: keyof ExtraIngredientDTO,
        value: string | number | boolean
    ) => {
        setExtraIngredients(
            extraIngredients.map(ing =>
                ing.id === id ? {...ing, [field]: value} : ing
            )
        );
    };

    const removeExtraIngredient = (id: string) => {
        setExtraIngredients(extraIngredients.filter(ing => ing.id !== id));
    };

    // Autocomplete suggestions

    const getFilteredSuggestions = (name: string) => {
        if (!name) return [];
        const query = name.trim().toLowerCase();
        return allFoods
            .map(food => food.name)
            .filter(foodName => foodName.toLowerCase().includes(query));
    };

    // Steps Handlers

    const addStep = () => {
        setSteps([...steps, {id: generateId(), instruction: ''}]);
    };

    const updateStep = (id: string, instruction: string) => {
        setSteps(
            steps.map(step => (step.id === id ? {...step, instruction} : step))
        );
    };

    const removeStep = (id: string) => {
        setSteps(steps.filter(step => step.id !== id));
    };

    // Save Recipe
    const handleSaveRecipe = async () => {
        if (!title.trim() || !mealType) {
            alert('Agrega titulo y tipo de comida.');
            return;
        }

        const payloadIngredients = ingredients
            .filter(ing => ing.foodId)
            .map(ing => {
                const uiUnit = normalizeUiUnit(ing.unit);
                const quantity =
                    typeof ing.quantity === 'number' && ing.quantity > 0
                        ? ing.quantity
                        : uiUnit === 'g'
                          ? 100
                          : 1;

                return {
                    foodId: ing.foodId as string,
                    quantity,
                    unit: toDbUnit(uiUnit),
                    grams: uiUnit === 'g' ? quantity : 100
                };
            });

        if (payloadIngredients.length === 0) {
            alert('Agrega al menos un ingrediente.');
            return;
        }

        const payloadExtraIngredients = extraIngredients
            .filter(ing => ing.name.trim())
            .map(ing => ({name: ing.name.trim()}));

        const payloadSteps = steps
            .map(step => step.instruction.trim())
            .filter(Boolean)
            .map(instruction => ({instruction}));

        setIsSaving(true);
        try {
            await onSave({
                title: title.trim(),
                imageUrl: uploadedImageUrl ?? undefined,
                mealType,
                ingredients: payloadIngredients,
                extraIngredients: payloadExtraIngredients,
                steps: payloadSteps
            });
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Error inesperado');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete();
        } catch {
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancel = () => {
        handleNavigationWithCheck(onCancel);
    };

    // Show loading skeleton
    if (isLoading) {
        return <FormSkeleton />;
    }

    return (
        <div className='relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
            {/* Header */}
            <motion.div
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className='mb-8'>
                <nav
                    aria-label='breadcrumb'
                    className='flex items-center gap-2 text-sm mb-4'>
                    <button className='flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors'>
                        <Link
                            href='/recetas'
                            className='flex items-center gap-1'>
                            <ChevronLeft className='h-4 w-4' />
                            Volver a Recetas
                        </Link>
                    </button>
                    {isDirty && (
                        <Badge
                            variant='outline'
                            className='ml-2 text-amber-600 border-amber-500/30 bg-amber-500/10'>
                            Cambios sin guardar
                        </Badge>
                    )}
                </nav>

                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
                            {mode === 'create'
                                ? 'Crear receta'
                                : 'Editar receta'}
                        </h1>
                        <p className='text-sm text-muted-foreground mt-1'>
                            {mode === 'create'
                                ? 'Agrega ingredientes, instrucciones y datos nutricionales'
                                : 'Modifica los detalles de tu receta'}
                        </p>
                    </div>
                    <div className='flex items-center gap-3'>
                        {mode === 'edit' && onDelete && (
                            <Button
                                variant='outline'
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className='h-10 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30'>
                                {isDeleting ? (
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                ) : (
                                    <Trash2 className='h-4 w-4 mr-2' />
                                )}
                                Eliminar
                            </Button>
                        )}
                        <Button
                            variant='outline'
                            onClick={handleCancel}
                            className='h-10 px-4'>
                            <X className='h-4 w-4 mr-2' />
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveRecipe}
                            disabled={
                                isSaving ||
                                (mode === 'edit' && !isDirty) ||
                                isUploadingImage
                            } // Disable if not dirty in edit mode
                            className='h-10 px-6 disabled:opacity-50'>
                            {isSaving ? (
                                <motion.div
                                    animate={{rotate: 360}}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        ease: 'linear'
                                    }}>
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                </motion.div>
                            ) : (
                                <Save className='h-4 w-4 mr-2' />
                            )}
                            {mode === 'create'
                                ? 'Crear receta'
                                : 'Guardar cambios'}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* Left Column - Form */}
                <div className='lg:col-span-2 space-y-6'>
                    {/* Basic Info Section */}
                    <Card className='border-border bg-card/50 backdrop-blur-sm'>
                        <CardHeader className='pb-3 border-b border-border'>
                            <CardTitle className='text-base flex items-center gap-2'>
                                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
                                    <Info className='h-4 w-4 text-primary' />
                                </div>
                                Información Básica
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='pt-5 space-y-4'>
                            <div>
                                <Label className='text-sm font-medium mb-2 block'>
                                    Título de la Receta
                                </Label>
                                <Input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder='ej. Ensalada de Pollo a la Plancha'
                                    className='h-11 bg-background/50'
                                />
                            </div>

                            <div>
                                <Label className='text-sm font-medium mb-2 block'>
                                    Tipo de Comida
                                </Label>
                                <Select
                                    value={mealType}
                                    onValueChange={setMealType}>
                                    <SelectTrigger className='h-11 bg-background/50'>
                                        <SelectValue placeholder='Seleccionar tipo de comida' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MEAL_TYPES.map(type => (
                                            <SelectItem
                                                key={type.value}
                                                value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <Label className='text-sm font-medium mb-2 block'>
                                    Imagen de la Receta
                                </Label>
                                <input
                                    ref={fileInputRef}
                                    type='file'
                                    accept='image/*'
                                    onChange={handleFileInputChange}
                                    className='hidden'
                                />

                                <AnimatePresence mode='wait'>
                                    {recipeImage ? (
                                        <motion.div
                                            key='preview'
                                            initial={{opacity: 0, scale: 0.95}}
                                            animate={{opacity: 1, scale: 1}}
                                            exit={{opacity: 0, scale: 0.95}}
                                            className='relative group rounded-xl overflow-hidden border border-border'>
                                            <img
                                                src={recipeImage}
                                                alt='Vista previa de la receta'
                                                className='w-full h-48 object-cover'
                                            />
                                            <div className='absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3'>
                                                <Button
                                                    variant='secondary'
                                                    size='sm'
                                                    onClick={() =>
                                                        fileInputRef.current?.click()
                                                    }
                                                    className='h-9'>
                                                    <Upload className='h-4 w-4 mr-2' />
                                                    Cambiar
                                                </Button>
                                                <Button
                                                    variant='destructive'
                                                    size='sm'
                                                    onClick={removeImage}
                                                    className='h-9'>
                                                    <Trash2 className='h-4 w-4 mr-2' />
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key='dropzone'
                                            initial={{opacity: 0, scale: 0.95}}
                                            animate={{opacity: 1, scale: 1}}
                                            exit={{opacity: 0, scale: 0.95}}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className={cn(
                                                'relative flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed cursor-pointer transition-all',
                                                isDragging
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border bg-secondary/20 hover:border-primary/50 hover:bg-secondary/30'
                                            )}>
                                            <div
                                                className={cn(
                                                    'flex h-14 w-14 items-center justify-center rounded-full mb-3 transition-colors',
                                                    isDragging
                                                        ? 'bg-primary/10'
                                                        : 'bg-secondary/50'
                                                )}>
                                                <ImagePlus
                                                    className={cn(
                                                        'h-7 w-7 transition-colors',
                                                        isDragging
                                                            ? 'text-primary'
                                                            : 'text-muted-foreground'
                                                    )}
                                                />
                                            </div>
                                            <p className='text-sm font-medium text-foreground mb-1'>
                                                {isDragging
                                                    ? 'Suelta la imagen aquí'
                                                    : 'Subir imagen de la receta'}
                                            </p>
                                            <p className='text-xs text-muted-foreground'>
                                                Arrastra y suelta o haz clic
                                                para seleccionar
                                            </p>
                                            <p className='text-xs text-muted-foreground/60 mt-2'>
                                                PNG, JPG hasta 5MB
                                            </p>
                                            {isUploadingImage && (
                                                <p className='text-xs text-primary mt-2'>
                                                    Subiendo imagen...
                                                </p>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ingredients Section */}
                    <Card className='border-border bg-card/50 backdrop-blur-sm'>
                        <CardHeader className='pb-3 border-b border-border'>
                            <div className='flex items-center justify-between'>
                                <CardTitle className='text-base flex items-center gap-2'>
                                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
                                        <UtensilsCrossed className='h-4 w-4 text-primary' />
                                    </div>
                                    Ingredientes
                                    {ingredients.length > 0 && (
                                        <Badge
                                            variant='secondary'
                                            className='ml-2'>
                                            {ingredients.length}
                                        </Badge>
                                    )}
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className='pt-5'>
                            <AnimatePresence mode='popLayout'>
                                {ingredients.length === 0 ? (
                                    <EmptyState
                                        icon={UtensilsCrossed}
                                        title='Sin ingredientes aún'
                                        description='Agrega ingredientes para calcular los valores nutricionales'
                                    />
                                ) : (
                                    <div className='space-y-3'>
                                        {ingredients.map(
                                            (ingredient, index) => (
                                                <IngredientRow
                                                    key={ingredient.id}
                                                    ingredient={ingredient}
                                                    index={index}
                                                    onUpdate={(field, value) =>
                                                        updateIngredient(
                                                            ingredient.id,
                                                            field,
                                                            value
                                                        )
                                                    }
                                                    onRemove={() =>
                                                        removeIngredient(
                                                            ingredient.id
                                                        )
                                                    }
                                                    showSuggestions={
                                                        focusedIngredientId ===
                                                        ingredient.id
                                                    }
                                                    onFocus={() =>
                                                        setFocusedIngredientId(
                                                            ingredient.id
                                                        )
                                                    }
                                                    onBlur={() =>
                                                        setTimeout(
                                                            () =>
                                                                setFocusedIngredientId(
                                                                    null
                                                                ),
                                                            150
                                                        )
                                                    }
                                                    suggestions={getFilteredSuggestions(
                                                        ingredient.name
                                                    )}
                                                    onSelectSuggestion={name =>
                                                        selectIngredientFood(
                                                            ingredient.id,
                                                            name
                                                        )
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                )}
                            </AnimatePresence>

                            <Button
                                variant='outline'
                                onClick={addIngredient}
                                className='w-full mt-4 h-11 border-dashed hover:border-primary hover:bg-primary/5'>
                                <Plus className='h-4 w-4 mr-2' />
                                Agregar Ingrediente
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Extras / Al Gusto Section */}
                    <Card className='border-border bg-card/50 backdrop-blur-sm'>
                        <CardHeader className='pb-3 border-b border-border'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <CardTitle className='text-base flex items-center gap-2'>
                                        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10'>
                                            <Salad className='h-4 w-4 text-amber-500' />
                                        </div>
                                        Extras / al gusto
                                        {extraIngredients.length > 0 && (
                                            <Badge
                                                variant='outline'
                                                className='ml-2 border-amber-500/30 text-amber-600 dark:text-amber-400'>
                                                {extraIngredients.length}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <p className='text-xs text-muted-foreground mt-1 ml-10'>
                                        No afectan el calculo nutricional por
                                        defecto
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className='pt-5'>
                            <AnimatePresence mode='popLayout'>
                                {extraIngredients.length === 0 ? (
                                    <div className='flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5'>
                                        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 mb-3'>
                                            <Salad className='h-6 w-6 text-amber-500' />
                                        </div>
                                        <p className='text-sm font-medium text-foreground mb-1'>
                                            Sin extras
                                        </p>
                                        <p className='text-xs text-muted-foreground text-center'>
                                            Agrega ingredientes como sal,
                                            pimienta, hierbas, etc.
                                        </p>
                                    </div>
                                ) : (
                                    <div className='space-y-3'>
                                        {extraIngredients.map(
                                            (ingredient, index) => (
                                                <ExtraIngredientRow
                                                    key={ingredient.id}
                                                    ingredient={ingredient}
                                                    index={index}
                                                    onUpdate={(field, value) =>
                                                        updateExtraIngredient(
                                                            ingredient.id,
                                                            field,
                                                            value
                                                        )
                                                    }
                                                    onRemove={() =>
                                                        removeExtraIngredient(
                                                            ingredient.id
                                                        )
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                )}
                            </AnimatePresence>

                            <Button
                                variant='outline'
                                onClick={addExtraIngredient}
                                className='w-full mt-4 h-11 border-dashed border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/5 text-amber-600 dark:text-amber-400'>
                                <Plus className='h-4 w-4 mr-2' />
                                Agregar extra
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Instructions Section */}
                    <Card className='border-border bg-card/50 backdrop-blur-sm'>
                        <CardHeader className='pb-3 border-b border-border'>
                            <div className='flex items-center justify-between'>
                                <CardTitle className='text-base flex items-center gap-2'>
                                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
                                        <ListOrdered className='h-4 w-4 text-primary' />
                                    </div>
                                    Instrucciones
                                    {steps.length > 0 && (
                                        <Badge
                                            variant='secondary'
                                            className='ml-2'>
                                            {steps.length} pasos
                                        </Badge>
                                    )}
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className='pt-5'>
                            <AnimatePresence mode='popLayout'>
                                {steps.length === 0 ? (
                                    <EmptyState
                                        icon={ListOrdered}
                                        title='Sin pasos aún'
                                        description='Agrega instrucciones paso a paso para tu receta'
                                    />
                                ) : (
                                    <div className='space-y-3'>
                                        {steps.map((step, index) => (
                                            <StepItem
                                                key={step.id}
                                                step={step}
                                                index={index}
                                                onUpdate={instruction =>
                                                    updateStep(
                                                        step.id,
                                                        instruction
                                                    )
                                                }
                                                onRemove={() =>
                                                    removeStep(step.id)
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>

                            <Button
                                variant='outline'
                                onClick={addStep}
                                className='w-full mt-4 h-11 border-dashed hover:border-primary hover:bg-primary/5'>
                                <Plus className='h-4 w-4 mr-2' />
                                Agregar Paso
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Nutrition Card */}
                <div className='lg:col-span-1'>
                    <NutritionCard nutrition={nutrition} />
                </div>

                {/* Unsaved Changes Dialog */}
                <AlertDialog
                    open={showUnsavedDialog}
                    onOpenChange={setShowUnsavedDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Cambios sin guardar
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Tienes cambios sin guardar. Si sales ahora,
                                perderas todos los cambios realizados.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={cancelLeave}>
                                Seguir editando
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmLeave}
                                className='bg-destructive hover:bg-destructive/90'>
                                Salir sin guardar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
