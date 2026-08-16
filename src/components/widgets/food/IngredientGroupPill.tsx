'use client';

import {getIngredientGroupColor} from '@/lib/ingredient-group-colors';
import {cn} from '@/lib/utils';
import {X} from 'lucide-react';

type IngredientGroupPillProps = {
    name: string;
    color?: string;
    onRemove?: () => void;
    disabled?: boolean;
    className?: string;
};

export function IngredientGroupPill({
    name,
    color,
    onRemove,
    disabled,
    className
}: IngredientGroupPillProps) {
    const palette = getIngredientGroupColor(color);

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium',
                palette.pill,
                className
            )}>
            <span
                className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    palette.swatch
                )}
            />
            <span className='text-[10px] font-semibold uppercase tracking-wider opacity-75'>
                Grupo
            </span>
            <span>{name}</span>
            {onRemove ? (
                <button
                    type='button'
                    onClick={onRemove}
                    disabled={disabled}
                    className='ml-0.5 rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40'
                    aria-label={`Eliminar grupo ${name}`}>
                    <X className='h-3 w-3' />
                </button>
            ) : null}
        </span>
    );
}
