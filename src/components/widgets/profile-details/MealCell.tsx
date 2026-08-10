'use client';

import {Button} from '@/components/ui/button';
import {MealType} from '@/lib/config/meal-config';
import {MealSlot} from '@/lib/interface/meal-interface';
import {formatScaledIngredientDisplay} from '@/lib/services/protocol/protocol-meal-portions.mapper';
import {Coffee, Apple, Sun, Moon, Replace, Pencil} from 'lucide-react';
import {useState} from 'react';
import MealEditModal from './MealEditModal';

export default function MealCell({
    meal,
    mealType,
    dayLabel,
    mealTypeLabel,
    multiWeekPlan = false,
    onReplace,
    onEdit
}: {
    meal: MealSlot;
    mealType: MealType;
    dayLabel?: string;
    mealTypeLabel?: string;
    multiWeekPlan?: boolean;
    onReplace: () => void;
    onEdit: (
        updatedMeal: MealSlot,
        options?: {applyToAllDays?: boolean}
    ) => void;
}) {
    const mealIcons = {
        smoothie: Coffee,
        breakfast: Coffee,
        snack1: Apple,
        snack2: Apple,
        lunch: Sun,
        dinner: Moon,
        drinks: Coffee
    };
    const Icon = mealIcons[mealType];
    const [editOpen, setEditOpen] = useState<boolean>(false);
    const [showAllIngredients, setShowAllIngredients] = useState(false);
    const [showWarnings, setShowWarnings] = useState(false);

    const getDisplayPortion = (portion: {
        ingredientName?: string;
        targetQuantity?: number;
        targetGrams: number;
        baseQuantity?: number;
        baseGrams?: number;
        unit?: string;
        isDiscrete?: boolean;
    }) => {
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
    };

    if (!meal) return null;

    return (
        <>
            <div
                className={`group relative flex w-full min-w-48 flex-col rounded-xl border bg-card/50 overflow-hidden transition-all hover:shadow-md hover:shadow-primary/5 ${meal.isRealistic === false ? 'border-red-500 hover:border-red-400' : 'border-border hover:border-primary/40'}`}>
                {/* Recipe Image */}
                <div className='relative h-20 w-full overflow-hidden rounded-t-xl bg-secondary/30'>
                    <img
                        src={meal.imageUrl ?? '/recipe-placeholder.svg'}
                        alt={meal.recipeName}
                        onError={e => {
                            e.currentTarget.src = '/recipe-placeholder.svg';
                        }}
                        className='h-full w-full object-cover transition-transform group-hover:scale-105 rounded-t-xl'
                    />
                    {/* Meal type badge */}
                    <div className='absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-sm'>
                        <Icon className='h-3.5 w-3.5 text-primary' />
                    </div>
                    {/* Hover overlay with actions */}
                    <div className='absolute inset-0 flex items-center justify-center gap-2 rounded-t-xl bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity'>
                        <Button
                            variant='secondary'
                            size='sm'
                            onClick={onReplace}
                            className='h-8 px-3 text-xs shadow-sm'>
                            <Replace className='h-3 w-3 mr-1' />
                            Reemplazar
                        </Button>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setEditOpen(true)}
                            className='h-8 px-3 text-xs bg-background shadow-sm'>
                            <Pencil className='h-3 w-3 mr-1' />
                            Editar
                        </Button>
                    </div>
                </div>

                {/* Recipe Info */}
                <div className='flex flex-col gap-1 p-2.5'>
                    <span className='text-sm font-medium text-foreground line-clamp-1'>
                        {meal.recipeName}
                    </span>
                    {meal.ingredientPortions &&
                        meal.ingredientPortions.length > 0 && (
                            <div className='flex flex-col gap-0.5'>
                                {(showAllIngredients
                                    ? meal.ingredientPortions
                                    : meal.ingredientPortions.slice(0, 3)
                                ).map((ing, idx) => {
                                    const {amount, unitLabel} =
                                        getDisplayPortion(ing);

                                    return (
                                        <span
                                            key={idx}
                                            className='text-xs text-muted-foreground truncate'>
                                            {amount} {unitLabel}{' '}
                                            {ing.ingredientName}
                                        </span>
                                    );
                                })}
                                {meal.ingredientPortions.length > 3 && (
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setShowAllIngredients(prev => !prev)
                                        }
                                        className='w-fit text-left text-xs text-muted-foreground/60 italic transition-colors hover:text-muted-foreground'>
                                        {showAllIngredients
                                            ? 'Ver menos'
                                            : `+${meal.ingredientPortions.length - 3} más`}
                                    </button>
                                )}
                            </div>
                        )}

                    {(meal.calories != null && meal.calories > 0) && (
                        <span className='text-xs text-muted-foreground mt-1'>
                            {meal.calories} kcal
                        </span>
                    )}

                    {(meal.protein != null && meal.protein > 0) && (
                        <span className='text-xs text-muted-foreground'>
                            {meal.protein} g proteína
                        </span>
                    )}

                    {(meal.carbs != null && meal.carbs > 0) && (
                        <span className='text-xs text-muted-foreground'>
                            {meal.carbs} g carbohidratos
                        </span>
                    )}

                    {(meal.fat != null && meal.fat > 0) && (
                        <span className='text-xs text-muted-foreground'>
                            {meal.fat} g grasa
                        </span>
                    )}

                    {meal.isRealistic === false &&
                        meal.warnings &&
                        meal.warnings.length > 0 && (
                            <div className='mt-1 flex flex-col gap-0.5'>
                                <button
                                    type='button'
                                    onClick={() =>
                                        setShowWarnings(prev => !prev)
                                    }
                                    className='w-fit text-left text-xs font-medium text-red-500 transition-colors hover:text-red-600'>
                                    ⚠ {meal.warnings.length}{' '}
                                    {meal.warnings.length === 1
                                        ? 'advertencia'
                                        : 'advertencias'}
                                    {showWarnings ? ' · Ocultar' : ' · Ver'}
                                </button>
                                {showWarnings &&
                                    meal.warnings.map((w, i) => (
                                        <span
                                            key={i}
                                            className='text-xs text-red-500'>
                                            ⚠ {w}
                                        </span>
                                    ))}
                            </div>
                        )}
                </div>
            </div>

            <MealEditModal
                meal={meal}
                open={editOpen}
                onOpen={setEditOpen}
                dayLabel={dayLabel}
                mealTypeLabel={mealTypeLabel}
                multiWeekPlan={multiWeekPlan}
                onSave={(updatedMeal, options) => {
                    onEdit(updatedMeal, options);
                }}
            />
        </>
    );
}
