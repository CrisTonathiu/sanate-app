'use client';

import {useEffect, useMemo, useState} from 'react';
import {MealSlot, MealIngredientPortion} from '@/lib/interface/meal-interface';
import {
    formatIngredientQuantityInput,
    parseIngredientQuantity,
    resolveIngredientNutritionGrams
} from '@/lib/utils/ingredient-quantity';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
    Beef,
    Droplets,
    Flame,
    Pencil,
    Plus,
    Save,
    Trash2,
    UtensilsCrossed,
    Wheat
} from 'lucide-react';
import {Label} from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {AnimatePresence, motion} from 'framer-motion';
import {Food, useGetFoods} from '@/hooks/use-foods';

const UNIT_OPTIONS = [
    {value: 'GRAM', label: 'g'},
    {value: 'PIECE', label: 'pz'},
    {value: 'CUP', label: 'tz'},
    {value: 'TBSP', label: 'cda'},
    {value: 'TSP', label: 'cdita'},
    {value: 'ML', label: 'ml'},
    {value: 'OZ', label: 'oz'}
];

const UNIT_LABELS: Record<string, string> = {
    GRAM: 'g',
    PIECE: 'pz',
    CUP: 'tz',
    TBSP: 'cda',
    TSP: 'cdita',
    ML: 'ml',
    OZ: 'oz'
};

function unitLabel(unit?: string) {
    if (!unit) return 'g';
    return UNIT_LABELS[unit.toUpperCase()] ?? unit;
}

function round1(value: number) {
    return Number(value.toFixed(1));
}

function foodCaloriesPer100g(food: Food) {
    if (food.caloriesPer100g != null) {
        return food.caloriesPer100g;
    }

    return (
        (food.proteinPer100g ?? 0) * 4 +
        (food.carbsPer100g ?? 0) * 4 +
        (food.fatPer100g ?? 0) * 9
    );
}

function nutritionFromFood(food: Food) {
    return {
        baseCalories: foodCaloriesPer100g(food),
        baseProtein: food.proteinPer100g ?? 0,
        baseCarbs: food.carbsPer100g ?? 0,
        baseFat: food.fatPer100g ?? 0
    };
}

function computePortionNutrition(portion: {
    targetGrams: number;
    baseCalories?: number;
    baseProtein?: number;
    baseCarbs?: number;
    baseFat?: number;
}) {
    const ratio = portion.targetGrams / 100;

    return {
        calories: (portion.baseCalories ?? 0) * ratio,
        protein: (portion.baseProtein ?? 0) * ratio,
        carbs: (portion.baseCarbs ?? 0) * ratio,
        fat: (portion.baseFat ?? 0) * ratio
    };
}

function computeMealTotals(portions: MealIngredientPortion[]) {
    return portions.reduce(
        (sum, portion) => {
            const nutrition = computePortionNutrition(portion);

            return {
                calories: sum.calories + nutrition.calories,
                protein: sum.protein + nutrition.protein,
                carbs: sum.carbs + nutrition.carbs,
                fat: sum.fat + nutrition.fat
            };
        },
        {calories: 0, protein: 0, carbs: 0, fat: 0}
    );
}

function isDiscreteUnit(unit?: string) {
    return unit?.toUpperCase() === 'PIECE';
}

function resolveTargetGrams(portion: EditablePortion) {
    if (unitLabel(portion.unit) === 'g') {
        return Math.round(Math.max(0, Number(portion._grams) || 0));
    }

    const targetQuantity = resolveTargetQuantity(portion);
    const referenceGramsPerUnit =
        (portion.baseGrams || 100) / (portion.baseQuantity || 1);

    return Math.round(
        resolveIngredientNutritionGrams(
            targetQuantity,
            portion.unit,
            referenceGramsPerUnit
        )
    );
}

function resolveTargetQuantity(portion: EditablePortion) {
    const parsed = parseIngredientQuantity(portion._quantity);
    if (parsed == null || parsed < 0) {
        return 0;
    }

    return Math.round(parsed * 1000) / 1000;
}

function createEmptyPortion(): EditablePortion {
    return {
        _key: crypto.randomUUID(),
        _isNew: true,
        ingredientName: '',
        baseGrams: 100,
        targetGrams: 100,
        baseQuantity: 100,
        targetQuantity: 100,
        unit: 'GRAM',
        baseCalories: 0,
        baseProtein: 0,
        baseCarbs: 0,
        baseFat: 0,
        _grams: '100',
        _quantity: '100'
    };
}

interface EditablePortion extends MealIngredientPortion {
    _key: string;
    _isNew?: boolean;
    _grams: string;
    _quantity: string;
}

interface MealEditModalProps {
    meal: MealSlot | null;
    open: boolean;
    onOpen: (open: boolean) => void;
    dayLabel?: string;
    mealTypeLabel?: string;
    multiWeekPlan?: boolean;
    onSave: (
        updatedMeal: MealSlot,
        options?: {applyToAllDays?: boolean}
    ) => void;
}

export default function MealEditModal({
    open,
    onOpen,
    meal,
    dayLabel,
    mealTypeLabel,
    multiWeekPlan = false,
    onSave
}: MealEditModalProps) {
    const {data: allFoods = []} = useGetFoods();
    const [portions, setPortions] = useState<EditablePortion[]>([]);
    const [recipeName, setRecipeName] = useState('');
    const [applyToAllDays, setApplyToAllDays] = useState(false);
    const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<
        number | null
    >(null);

    const initializeIngredients = () => {
        if (!meal) return;
        setRecipeName(meal.recipeName);
        setPortions(
            (meal.ingredientPortions ?? []).map(p => ({
                ...p,
                _key: p.ingredientId ?? crypto.randomUUID(),
                _grams: String(p.targetGrams),
                _quantity: formatIngredientQuantityInput(
                    p.targetQuantity ?? p.targetGrams,
                    p.unit,
                    {isDiscrete: p.isDiscrete}
                )
            }))
        );
        setActiveSuggestionIdx(null);
        setApplyToAllDays(false);
    };

    useEffect(() => {
        if (open) initializeIngredients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, meal]);

    const isDiscrete = isDiscreteUnit;

    const updateGrams = (idx: number, value: string) =>
        setPortions(prev =>
            prev.map((p, i) => (i === idx ? {...p, _grams: value} : p))
        );

    const updateQuantity = (idx: number, value: string) =>
        setPortions(prev =>
            prev.map((p, i) => (i === idx ? {...p, _quantity: value} : p))
        );

    const updateUnit = (idx: number, value: string) =>
        setPortions(prev =>
            prev.map((p, i) => (i === idx ? {...p, unit: value} : p))
        );

    const removeIngredient = (idx: number) =>
        setPortions(prev => prev.filter((_, i) => i !== idx));

    const addIngredient = () => {
        setPortions(prev => [...prev, createEmptyPortion()]);
    };

    const getFilteredSuggestions = (name: string) => {
        const query = name.trim().toLowerCase();
        if (!query) return [];

        return allFoods
            .filter(food => food.name.toLowerCase().includes(query))
            .slice(0, 5);
    };

    const applyFoodToPortion = (idx: number, food: Food) =>
        setPortions(prev =>
            prev.map((p, i) =>
                i === idx
                    ? {
                          ...p,
                          ingredientName: food.name,
                          _isNew: false,
                          ...nutritionFromFood(food)
                      }
                    : p
            )
        );

    const updateIngredientName = (idx: number, name: string) => {
        const matchedFood = allFoods.find(
            food => food.name.toLowerCase() === name.trim().toLowerCase()
        );

        setPortions(prev =>
            prev.map((p, i) => {
                if (i !== idx) return p;

                if (matchedFood) {
                    return {
                        ...p,
                        ingredientName: matchedFood.name,
                        _isNew: false,
                        ...nutritionFromFood(matchedFood)
                    };
                }

                return {
                    ...p,
                    ingredientName: name,
                    baseCalories: 0,
                    baseProtein: 0,
                    baseCarbs: 0,
                    baseFat: 0
                };
            })
        );
    };

    const selectFood = (idx: number, food: Food) => {
        applyFoodToPortion(idx, food);
        setActiveSuggestionIdx(null);
    };

    const previewPortions = useMemo(
        () =>
            portions
                .filter(portion => portion.ingredientName.trim())
                .map(portion => ({
                    ...portion,
                    targetGrams: resolveTargetGrams(portion),
                    targetQuantity: resolveTargetQuantity(portion)
                })),
        [portions]
    );

    const previewTotals = useMemo(
        () => computeMealTotals(previewPortions),
        [previewPortions]
    );

    const handleSave = () => {
        if (!meal) return;

        const updatedPortions: MealIngredientPortion[] = previewPortions.map(
            ({_key, _isNew, _grams, _quantity, ...portion}) => ({
                ...portion,
                baseGrams: portion.baseGrams ?? portion.targetGrams,
                baseQuantity:
                    portion.baseQuantity ?? portion.targetQuantity ?? portion.targetGrams
            })
        );

        const totals = computeMealTotals(updatedPortions);

        onSave(
            {
                ...meal,
                recipeName,
                calories: Math.round(totals.calories),
                protein: round1(totals.protein),
                carbs: round1(totals.carbs),
                fat: round1(totals.fat),
                ingredientPortions: updatedPortions
            },
            {applyToAllDays}
        );
        onOpen(false);
    };

    if (!meal) return null;

    return (
        <Dialog open={open} onOpenChange={onOpen}>
            <DialogContent className='max-w-2xl max-h-[85vh] overflow-hidden flex flex-col'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <Pencil className='h-5 w-5 text-primary' />
                        Editar receta
                    </DialogTitle>
                    {dayLabel && mealTypeLabel ? (
                        <p className='text-sm text-muted-foreground'>
                            {dayLabel} · {mealTypeLabel}
                        </p>
                    ) : null}
                </DialogHeader>

                {/* Recipe Name */}
                <div className='space-y-2 mt-2'>
                    <Label className='text-sm font-medium'>
                        Nombre de la receta
                    </Label>
                    <Input
                        value={recipeName}
                        onChange={e => setRecipeName(e.target.value)}
                        className='bg-background'
                    />
                </div>

                {/* Total Macros Summary */}
                <div className='grid grid-cols-4 gap-3 p-4 rounded-xl bg-secondary/30 border border-border mt-4'>
                    <div className='text-center'>
                        <div className='flex items-center justify-center gap-1.5 mb-1'>
                            <Flame className='h-4 w-4 text-orange-500' />
                            <span className='text-xs text-muted-foreground'>
                                Calorías
                            </span>
                        </div>
                        <span className='text-lg font-bold text-foreground'>
                            {Math.round(previewTotals.calories)}
                        </span>
                        <span className='text-xs text-muted-foreground ml-1'>
                            kcal
                        </span>
                    </div>
                    <div className='text-center'>
                        <div className='flex items-center justify-center gap-1.5 mb-1'>
                            <Beef className='h-4 w-4 text-red-500' />
                            <span className='text-xs text-muted-foreground'>
                                Proteína
                            </span>
                        </div>
                        <span className='text-lg font-bold text-foreground'>
                            {round1(previewTotals.protein)}
                        </span>
                        <span className='text-xs text-muted-foreground ml-1'>
                            g
                        </span>
                    </div>
                    <div className='text-center'>
                        <div className='flex items-center justify-center gap-1.5 mb-1'>
                            <Wheat className='h-4 w-4 text-amber-500' />
                            <span className='text-xs text-muted-foreground'>
                                Carbos
                            </span>
                        </div>
                        <span className='text-lg font-bold text-foreground'>
                            {round1(previewTotals.carbs)}
                        </span>
                        <span className='text-xs text-muted-foreground ml-1'>
                            g
                        </span>
                    </div>
                    <div className='text-center'>
                        <div className='flex items-center justify-center gap-1.5 mb-1'>
                            <Droplets className='h-4 w-4 text-blue-500' />
                            <span className='text-xs text-muted-foreground'>
                                Grasas
                            </span>
                        </div>
                        <span className='text-lg font-bold text-foreground'>
                            {round1(previewTotals.fat)}
                        </span>
                        <span className='text-xs text-muted-foreground ml-1'>
                            g
                        </span>
                    </div>
                </div>

                {/* Ingredients List */}
                <div className='flex-1 overflow-y-auto mt-4 space-y-3 pr-1'>
                    <div className='flex items-center justify-between gap-3'>
                        <Label className='text-sm font-medium'>
                            Ingredientes ({portions.length})
                        </Label>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={addIngredient}
                            className='h-8'>
                            <Plus className='h-4 w-4 mr-1.5' />
                            Agregar ingrediente
                        </Button>
                    </div>

                    <AnimatePresence mode='popLayout'>
                        {portions.map((portion, idx) => {
                            const discrete = isDiscrete(portion.unit);
                            const label = unitLabel(portion.unit);
                            const isGrams = label === 'g';
                            const suggestions = getFilteredSuggestions(
                                portion.ingredientName
                            );
                            const showSuggestions =
                                activeSuggestionIdx === idx &&
                                suggestions.length > 0;

                            return (
                                <motion.div
                                    key={portion._key}
                                    initial={{opacity: 0, height: 0}}
                                    animate={{opacity: 1, height: 'auto'}}
                                    exit={{opacity: 0, height: 0}}
                                    className='p-3 rounded-lg border border-border bg-card space-y-3'>
                                    {/* Name + Remove */}
                                    <div className='flex items-start gap-2'>
                                        <div className='relative flex-1'>
                                            {portion._isNew ? (
                                                <>
                                                    <Label className='text-xs text-muted-foreground mb-1 block'>
                                                        Ingrediente
                                                    </Label>
                                                    <Input
                                                        value={
                                                            portion.ingredientName
                                                        }
                                                        onChange={e =>
                                                            updateIngredientName(
                                                                idx,
                                                                e.target.value
                                                            )
                                                        }
                                                        onFocus={() =>
                                                            setActiveSuggestionIdx(
                                                                idx
                                                            )
                                                        }
                                                        onBlur={() =>
                                                            setTimeout(
                                                                () =>
                                                                    setActiveSuggestionIdx(
                                                                        current =>
                                                                            current ===
                                                                            idx
                                                                                ? null
                                                                                : current
                                                                    ),
                                                                150
                                                            )
                                                        }
                                                        placeholder='Buscar alimento...'
                                                        className='h-9 bg-background'
                                                    />
                                                    <AnimatePresence>
                                                        {showSuggestions && (
                                                            <motion.div
                                                                initial={{
                                                                    opacity: 0,
                                                                    y: -5
                                                                }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    y: 0
                                                                }}
                                                                exit={{
                                                                    opacity: 0,
                                                                    y: -5
                                                                }}
                                                                className='absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden'>
                                                                {suggestions.map(
                                                                    food => (
                                                                        <button
                                                                            key={
                                                                                food.id
                                                                            }
                                                                            type='button'
                                                                            onMouseDown={() =>
                                                                                selectFood(
                                                                                    idx,
                                                                                    food
                                                                                )
                                                                            }
                                                                            className='w-full px-3 py-2 text-left text-sm hover:bg-secondary/50 transition-colors'>
                                                                            {
                                                                                food.name
                                                                            }
                                                                        </button>
                                                                    )
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </>
                                            ) : (
                                                <span className='block pt-1 text-sm font-medium text-foreground truncate'>
                                                    {portion.ingredientName}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={() =>
                                                removeIngredient(idx)
                                            }
                                            className='h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0'>
                                            <Trash2 className='h-4 w-4' />
                                        </Button>
                                    </div>

                                    {/* Quantity + Unit */}
                                    <div className='flex items-end gap-3'>
                                        <div className='flex-1'>
                                            <Label className='text-xs text-muted-foreground mb-1 block'>
                                                {discrete
                                                    ? 'Cantidad'
                                                    : isGrams
                                                      ? 'Gramos'
                                                      : 'Cantidad'}
                                            </Label>
                                            <Input
                                                type='text'
                                                inputMode='decimal'
                                                value={
                                                    discrete || !isGrams
                                                        ? portion._quantity
                                                        : portion._grams
                                                }
                                                onChange={e => {
                                                    if (discrete || !isGrams) {
                                                        updateQuantity(
                                                            idx,
                                                            e.target.value
                                                        );
                                                    } else {
                                                        updateGrams(
                                                            idx,
                                                            e.target.value
                                                        );
                                                    }
                                                }}
                                                onBlur={e => {
                                                    if (!discrete && isGrams) {
                                                        return;
                                                    }

                                                    const parsed =
                                                        parseIngredientQuantity(
                                                            e.target.value
                                                        );
                                                    if (
                                                        parsed != null &&
                                                        parsed >= 0
                                                    ) {
                                                        updateQuantity(
                                                            idx,
                                                            formatIngredientQuantityInput(
                                                                parsed,
                                                                portion.unit,
                                                                {
                                                                    isDiscrete:
                                                                        portion.isDiscrete
                                                                }
                                                            )
                                                        );
                                                    }
                                                }}
                                                placeholder={
                                                    portion.isDiscrete
                                                        ? '3'
                                                        : '1/3 o 0.33'
                                                }
                                                className='h-9 bg-background'
                                            />
                                        </div>
                                        <div className='w-28'>
                                            <Label className='text-xs text-muted-foreground mb-1 block'>
                                                Unidad
                                            </Label>
                                            <Select
                                                value={
                                                    portion.unit?.toUpperCase() ??
                                                    'GRAM'
                                                }
                                                onValueChange={value =>
                                                    updateUnit(idx, value)
                                                }>
                                                <SelectTrigger className='h-9 bg-background'>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {UNIT_OPTIONS.map(opt => (
                                                        <SelectItem
                                                            key={opt.value}
                                                            value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {portions.length === 0 && (
                        <div className='text-center py-8 text-muted-foreground'>
                            <UtensilsCrossed className='h-8 w-8 mx-auto mb-2 opacity-50' />
                            <p className='text-sm'>Sin ingredientes</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className='flex flex-col gap-3 pt-4 mt-4 border-t border-border'>
                    <label className='flex items-start gap-2 cursor-pointer'>
                        <input
                            type='checkbox'
                            checked={applyToAllDays}
                            onChange={e => setApplyToAllDays(e.target.checked)}
                            className='mt-1 h-4 w-4 rounded border-border'
                        />
                        <span className='text-sm text-muted-foreground'>
                            {multiWeekPlan
                                ? 'Aplicar estos ingredientes a todos los días de esta semana que usen esta receta'
                                : 'Aplicar estos ingredientes a todos los días que usen esta receta'}
                        </span>
                    </label>
                    <div className='flex justify-end gap-3'>
                        <Button variant='outline' onClick={() => onOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className='h-4 w-4 mr-2' />
                            Guardar cambios
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
