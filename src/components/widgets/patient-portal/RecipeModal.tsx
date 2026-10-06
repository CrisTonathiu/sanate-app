'use client';

import {useMemo, useState} from 'react';
import {X, Clock, Flame, RefreshCw, Check, UtensilsCrossed} from 'lucide-react';
import {
    buildIngredientSwapOptions,
    type IngredientSwapOption,
    type SwapCatalogFood
} from '@/lib/patient-portal/ingredient-swaps';
import type {MealSliderRecipe} from '@/lib/patient-portal/protocol-meal-slider-map';
import {getSafeRecipeImageSrc} from '@/lib/utils/recipe-image-url';

interface RecipeModalProps {
    recipe: MealSliderRecipe | null;
    swapCatalog?: SwapCatalogFood[];
    onClose: () => void;
}

function formatCalorieDelta(delta: number): string {
    if (delta === 0) {
        return '±0 kcal';
    }
    return `${delta > 0 ? '+' : '−'}${Math.abs(delta)} kcal`;
}

export function RecipeModal({
    recipe,
    swapCatalog = [],
    onClose
}: RecipeModalProps) {
    const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>(
        'ingredients'
    );
    // Keyed by ingredient index; MealSlider remounts the modal per recipe.
    const [swappedIngredients, setSwappedIngredients] = useState<
        Record<number, IngredientSwapOption>
    >({});
    const [showEquivalents, setShowEquivalents] = useState<number | null>(null);

    const swapOptions = useMemo(() => {
        const ingredients = recipe?.ingredients ?? [];
        const mealFoodIds = new Set(
            ingredients.flatMap(ingredient =>
                ingredient.swapSource ? [ingredient.swapSource.foodId] : []
            )
        );

        return ingredients.map(ingredient =>
            ingredient.swapSource
                ? buildIngredientSwapOptions(
                      ingredient.swapSource,
                      swapCatalog,
                      mealFoodIds
                  )
                : []
        );
    }, [recipe, swapCatalog]);

    if (!recipe) return null;

    const imageSrc =
        getSafeRecipeImageSrc(recipe.image) ?? '/recipe-placeholder.svg';

    const totalCalorieDelta = Object.values(swappedIngredients).reduce(
        (sum, swap) => sum + swap.calorieDelta,
        0
    );

    const handleSwap = (index: number, option: IngredientSwapOption) => {
        setSwappedIngredients(prev => ({
            ...prev,
            [index]: option
        }));
        setShowEquivalents(null);
    };

    const resetSwap = (index: number) => {
        setSwappedIngredients(prev => {
            const updated = {...prev};
            delete updated[index];
            return updated;
        });
    };

    return (
        <div className='fixed inset-0 z-50 flex items-end justify-center sm:items-center'>
            <div
                className='absolute inset-0 bg-black/60 backdrop-blur-sm'
                onClick={onClose}
            />

            <div className='relative z-10 w-full max-w-lg max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-card shadow-xl'>
                {/* Header Image */}
                <div className='relative h-48 w-full bg-secondary/30'>
                    <img
                        src={imageSrc}
                        alt={recipe.name}
                        onError={e => {
                            e.currentTarget.src = '/recipe-placeholder.svg';
                        }}
                        className='h-full w-full object-cover'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />

                    <button
                        onClick={onClose}
                        className='absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60'>
                        <X className='h-5 w-5' />
                    </button>

                    <div className='absolute bottom-4 left-4 right-4'>
                        <h2 className='text-2xl font-bold text-white'>
                            {recipe.name}
                        </h2>
                        <div className='mt-2 flex flex-wrap items-center gap-3'>
                            <div className='flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm'>
                                <UtensilsCrossed className='h-3.5 w-3.5 text-amber-400' />
                                <span className='text-sm font-medium text-white'>
                                    {recipe.mealTypeLabel}
                                </span>
                            </div>
                            <div className='flex items-center gap-1.5 text-white/90'>
                                <Clock className='h-4 w-4' />
                                <span className='text-sm'>{recipe.time}</span>
                            </div>
                            <div className='flex items-center gap-1.5 text-white/90'>
                                <Flame className='h-4 w-4 text-amber-400' />
                                <span className='text-sm'>
                                    {recipe.calories + totalCalorieDelta} kcal
                                    {totalCalorieDelta !== 0 && (
                                        <span className='ml-1 text-white/70'>
                                            ({formatCalorieDelta(
                                                totalCalorieDelta
                                            )})
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className='flex border-b border-border'>
                    <button
                        onClick={() => setActiveTab('ingredients')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'ingredients'
                                ? 'border-b-2 border-amber-400 text-amber-400'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}>
                        Ingredientes
                    </button>
                    <button
                        onClick={() => setActiveTab('instructions')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'instructions'
                                ? 'border-b-2 border-amber-400 text-amber-400'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}>
                        Instrucciones
                    </button>
                </div>

                {/* Content */}
                <div className='max-h-[40vh] overflow-y-auto p-4'>
                    {activeTab === 'ingredients' && (
                        <ul className='space-y-3'>
                            {recipe.ingredients.map((ingredient, index) => {
                                const swap = swappedIngredients[index];
                                const options = swapOptions[index] ?? [];
                                const amount = swap
                                    ? swap.amount
                                    : ingredient.amount;
                                const unit = swap ? swap.unit : ingredient.unit;

                                return (
                                    <li key={index} className='relative'>
                                        <div className='flex items-center justify-between rounded-lg bg-muted/50 p-3'>
                                            <div className='flex items-center gap-3'>
                                                {amount ? (
                                                    <div className='flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-full bg-amber-400/20 text-xs font-semibold leading-tight text-amber-500'>
                                                        <span>{amount}</span>
                                                    </div>
                                                ) : (
                                                    <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground'>
                                                        +
                                                    </div>
                                                )}
                                                <div>
                                                    <p
                                                        className={`font-medium text-card-foreground ${swap ? 'line-through opacity-50' : ''}`}>
                                                        {ingredient.name}
                                                    </p>
                                                    {swap && (
                                                        <p className='text-sm font-medium text-amber-500'>
                                                            {swap.name}
                                                            <span className='ml-1.5 text-xs font-normal text-muted-foreground'>
                                                                {formatCalorieDelta(
                                                                    swap.calorieDelta
                                                                )}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {unit ? (
                                                        <p className='text-sm text-muted-foreground'>
                                                            {unit}
                                                            {swap?.hint
                                                                ? ` · ${swap.hint}`
                                                                : ''}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {options.length > 0 && (
                                                <div className='flex items-center gap-2'>
                                                    {swap && (
                                                        <button
                                                            onClick={() =>
                                                                resetSwap(index)
                                                            }
                                                            aria-label='Deshacer cambio'
                                                            className='flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80'>
                                                            <X className='h-4 w-4' />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            setShowEquivalents(
                                                                showEquivalents ===
                                                                    index
                                                                    ? null
                                                                    : index
                                                            )
                                                        }
                                                        aria-label='Cambiar ingrediente'
                                                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                                                            showEquivalents ===
                                                            index
                                                                ? 'bg-amber-400 text-white'
                                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                        }`}>
                                                        <RefreshCw className='h-4 w-4' />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {showEquivalents === index &&
                                            options.length > 0 && (
                                                <div className='mt-2 rounded-lg border border-border bg-card p-2'>
                                                    <p className='mb-2 text-xs font-medium text-muted-foreground'>
                                                        Sustituir por:
                                                    </p>
                                                    <div className='flex flex-wrap gap-2'>
                                                        {options.map(option => (
                                                            <button
                                                                key={
                                                                    option.foodId
                                                                }
                                                                onClick={() =>
                                                                    handleSwap(
                                                                        index,
                                                                        option
                                                                    )
                                                                }
                                                                className='flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-card-foreground transition-colors hover:bg-amber-400/20 hover:text-amber-500'>
                                                                <span>
                                                                    {
                                                                        option.amount
                                                                    }{' '}
                                                                    {
                                                                        option.unit
                                                                    }{' '}
                                                                    {
                                                                        option.name
                                                                    }
                                                                </span>
                                                                <span className='text-xs text-muted-foreground'>
                                                                    {formatCalorieDelta(
                                                                        option.calorieDelta
                                                                    )}
                                                                </span>
                                                                {swap?.foodId ===
                                                                    option.foodId && (
                                                                    <Check className='h-3 w-3 text-amber-500' />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {activeTab === 'instructions' && (
                        <ol className='space-y-4'>
                            {recipe.instructions.map((instruction, index) => (
                                <li key={index} className='flex gap-4'>
                                    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-white'>
                                        {index + 1}
                                    </div>
                                    <p className='flex-1 pt-1 text-card-foreground'>
                                        {instruction}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </div>
        </div>
    );
}
