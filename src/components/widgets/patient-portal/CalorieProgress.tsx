'use client';

import {useEffect, useMemo, useState} from 'react';
import {
    calculateMealScheduleProgress,
    type DayScheduleState
} from '@/lib/patient-portal/meal-time-progress';

interface MacroCircleProps {
    value: number;
    label: string;
    color: string;
    max: number;
}

function MacroCircle({value, label, color, max}: MacroCircleProps) {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const strokeDasharray = 2 * Math.PI * 28;
    const strokeDashoffset =
        strokeDasharray - (strokeDasharray * percentage) / 100;

    return (
        <div className='flex flex-col items-center'>
            <div className='relative h-20 w-20'>
                <svg className='h-20 w-20 -rotate-90' viewBox='0 0 64 64'>
                    <circle
                        cx='32'
                        cy='32'
                        r='28'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='4'
                        className='text-muted/30'
                    />
                    <circle
                        cx='32'
                        cy='32'
                        r='28'
                        fill='none'
                        stroke={color}
                        strokeWidth='4'
                        strokeLinecap='round'
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>
                <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='text-sm font-semibold text-foreground'>
                        {value}g
                    </span>
                </div>
            </div>
            <span className='mt-2 text-xs text-muted-foreground'>{label}</span>
        </div>
    );
}

interface CalorieProgressProps {
    consumed: number;
    goal: number;
    logs: number;
    protein: {current: number; max: number};
    carbs: {current: number; max: number};
    fat: {current: number; max: number};
    meals?: {time: string}[];
    dayScheduleState?: DayScheduleState;
}

function useMealScheduleProgress(
    meals: {time: string}[],
    dayScheduleState: DayScheduleState
) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (dayScheduleState !== 'today') {
            return;
        }

        const intervalId = window.setInterval(() => {
            setNow(new Date());
        }, 60_000);

        return () => window.clearInterval(intervalId);
    }, [dayScheduleState]);

    return useMemo(
        () => calculateMealScheduleProgress(meals, now, dayScheduleState),
        [meals, now, dayScheduleState]
    );
}

export function CalorieProgress({
    consumed,
    goal,
    logs,
    protein,
    carbs,
    fat,
    meals = [],
    dayScheduleState = 'today'
}: CalorieProgressProps) {
    const isFutureDay = dayScheduleState === 'future';
    const isPastDay = dayScheduleState === 'past';
    const effectiveConsumed = isFutureDay ? 0 : consumed;
    const left = Math.max(goal - effectiveConsumed, 0);
    const centerValue = isFutureDay ? left : effectiveConsumed;
    const centerLabel = 'Calorías';
    const caloriePercentage =
        goal > 0 ? Math.min((effectiveConsumed / goal) * 100, 100) : 0;
    const scheduleProgress = useMealScheduleProgress(meals, dayScheduleState);
    const percentage = isPastDay
        ? 100
        : (scheduleProgress ?? caloriePercentage);
    const isArcComplete = isPastDay || percentage >= 100;

    // Arc properties
    const radius = 90;
    const strokeWidth = 12;
    const circumference = Math.PI * radius; // Semi-circle
    const strokeDashoffset = circumference - (circumference * percentage) / 100;
    const arcPath = 'M 10 110 A 90 90 0 0 1 190 110';

    return (
        <div className='mb-10 rounded-xl border border-border bg-card p-6'>
            <h2 className='mb-6 text-center text-xl font-medium text-foreground'>
                Gran trabajo hoy, sigue así! 🎉
            </h2>

            <div className='flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8'>
                {/* Left stat */}
                <div className='order-2 text-center sm:order-1'>
                    <p className='text-2xl font-bold text-foreground'>{left}</p>
                    <p className='text-sm text-muted-foreground'>
                        Kcal restantes
                    </p>
                </div>

                {/* Main arc */}
                <div className='relative order-1 sm:order-2'>
                    <svg
                        width='200'
                        height='120'
                        viewBox='0 0 200 120'
                        className='overflow-visible'>
                        {/* Gradient definition */}
                        <defs>
                            <linearGradient
                                id='calorieGradient'
                                x1='0%'
                                y1='0%'
                                x2='100%'
                                y2='0%'>
                                <stop offset='0%' stopColor='#f59e0b' />
                                <stop offset='50%' stopColor='#f97316' />
                                <stop offset='100%' stopColor='#ef4444' />
                            </linearGradient>
                        </defs>
                        {!isArcComplete && (
                            <path
                                d={arcPath}
                                fill='none'
                                stroke='currentColor'
                                className='text-border'
                                strokeWidth={strokeWidth}
                                strokeLinecap='round'
                            />
                        )}
                        <path
                            d={arcPath}
                            fill='none'
                            stroke='url(#calorieGradient)'
                            strokeWidth={strokeWidth}
                            strokeLinecap='round'
                            {...(isArcComplete
                                ? {}
                                : {
                                      strokeDasharray: circumference,
                                      strokeDashoffset
                                  })}
                        />
                    </svg>
                    {/* Center text */}
                    <div className='absolute inset-0 flex flex-col items-center justify-center pt-4'>
                        <span className='text-4xl font-bold text-foreground'>
                            {centerValue}
                        </span>
                        <span className='text-sm text-muted-foreground'>
                            {centerLabel}
                        </span>
                    </div>
                </div>

                {/* Logs stat */}
                <div className='order-3 text-center'>
                    <p className='text-2xl font-bold text-foreground'>{logs}</p>
                    <p className='text-sm text-muted-foreground'>Menús</p>
                </div>
            </div>

            {/* Macro circles */}
            <div className='mt-8 flex justify-center gap-10'>
                <MacroCircle
                    value={protein.current}
                    label='Proteína'
                    color='#a3a3a3'
                    max={protein.max}
                />
                <MacroCircle
                    value={carbs.current}
                    label='Carbos'
                    color='#f59e0b'
                    max={carbs.max}
                />
                <MacroCircle
                    value={fat.current}
                    label='Grasa'
                    color='#a855f7'
                    max={fat.max}
                />
            </div>
        </div>
    );
}
