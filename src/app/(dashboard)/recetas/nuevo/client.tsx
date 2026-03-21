'use client';

import {useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {motion, AnimatePresence} from 'framer-motion';
import {
    ChevronLeft,
    ImagePlus,
    Info,
    ListOrdered,
    Plus,
    Salad,
    Save,
    Trash2,
    Upload,
    UtensilsCrossed,
    X
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {Badge} from '@/components/ui/badge';
import {EmptyState} from '@/components/widgets/recipe/EmptyState';
import {IngredientRow} from '@/components/widgets/recipe/IngredientRow';
import {ExtraIngredientDTO, IngredientDTO} from '@/lib/dto/IngredientDTO';
import {useGetFoods} from '@/hooks/use-foods';
import {StepItem} from '@/components/widgets/recipe/StepItem';
import {NutritionCard} from '@/components/widgets/recipe/NutritionCard';
import {ExtraIngredientRow} from '@/components/widgets/recipe/ExtraIngredientRow';
import {cn} from '@/lib/utils';

interface Step {
    id: string;
    instruction: string;
}

interface NutritionData {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

// --- Constants ---
const MEAL_TYPES = [
    {value: 'SMOOTHIE', label: 'Licuado'},
    {value: 'BREAKFAST', label: 'Desayuno'},
    {value: 'SNACK', label: 'Colación'},
    {value: 'LUNCH', label: 'Comida'},
    {value: 'DINNER', label: 'Cena'},
    {value: 'DRINKS', label: 'Bebida'}
];

// --- Helper Functions ---
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function ClientPage() {
    const router = useRouter();

    // Form State
    const [title, setTitle] = useState('');
    const [mealType, setMealType] = useState('');
    const [ingredients, setIngredients] = useState<IngredientDTO[]>([]);
    const [extraIngredients, setExtraIngredients] = useState<
        ExtraIngredientDTO[]
    >([]);
    const [steps, setSteps] = useState<Step[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Image State
    const [recipeImage, setRecipeImage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Hooks
    const {data: allFoods = []} = useGetFoods();

    // Nutrition Data (calculated from ingredients)
    const nutrition: NutritionData = (() => {
        const totals = ingredients.reduce(
            (acc, ing) => {
                const gramsUsed = (() => {
                    if (ing.grams && (ing.grams as number) > 0)
                        return ing.grams as number;
                    if (
                        ing.unit === 'g' &&
                        ing.quantity &&
                        (ing.quantity as number) > 0
                    )
                        return ing.quantity as number;
                    return 0;
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

    // Autocomplete State
    const [focusedIngredientId, setFocusedIngredientId] = useState<
        string | null
    >(null);

    // Image Handlers
    const handleImageUpload = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setRecipeImage(reader.result as string);
            };
            reader.readAsDataURL(file);
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
                name: '',
                quantity: 0,
                grams: 0,
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
                        updated.caloriesPer100g = food.caloriesPer100g ?? 0;
                        updated.carbohydratesPer100g = food.carbsPer100g ?? 0;
                        updated.proteinPer100g = food.proteinPer100g ?? 0;
                        updated.fatPer100g = food.fatPer100g ?? 0;
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
        console.log(`[selectIngredientFood] Selected food:`, food);
        setIngredients(prev =>
            prev.map(ing =>
                ing.id === id
                    ? {
                          ...ing,
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

    const getFilteredSuggestions = (name: string) => {
        if (!name) return [];
        const query = name.trim().toLowerCase();
        return allFoods
            .map(food => food.name)
            .filter(foodName => foodName.toLowerCase().includes(query));
    };

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

    const handleSaveRecipe = async () => {
        if (!title.trim() || !mealType) {
            alert('Agrega titulo y tipo de comida.');
            return;
        }

        const payloadIngredients = ingredients
            .filter(ing => ing.name.trim() && (Number(ing.grams) || 0) > 0)
            .map(ing => ({
                foodId: ing.name.trim(),
                grams: Number(ing.grams)
            }));

        if (payloadIngredients.length === 0) {
            alert('Agrega al menos un ingrediente con gramos.');
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
            const response = await fetch('/api/recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title.trim(),
                    mealType,
                    ingredients: payloadIngredients,
                    extraIngredients: payloadExtraIngredients,
                    steps: payloadSteps
                })
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(
                    errorBody?.message || 'No se pudo crear la receta.'
                );
            }

            router.push('/recetas');
            router.refresh();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Error inesperado');
        } finally {
            setIsSaving(false);
        }
    };

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
                        <ChevronLeft className='h-4 w-4' />
                        Volver a Recetas
                    </button>
                </nav>

                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
                            Crear Receta
                        </h1>
                        <p className='text-sm text-muted-foreground mt-1'>
                            Agrega ingredientes, instrucciones y datos
                            nutricionales
                        </p>
                    </div>
                    <div className='flex items-center gap-3'>
                        <Button variant='outline' className='h-10 px-4'>
                            <X className='h-4 w-4 mr-2' />
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveRecipe}
                            disabled={isSaving}
                            className='h-10 px-6'>
                            {isSaving ? (
                                <motion.div
                                    animate={{rotate: 360}}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        ease: 'linear'
                                    }}>
                                    <Save className='h-4 w-4 mr-2' />
                                </motion.div>
                            ) : (
                                <Save className='h-4 w-4 mr-2' />
                            )}
                            Guardar Receta
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
            </div>
        </div>
    );
}
