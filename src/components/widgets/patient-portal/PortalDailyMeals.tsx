'use client';

import {useMemo, useState} from 'react';
import {CalorieProgress} from '@/components/widgets/patient-portal/CalorieProgress';
import {MealSlider} from '@/components/widgets/patient-portal/MealSlider';
import {WeekSelector} from '@/components/widgets/patient-portal/WeekSelector';
import type {WeekDayMealPlan} from '@/lib/services/patient/patient-meal-by-type.service';

interface PortalDailyMealsProps {
    weekPlan: WeekDayMealPlan[];
    weekDays: Array<{dayName: string; date: number}>;
    initialDayIndex: number;
}

export function PortalDailyMeals({
    weekPlan,
    weekDays,
    initialDayIndex
}: PortalDailyMealsProps) {
    const [selectedIndex, setSelectedIndex] = useState(initialDayIndex);

    const selectedDay = useMemo(
        () =>
            weekPlan.find(day => day.dayIndex === selectedIndex) ??
            weekPlan.find(day => day.isToday) ??
            weekPlan[0],
        [weekPlan, selectedIndex]
    );

    const meals = selectedDay?.meals ?? [];

    const totals = useMemo(
        () =>
            meals.reduce(
                (acc, meal) => ({
                    calories: acc.calories + meal.calories,
                    protein: acc.protein + meal.protein,
                    carbs: acc.carbs + meal.carbs,
                    fat: acc.fat + meal.fat
                }),
                {calories: 0, protein: 0, carbs: 0, fat: 0}
            ),
        [meals]
    );

    const dayScheduleState = useMemo(() => {
        if (selectedIndex === initialDayIndex) {
            return 'today' as const;
        }

        return selectedIndex < initialDayIndex
            ? ('past' as const)
            : ('future' as const);
    }, [selectedIndex, initialDayIndex]);

    return (
        <div className='mt-6'>
            <CalorieProgress
                consumed={totals.calories}
                goal={totals.calories}
                logs={meals.length}
                meals={meals}
                dayScheduleState={dayScheduleState}
                protein={{
                    current: totals.protein,
                    max: totals.protein
                }}
                carbs={{
                    current: totals.carbs,
                    max: totals.carbs
                }}
                fat={{
                    current: totals.fat,
                    max: totals.fat
                }}
            />

            <section className='mt-8'>
                <WeekSelector
                    days={weekDays}
                    initialSelectedIndex={initialDayIndex}
                    onSelect={index => setSelectedIndex(index)}
                />
            </section>

            <section
                className='mt-8'
                data-slider-meals={meals.length}
                key={`${selectedIndex}-${meals.map(recipe => recipe.id).join('|')}`}>
                <MealSlider recipes={meals} />
            </section>
        </div>
    );
}
