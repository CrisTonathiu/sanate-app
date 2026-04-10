'use client';

import {useEffect, useState} from 'react';
import {MealSlot, MealIngredientPortion} from '@/lib/interface/meal-interface';
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

interface EditablePortion extends MealIngredientPortion {
    _grams: string;
    _quantity: string;
}

interface MealEditModalProps {
    meal: MealSlot | null;
    open: boolean;
    onOpen: (open: boolean) => void;
    onSave: (updatedMeal: MealSlot) => void;
}

export default function MealEditModal({
    open,
    onOpen,
    meal,
    onSave
}: MealEditModalProps) {
    const [portions, setPortions] = useState<EditablePortion[]>([]);
    const [recipeName, setRecipeName] = useState('');

    const initializeIngredients = () => {
        if (!meal) return;
        setRecipeName(meal.recipeName);
        setPortions(
            (meal.ingredientPortions ?? []).map(p => ({
                ...p,
                _grams: String(p.targetGrams),
                _quantity: String(p.targetQuantity ?? p.targetGrams)
            }))
        );
    };

    useEffect(() => {
        if (open) initializeIngredients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, meal]);

    const isDiscrete = (unit?: string) => unit?.toUpperCase() === 'PIECE';

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

    const handleSave = () => {
        if (!meal) return;
        const updatedPortions: MealIngredientPortion[] = portions.map(p => ({
            ...p,
            targetGrams: Math.round(Math.max(0, Number(p._grams) || 0)),
            targetQuantity: Math.round(
                Math.max(isDiscrete(p.unit) ? 1 : 0, Number(p._quantity) || 0)
            )
        }));
        onSave({...meal, recipeName, ingredientPortions: updatedPortions});
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
                            {meal.calories}
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
                            {meal.protein}
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
                            {meal.carbs ?? 0}
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
                            {meal.fat ?? 0}
                        </span>
                        <span className='text-xs text-muted-foreground ml-1'>
                            g
                        </span>
                    </div>
                </div>

                {/* Ingredients List */}
                <div className='flex-1 overflow-y-auto mt-4 space-y-3 pr-1'>
                    <Label className='text-sm font-medium'>
                        Ingredientes ({portions.length})
                    </Label>

                    <AnimatePresence mode='popLayout'>
                        {portions.map((portion, idx) => {
                            const discrete = isDiscrete(portion.unit);
                            const label = unitLabel(portion.unit);
                            const isGrams = label === 'g';

                            return (
                                <motion.div
                                    key={idx}
                                    initial={{opacity: 0, height: 0}}
                                    animate={{opacity: 1, height: 'auto'}}
                                    exit={{opacity: 0, height: 0}}
                                    className='p-3 rounded-lg border border-border bg-card space-y-3'>
                                    {/* Name + Remove */}
                                    <div className='flex items-center gap-2'>
                                        <span className='flex-1 text-sm font-medium text-foreground truncate'>
                                            {portion.ingredientName}
                                        </span>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={() =>
                                                removeIngredient(idx)
                                            }
                                            className='h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10'>
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
                                                type='number'
                                                min={discrete ? 1 : 0}
                                                step={
                                                    discrete
                                                        ? 1
                                                        : isGrams
                                                          ? 5
                                                          : 0.1
                                                }
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
                <div className='flex justify-end gap-3 pt-4 mt-4 border-t border-border'>
                    <Button variant='outline' onClick={() => onOpen(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                        <Save className='h-4 w-4 mr-2' />
                        Guardar cambios
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
