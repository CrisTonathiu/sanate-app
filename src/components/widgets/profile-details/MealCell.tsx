'use client';

import {Button} from '@/components/ui/button';
import {MealSlot} from '@/lib/interface/meal-interface';
import {Coffee, Apple, Sun, Moon, Replace, Pencil} from 'lucide-react';

export default function MealCell({
    meal,
    mealType,
    onReplace,
    onEdit
}: {
    meal: MealSlot;
    mealType: 'breakfast' | 'snack' | 'lunch' | 'dinner';
    onReplace: () => void;
    onEdit: () => void;
}) {
    const mealIcons = {
        breakfast: Coffee,
        snack: Apple,
        lunch: Sun,
        dinner: Moon
    };
    const Icon = mealIcons[mealType];

    return (
        <div className='group relative flex flex-col rounded-xl border border-border bg-card/50 overflow-hidden transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5'>
            {/* Recipe Image */}
            <div className='relative h-20 w-full overflow-hidden rounded-t-xl bg-secondary/30'>
                {meal.imageUrl ? (
                    <img
                        src={meal.imageUrl}
                        alt={meal.recipeName}
                        className='h-full w-full object-cover transition-transform group-hover:scale-105 rounded-t-xl'
                    />
                ) : (
                    <div className='flex h-full w-full items-center justify-center rounded-t-xl bg-gradient-to-br from-secondary/50 to-secondary'>
                        <Icon className='h-8 w-8 text-muted-foreground/40' />
                    </div>
                )}
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
                        onClick={onEdit}
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
                {(meal.calories || meal.protein) && (
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        {meal.calories && <span>{meal.calories} kcal</span>}
                        {meal.calories && meal.protein && (
                            <span className='text-muted-foreground/40'>|</span>
                        )}
                        {meal.protein && <span>{meal.protein}g proteína</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
