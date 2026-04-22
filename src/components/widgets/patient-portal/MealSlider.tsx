'use client';

import {useState, useRef} from 'react';
import {Coffee, Sun, Moon, ChevronLeft, ChevronRight} from 'lucide-react';

export interface MealData {
    id: string;
    name: string;
    icon: typeof Coffee;
    time: string;
    calories: number;
    items: string[];
}

const defaultMeals: MealData[] = [
    {
        id: 'breakfast',
        name: 'Breakfast',
        icon: Coffee,
        time: '7:00 - 9:00',
        calories: 450,
        items: ['Oatmeal with berries', 'Greek yogurt', 'Orange juice']
    },
    {
        id: 'lunch',
        name: 'Lunch',
        icon: Sun,
        time: '12:00 - 14:00',
        calories: 650,
        items: ['Grilled chicken salad', 'Quinoa', 'Sparkling water']
    },
    {
        id: 'dinner',
        name: 'Dinner',
        icon: Moon,
        time: '18:00 - 20:00',
        calories: 550,
        items: ['Salmon fillet', 'Steamed vegetables', 'Brown rice']
    }
];

interface MealSliderProps {
    meals?: MealData[];
}

export function MealSlider({meals = defaultMeals}: MealSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const hasMeals = meals.length > 0;

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current && hasMeals) {
            const newIndex =
                direction === 'left'
                    ? Math.max(0, currentIndex - 1)
                    : Math.min(meals.length - 1, currentIndex + 1);
            setCurrentIndex(newIndex);
            const cardWidth = scrollRef.current.offsetWidth;
            scrollRef.current.scrollTo({
                left: newIndex * cardWidth,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className='relative'>
            <div className='mb-4 flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-foreground'>
                    Today&apos;s Meals
                </h3>
                <div className='flex gap-2'>
                    <button
                        onClick={() => scroll('left')}
                        disabled={!hasMeals || currentIndex === 0}
                        className='flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-40'>
                        <ChevronLeft className='h-4 w-4' />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={
                            !hasMeals || currentIndex === meals.length - 1
                        }
                        className='flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-40'>
                        <ChevronRight className='h-4 w-4' />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className='flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth scrollbar-hide'
                style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {hasMeals ? (
                    meals.map(meal => (
                        <div
                            key={meal.id}
                            className='min-w-full snap-center rounded-2xl border border-border bg-card p-5'>
                            <div className='mb-4 flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                    <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/20'>
                                        <meal.icon className='h-5 w-5 text-amber-500' />
                                    </div>
                                    <div>
                                        <h4 className='font-semibold text-card-foreground'>
                                            {meal.name}
                                        </h4>
                                        <p className='text-sm text-muted-foreground'>
                                            {meal.time}
                                        </p>
                                    </div>
                                </div>
                                <div className='text-right'>
                                    <p className='text-lg font-semibold text-card-foreground'>
                                        {meal.calories}
                                    </p>
                                    <p className='text-xs text-muted-foreground'>
                                        kcal
                                    </p>
                                </div>
                            </div>

                            <ul className='space-y-2'>
                                {meal.items.map((item, index) => (
                                    <li
                                        key={index}
                                        className='flex items-center gap-2 text-sm text-muted-foreground'>
                                        <span className='h-1.5 w-1.5 rounded-full bg-amber-400' />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <div className='min-w-full snap-center rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground'>
                        No menu is available yet.
                    </div>
                )}
            </div>

            <div className='mt-4 flex justify-center gap-2'>
                {meals.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setCurrentIndex(index);
                            if (scrollRef.current) {
                                const cardWidth = scrollRef.current.offsetWidth;
                                scrollRef.current.scrollTo({
                                    left: index * cardWidth,
                                    behavior: 'smooth'
                                });
                            }
                        }}
                        className={`h-2 w-2 rounded-full transition-all ${
                            index === currentIndex
                                ? 'bg-amber-400 w-4'
                                : 'bg-muted-foreground/30'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
