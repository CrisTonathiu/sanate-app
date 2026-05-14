'use client';

import {useState, useRef, useEffect} from 'react';
import {
    Coffee,
    Sun,
    Moon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Flame
} from 'lucide-react';
import Image from 'next/image';
import {RecipeModal} from './RecipeModal';
import type {MealSliderRecipe} from '@/lib/patient-portal/protocol-meal-slider-map';

interface MealTypeInfo {
    id: string;
    name: string;
    icon: typeof Coffee;
    timeRange: string;
}

const mealTypeInfo: Record<string, MealTypeInfo> = {
    breakfast: {
        id: 'breakfast',
        name: 'Desayuno',
        icon: Coffee,
        timeRange: '7:00 - 9:00'
    },
    lunch: {id: 'lunch', name: 'Comida', icon: Sun, timeRange: '12:00 - 14:00'},
    dinner: {
        id: 'dinner',
        name: 'Cena',
        icon: Moon,
        timeRange: '18:00 - 20:00'
    }
};

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

type MealSliderProps = {
    recipes: MealSliderRecipe[];
};

export function MealSlider({recipes}: MealSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedRecipe, setSelectedRecipe] =
        useState<MealSliderRecipe | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const recipeIdsKey = recipes.map(r => r.id).join('|');

    useEffect(() => {
        setCurrentIndex(0);
    }, [recipeIdsKey]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const recipesPerSlide = isMobile ? 2 : 3;
    const slides = chunkArray(recipes, recipesPerSlide);
    const totalSlides = slides.length;

    useEffect(() => {
        // Reset to first slide when screen size changes to avoid being on a non-existent slide
        if (currentIndex >= totalSlides) {
            setCurrentIndex(0);
        }
    }, [totalSlides, currentIndex]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current || totalSlides === 0) return;
        const maxIndex = totalSlides - 1;
        const newIndex =
            direction === 'left'
                ? Math.max(0, currentIndex - 1)
                : Math.min(maxIndex, currentIndex + 1);
        setCurrentIndex(newIndex);
        const cardWidth = scrollRef.current.offsetWidth;
        scrollRef.current.scrollTo({
            left: newIndex * cardWidth,
            behavior: 'smooth'
        });
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
        if (scrollRef.current) {
            const cardWidth = scrollRef.current.offsetWidth;
            scrollRef.current.scrollTo({
                left: index * cardWidth,
                behavior: 'smooth'
            });
        }
    };

    if (recipes.length === 0) {
        return null;
    }

    return (
        <>
            <div className='relative'>
                <div className='mb-4 flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-foreground'>
                        Menú de hoy
                    </h3>
                    <div className='flex gap-2'>
                        <button
                            onClick={() => scroll('left')}
                            disabled={currentIndex === 0 || totalSlides === 0}
                            className='flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-40'>
                            <ChevronLeft className='h-4 w-4' />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            disabled={
                                totalSlides === 0 ||
                                currentIndex >= totalSlides - 1
                            }
                            className='flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-40'>
                            <ChevronRight className='h-4 w-4' />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className='flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth scrollbar-hide p-2'
                    style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                    {slides.map((slideRecipes, slideIndex) => (
                        <div
                            key={slideIndex}
                            className='min-w-full snap-center'>
                            <div className='flex gap-3'>
                                {slideRecipes.map(recipe => {
                                    const mealInfo =
                                        mealTypeInfo[recipe.mealType];
                                    const Icon = mealInfo.icon;

                                    return (
                                        <button
                                            key={recipe.id}
                                            onClick={() =>
                                                setSelectedRecipe(recipe)
                                            }
                                            className='group flex-1 overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:border-primary/50 hover:shadow-md'>
                                            <div className='relative h-28 w-full overflow-hidden'>
                                                <Image
                                                    src={recipe.image}
                                                    alt={recipe.name}
                                                    fill
                                                    className='object-cover transition-transform group-hover:scale-105'
                                                />
                                                <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent' />

                                                {/* Meal type badge on top */}
                                                <div className='absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm'>
                                                    <Icon className='h-3 w-3 text-amber-400' />
                                                    <span className='text-xs font-medium text-white'>
                                                        {mealInfo.name}
                                                    </span>
                                                </div>

                                                {/* Recipe name at bottom */}
                                                <div className='absolute bottom-2 left-2 right-2'>
                                                    <h4 className='truncate text-sm font-medium text-white'>
                                                        {recipe.name.toUpperCase()}
                                                    </h4>
                                                </div>
                                            </div>

                                            <div className='flex items-center justify-between p-2.5'>
                                                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                                                    <Clock className='h-3 w-3' />
                                                    <span>{recipe.time}</span>
                                                </div>
                                                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                                                    <Flame className='h-3 w-3 text-amber-500' />
                                                    <span>
                                                        {recipe.calories} kcal
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className='mt-4 flex justify-center gap-2'>
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-2 rounded-full transition-all ${
                                index === currentIndex
                                    ? 'bg-amber-400 w-4'
                                    : 'bg-muted-foreground/30 w-2'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            <RecipeModal
                recipe={selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
            />
        </>
    );
}
