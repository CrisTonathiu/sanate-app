'use client';

import {useState} from 'react';
import {
    X,
    Clock,
    Flame,
    ChefHat,
    RefreshCw,
    Check,
    UtensilsCrossed
} from 'lucide-react';
import Image from 'next/image';

interface Ingredient {
    name: string;
    amount: string;
    unit: string;
    equivalents?: string[];
}

interface Recipe {
    id: string;
    name: string;
    image: string;
    time: string;
    calories: number;
    ingredients: Ingredient[];
    instructions: string[];
}

interface RecipeModalProps {
    recipe: Recipe | null;
    onClose: () => void;
}

export function RecipeModal({recipe, onClose}: RecipeModalProps) {
    const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>(
        'ingredients'
    );
    const [swappedIngredients, setSwappedIngredients] = useState<
        Record<string, string>
    >({});
    const [showEquivalents, setShowEquivalents] = useState<string | null>(null);

    if (!recipe) return null;

    const handleSwap = (ingredientName: string, equivalent: string) => {
        setSwappedIngredients(prev => ({
            ...prev,
            [ingredientName]: equivalent
        }));
        setShowEquivalents(null);
    };

    const resetSwap = (ingredientName: string) => {
        setSwappedIngredients(prev => {
            const updated = {...prev};
            delete updated[ingredientName];
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
                <div className='relative h-48 w-full'>
                    <Image
                        src={recipe.image}
                        alt={recipe.name}
                        fill
                        className='object-cover'
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
                        <div className='mt-2 flex items-center gap-4'>
                            <div className='flex items-center gap-1.5 text-white/90'>
                                <Clock className='h-4 w-4' />
                                <span className='text-sm'>{recipe.time}</span>
                            </div>
                            <div className='flex items-center gap-1.5 text-white/90'>
                                <Flame className='h-4 w-4 text-amber-400' />
                                <span className='text-sm'>
                                    {recipe.calories} kcal
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
                        Ingredients
                    </button>
                    <button
                        onClick={() => setActiveTab('instructions')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'instructions'
                                ? 'border-b-2 border-amber-400 text-amber-400'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}>
                        Instructions
                    </button>
                </div>

                {/* Content */}
                <div className='max-h-[40vh] overflow-y-auto p-4'>
                    {activeTab === 'ingredients' && (
                        <ul className='space-y-3'>
                            {recipe.ingredients.map((ingredient, index) => {
                                const isSwapped =
                                    swappedIngredients[ingredient.name];
                                const displayName =
                                    isSwapped || ingredient.name;

                                return (
                                    <li key={index} className='relative'>
                                        <div className='flex items-center justify-between rounded-lg bg-muted/50 p-3'>
                                            <div className='flex items-center gap-3'>
                                                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/20 text-sm font-semibold text-amber-500'>
                                                    {ingredient.amount}
                                                </div>
                                                <div>
                                                    <p
                                                        className={`font-medium text-card-foreground ${isSwapped ? 'line-through opacity-50' : ''}`}>
                                                        {ingredient.name}
                                                    </p>
                                                    {isSwapped && (
                                                        <p className='text-sm font-medium text-amber-500'>
                                                            {isSwapped}
                                                        </p>
                                                    )}
                                                    <p className='text-sm text-muted-foreground'>
                                                        {ingredient.unit}
                                                    </p>
                                                </div>
                                            </div>

                                            {ingredient.equivalents &&
                                                ingredient.equivalents.length >
                                                    0 && (
                                                    <div className='flex items-center gap-2'>
                                                        {isSwapped && (
                                                            <button
                                                                onClick={() =>
                                                                    resetSwap(
                                                                        ingredient.name
                                                                    )
                                                                }
                                                                className='flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80'>
                                                                <X className='h-4 w-4' />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() =>
                                                                setShowEquivalents(
                                                                    showEquivalents ===
                                                                        ingredient.name
                                                                        ? null
                                                                        : ingredient.name
                                                                )
                                                            }
                                                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                                                                showEquivalents ===
                                                                ingredient.name
                                                                    ? 'bg-amber-400 text-white'
                                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                            }`}>
                                                            <RefreshCw className='h-4 w-4' />
                                                        </button>
                                                    </div>
                                                )}
                                        </div>

                                        {showEquivalents === ingredient.name &&
                                            ingredient.equivalents && (
                                                <div className='mt-2 rounded-lg border border-border bg-card p-2'>
                                                    <p className='mb-2 text-xs font-medium text-muted-foreground'>
                                                        Substitute with:
                                                    </p>
                                                    <div className='flex flex-wrap gap-2'>
                                                        {ingredient.equivalents.map(
                                                            (eq, eqIndex) => (
                                                                <button
                                                                    key={
                                                                        eqIndex
                                                                    }
                                                                    onClick={() =>
                                                                        handleSwap(
                                                                            ingredient.name,
                                                                            eq
                                                                        )
                                                                    }
                                                                    className='flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-card-foreground transition-colors hover:bg-amber-400/20 hover:text-amber-500'>
                                                                    {eq}
                                                                    {isSwapped ===
                                                                        eq && (
                                                                        <Check className='h-3 w-3 text-amber-500' />
                                                                    )}
                                                                </button>
                                                            )
                                                        )}
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
