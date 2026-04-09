'use client';

import {useState, useEffect} from 'react';
import {MealSlot, MealIngredientPortion} from '@/lib/interface/meal-interface';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Save} from 'lucide-react';

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
    onClose: () => void;
    onSave: (updatedMeal: MealSlot) => void;
}

export default function MealEditModal({
    meal,
    open,
    onClose,
    onSave
}: MealEditModalProps) {
    const [portions, setPortions] = useState<EditablePortion[]>([]);

    useEffect(() => {
        if (meal?.ingredientPortions) {
            setPortions(
                meal.ingredientPortions.map(p => ({
                    ...p,
                    _grams: String(p.targetGrams),
                    _quantity: String(p.targetQuantity ?? p.targetGrams)
                }))
            );
        }
    }, [meal]);

    if (!meal) return null;

    const isDiscrete = (unit?: string) => unit?.toUpperCase() === 'PIECE';

    function handleGramsChange(idx: number, value: string) {
        setPortions(prev =>
            prev.map((p, i) => (i === idx ? {...p, _grams: value} : p))
        );
    }

    function handleQuantityChange(idx: number, value: string) {
        setPortions(prev =>
            prev.map((p, i) => (i === idx ? {...p, _quantity: value} : p))
        );
    }

    function handleSave() {
        if (!meal) return;
        const updatedPortions: MealIngredientPortion[] = portions.map(p => ({
            ...p,
            targetGrams: Math.round(Math.max(0, Number(p._grams) || 0)),
            targetQuantity: Math.round(
                Math.max(isDiscrete(p.unit) ? 1 : 0, Number(p._quantity) || 0)
            )
        }));

        onSave({
            ...meal,
            id: meal.id ?? '',
            recipeName: meal.recipeName ?? '',
            calories: meal.calories ?? 0,
            protein: meal.protein ?? 0,
            ingredientPortions: updatedPortions
        });
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={open => !open && onClose()}>
            <DialogContent className='max-w-lg'>
                <DialogHeader>
                    <DialogTitle className='text-base font-semibold'>
                        Editar — {meal.recipeName}
                    </DialogTitle>
                </DialogHeader>

                <div className='flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1'>
                    {portions.length === 0 && (
                        <p className='text-sm text-muted-foreground'>
                            Esta receta no tiene ingredientes registrados.
                        </p>
                    )}
                    {portions.map((portion, idx) => {
                        const discrete = isDiscrete(portion.unit);
                        const label = unitLabel(portion.unit);
                        return (
                            <div
                                key={idx}
                                className='flex items-center gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-2'>
                                <span className='flex-1 text-sm font-medium text-foreground truncate'>
                                    {portion.ingredientName}
                                </span>
                                <div className='flex items-center gap-2 shrink-0'>
                                    {discrete ? (
                                        <label className='flex items-center gap-1.5'>
                                            <span className='text-xs text-muted-foreground'>
                                                Cantidad
                                            </span>
                                            <Input
                                                type='number'
                                                min={1}
                                                step={1}
                                                value={portion._quantity}
                                                onChange={e =>
                                                    handleQuantityChange(
                                                        idx,
                                                        e.target.value
                                                    )
                                                }
                                                className='h-8 w-20 text-sm'
                                            />
                                            <span className='text-xs text-muted-foreground'>
                                                {label}
                                            </span>
                                        </label>
                                    ) : (
                                        <>
                                            <label className='flex items-center gap-1.5'>
                                                <span className='text-xs text-muted-foreground'>
                                                    {label === 'g'
                                                        ? 'Gramos'
                                                        : 'Cantidad'}
                                                </span>
                                                <Input
                                                    type='number'
                                                    min={0}
                                                    step={
                                                        label === 'g' ? 5 : 0.1
                                                    }
                                                    value={
                                                        label === 'g'
                                                            ? portion._grams
                                                            : portion._quantity
                                                    }
                                                    onChange={e =>
                                                        label === 'g'
                                                            ? handleGramsChange(
                                                                  idx,
                                                                  e.target.value
                                                              )
                                                            : handleQuantityChange(
                                                                  idx,
                                                                  e.target.value
                                                              )
                                                    }
                                                    className='h-8 w-24 text-sm'
                                                />
                                                <span className='text-xs text-muted-foreground'>
                                                    {label}
                                                </span>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <DialogFooter>
                    <Button variant='outline' size='sm' onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button size='sm' onClick={handleSave}>
                        <Save className='h-3.5 w-3.5 mr-1.5' />
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
