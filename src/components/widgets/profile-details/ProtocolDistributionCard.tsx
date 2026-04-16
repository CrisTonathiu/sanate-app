'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
    macros,
    MacroMealPercentages,
    MacroPercents,
    MEAL_CONFIG,
    MealPercentages,
    MacroType,
    MealType
} from '@/lib/config/meal-config';
import {cn} from '@/lib/utils';
import {AnimatePresence, motion} from 'framer-motion';
import {
    AlertCircle,
    Beef,
    Check,
    Droplets,
    Percent,
    PieChart,
    Plus,
    Wheat,
    X
} from 'lucide-react';
import React from 'react';

interface ProtocolDistributionCardProps {
    planCalories: number;
    enabledMeals: Record<MealType, boolean>;
    setEnabledMeals: React.Dispatch<
        React.SetStateAction<Record<MealType, boolean>>
    >;
    mealPercentages: MealPercentages;
    setMealPercentages: React.Dispatch<React.SetStateAction<MealPercentages>>;
    macroMealPercentages: MacroMealPercentages;
    setMacroMealPercentages: React.Dispatch<
        React.SetStateAction<MacroMealPercentages>
    >;
    macroPercents: MacroPercents;
}

const createEmptyMealPercentages = (): MealPercentages => ({
    smoothie: 0,
    breakfast: 0,
    snack1: 0,
    lunch: 0,
    snack2: 0,
    dinner: 0,
    drinks: 0
});

const createEqualMealPercentages = (
    enabledMeals: Record<MealType, boolean>
): MealPercentages => {
    const enabledKeys = MEAL_CONFIG.map(({key}) => key).filter(
        key => enabledMeals[key]
    );
    const next = createEmptyMealPercentages();

    if (enabledKeys.length === 0) {
        return next;
    }

    const baseUnits = Math.floor(10000 / enabledKeys.length);
    const remainderUnits = 10000 - baseUnits * enabledKeys.length;

    enabledKeys.forEach((key, index) => {
        next[key] = (baseUnits + (index < remainderUnits ? 1 : 0)) / 100;
    });

    return next;
};

const macroLabels: Record<MacroType, string> = {
    carbs: 'Carbs',
    protein: 'Proteina',
    fat: 'Grasa'
};

export function ProtocolDistributionCard({
    planCalories,
    enabledMeals,
    setEnabledMeals,
    mealPercentages,
    setMealPercentages,
    macroMealPercentages,
    setMacroMealPercentages,
    macroPercents
}: ProtocolDistributionCardProps) {
    // Check if distribution is valid (totals 100%)
    const enabledMealsList = Object.entries(enabledMeals)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key as MealType);
    const totalPercentage = enabledMealsList.reduce(
        (sum, key) =>
            sum + mealPercentages[key as keyof typeof mealPercentages],
        0
    );
    const isMealDistributionValid = totalPercentage === 100;
    const totalMacroPercentages = macros.reduce(
        (acc, macro) => {
            acc[macro] = enabledMealsList.reduce(
                (sum, key) => sum + macroMealPercentages[macro][key],
                0
            );
            return acc;
        },
        {} as Record<MacroType, number>
    );
    const macroCaloriesPerDay = {
        carbs: (planCalories * macroPercents.carbs) / 100,
        protein: (planCalories * macroPercents.protein) / 100,
        fat: (planCalories * macroPercents.fat) / 100
    };
    const allMealTypes = MEAL_CONFIG.map(m => m.key);
    const disabledMealTypes = allMealTypes.filter(
        m => !enabledMealsList.includes(m)
    );

    const onPercentageChange = (
        meal: keyof typeof mealPercentages,
        value: number
    ) => {
        const clampedValue = Math.min(Math.max(value, 0), 100);
        const roundedValue = Math.round(clampedValue * 100) / 100;

        setMealPercentages((prev: any) => ({
            ...prev,
            [meal]: roundedValue
        }));
    };

    const onCaloriesChange = (
        meal: keyof typeof mealPercentages,
        value: number
    ) => {
        if (planCalories <= 0) return;

        const clampedCalories = Math.min(Math.max(value, 0), planCalories);
        const nextPercentage = (clampedCalories / planCalories) * 100;

        setMealPercentages((prev: any) => ({
            ...prev,
            [meal]: Math.min(Math.max(nextPercentage, 0), 100)
        }));
    };

    const onMacroPercentageChange = (
        macro: MacroType,
        meal: MealType,
        value: number
    ) => {
        const clampedValue = Math.min(Math.max(value, 0), 100);
        const roundedValue = Math.round(clampedValue * 100) / 100;

        setMacroMealPercentages(prev => ({
            ...prev,
            [macro]: {
                ...prev[macro],
                [meal]: roundedValue
            }
        }));
    };

    // Add a meal type
    const onAddMealType = (mealType: MealType) => {
        if (enabledMeals[mealType]) return;
        const newEnabled = {...enabledMeals, [mealType]: true};
        setEnabledMeals(newEnabled);

        const newPcts = createEqualMealPercentages(newEnabled);
        setMealPercentages(newPcts);
        setMacroMealPercentages({
            carbs: {...newPcts},
            protein: {...newPcts},
            fat: {...newPcts}
        });
    };

    // Remove a meal type
    const onRemoveMealType = (mealType: MealType) => {
        if (!enabledMeals[mealType]) return;
        const newEnabled = {...enabledMeals, [mealType]: false};
        setEnabledMeals(newEnabled);
        const enabledKeys = Object.keys(newEnabled).filter(
            k => newEnabled[k as MealType]
        );
        if (enabledKeys.length === 0) return;

        const newPcts = createEqualMealPercentages(newEnabled);
        setMealPercentages(newPcts);
        setMacroMealPercentages({
            carbs: {...newPcts},
            protein: {...newPcts},
            fat: {...newPcts}
        });
    };

    const [pctDraft, setPctDraft] = React.useState<
        Partial<Record<MealType, string>>
    >({});
    const [macroPctDraft, setMacroPctDraft] = React.useState<
        Partial<Record<string, string>>
    >({});

    const canRemove = Object.values(enabledMeals).filter(Boolean).length > 1;

    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            className='space-y-6'>
            <Card className='border-border bg-card'>
                <CardHeader className='pb-2'>
                    <CardTitle className='text-lg font-semibold flex items-center gap-2'>
                        <PieChart className='h-5 w-5 text-primary' />
                        Distribucion de calorias por comida
                    </CardTitle>
                    <p className='text-sm text-muted-foreground'>
                        Define el porcentaje total de calorias por comida y la
                        distribucion de carbs, proteina y grasa dentro de las
                        comidas. Total: {planCalories} kcal
                    </p>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {/* Add Meal Types Section */}
                    {disabledMealTypes.length > 0 && (
                        <div className='space-y-2'>
                            <Label className='text-xs text-muted-foreground'>
                                Agregar tipo de comida
                            </Label>
                            <div className='flex flex-wrap gap-2'>
                                {disabledMealTypes.map((mealType: MealType) => {
                                    const config = MEAL_CONFIG.find(
                                        meal => meal.key === mealType
                                    );
                                    if (!config) return null;
                                    const Icon = config.icon;
                                    return (
                                        <motion.button
                                            key={mealType}
                                            onClick={() =>
                                                onAddMealType(mealType)
                                            }
                                            whileHover={{scale: 1.05}}
                                            whileTap={{scale: 0.95}}
                                            className='flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary/50 text-muted-foreground border border-dashed border-border hover:bg-secondary hover:text-foreground hover:border-primary/50 transition-all'>
                                            <Plus className='h-3.5 w-3.5' />
                                            <Icon
                                                className={cn(
                                                    'h-3.5 w-3.5',
                                                    config.color
                                                )}
                                            />
                                            {config.label}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {/* Meal Distribution Grid */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                        <AnimatePresence mode='popLayout'>
                            {MEAL_CONFIG.map(
                                ({key: mealType, icon: Icon, label, color}) => {
                                    const isEnabled = enabledMeals[mealType];
                                    if (!isEnabled) return null;

                                    const percentage =
                                        mealPercentages[mealType];
                                    const kcal = Math.round(
                                        (planCalories * percentage) / 100
                                    );
                                    const macroMealKcal = {
                                        carbs: Math.round(
                                            (macroCaloriesPerDay.carbs *
                                                macroMealPercentages.carbs[
                                                    mealType
                                                ]) /
                                                100
                                        ),
                                        protein: Math.round(
                                            (macroCaloriesPerDay.protein *
                                                macroMealPercentages.protein[
                                                    mealType
                                                ]) /
                                                100
                                        ),
                                        fat: Math.round(
                                            (macroCaloriesPerDay.fat *
                                                macroMealPercentages.fat[
                                                    mealType
                                                ]) /
                                                100
                                        )
                                    };

                                    return (
                                        <motion.div
                                            key={mealType}
                                            initial={{opacity: 0, scale: 0.9}}
                                            animate={{opacity: 1, scale: 1}}
                                            exit={{opacity: 0, scale: 0.9}}
                                            layout
                                            className='p-4 rounded-xl border border-border bg-secondary/20 space-y-3 relative'>
                                            {/* Remove Button */}
                                            {canRemove && (
                                                <button
                                                    onClick={() =>
                                                        onRemoveMealType(
                                                            mealType
                                                        )
                                                    }
                                                    className='absolute top-2 right-2 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors'
                                                    title='Eliminar'>
                                                    <X className='h-4 w-4' />
                                                </button>
                                            )}
                                            <div className='flex items-center gap-2 pr-6'>
                                                <div
                                                    className={cn(
                                                        'p-2 rounded-lg bg-secondary/50',
                                                        color
                                                    )}>
                                                    <Icon className='h-4 w-4' />
                                                </div>
                                                <span className='font-medium text-foreground'>
                                                    {label}
                                                </span>
                                            </div>

                                            {/* Percentage Input */}
                                            <div className='space-y-1.5'>
                                                <Label className='text-xs text-muted-foreground'>
                                                    Porcentaje
                                                </Label>
                                                <div className='relative'>
                                                    <Input
                                                        type='number'
                                                        min={0}
                                                        max={100}
                                                        step='0.01'
                                                        value={
                                                            mealType in pctDraft
                                                                ? pctDraft[
                                                                      mealType
                                                                  ]
                                                                : percentage
                                                        }
                                                        onChange={e =>
                                                            setPctDraft(
                                                                prev => ({
                                                                    ...prev,
                                                                    [mealType]:
                                                                        e.target
                                                                            .value
                                                                })
                                                            )
                                                        }
                                                        onBlur={e => {
                                                            const parsed =
                                                                parseFloat(
                                                                    e.target
                                                                        .value
                                                                );
                                                            onPercentageChange(
                                                                mealType,
                                                                isNaN(parsed)
                                                                    ? 0
                                                                    : parsed
                                                            );
                                                            setPctDraft(
                                                                prev => {
                                                                    const next =
                                                                        {
                                                                            ...prev
                                                                        };
                                                                    delete next[
                                                                        mealType
                                                                    ];
                                                                    return next;
                                                                }
                                                            );
                                                        }}
                                                        className='bg-background border-border pr-8'
                                                    />
                                                    <Percent className='absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                                                </div>
                                            </div>

                                            {/* Calculated kcal */}
                                            <div className='space-y-1.5'>
                                                <Label className='text-xs text-muted-foreground'>
                                                    Calorias exactas
                                                </Label>
                                                <div className='relative'>
                                                    <Input
                                                        type='number'
                                                        min={0}
                                                        max={Math.max(
                                                            Math.round(
                                                                planCalories
                                                            ),
                                                            0
                                                        )}
                                                        step='1'
                                                        value={kcal}
                                                        onChange={e =>
                                                            onCaloriesChange(
                                                                mealType,
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                    10
                                                                ) || 0
                                                            )
                                                        }
                                                        className='bg-background border-border pr-14'
                                                        disabled={
                                                            planCalories <= 0
                                                        }
                                                    />
                                                    <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>
                                                        kcal
                                                    </span>
                                                </div>
                                            </div>

                                            <div className='space-y-2 pt-2 border-t border-border'>
                                                {macros.map(macro => {
                                                    const draftKey = `${macro}:${mealType}`;

                                                    return (
                                                        <div
                                                            key={macro}
                                                            className='grid grid-cols-[minmax(0,1fr)_92px_92px] gap-2 items-center lg:grid-cols-1 lg:items-stretch'>
                                                            <div>
                                                                <p className='text-xs font-medium text-foreground'>
                                                                    {
                                                                        macroLabels[
                                                                            macro
                                                                        ]
                                                                    }
                                                                </p>
                                                                <p className='text-[11px] text-muted-foreground'>
                                                                    {macroPercents[
                                                                        macro
                                                                    ].toFixed(
                                                                        2
                                                                    )}
                                                                    % del dia
                                                                </p>
                                                            </div>
                                                            <div className='contents lg:grid lg:grid-cols-2 lg:gap-2'>
                                                                <div className='relative'>
                                                                    <Input
                                                                        type='number'
                                                                        min={0}
                                                                        max={
                                                                            100
                                                                        }
                                                                        step='0.01'
                                                                        value={
                                                                            draftKey in
                                                                            macroPctDraft
                                                                                ? macroPctDraft[
                                                                                      draftKey
                                                                                  ]
                                                                                : macroMealPercentages[
                                                                                      macro
                                                                                  ][
                                                                                      mealType
                                                                                  ]
                                                                        }
                                                                        onChange={e =>
                                                                            setMacroPctDraft(
                                                                                prev => ({
                                                                                    ...prev,
                                                                                    [draftKey]:
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                })
                                                                            )
                                                                        }
                                                                        onBlur={e => {
                                                                            const parsed =
                                                                                parseFloat(
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                );
                                                                            onMacroPercentageChange(
                                                                                macro,
                                                                                mealType,
                                                                                isNaN(
                                                                                    parsed
                                                                                )
                                                                                    ? 0
                                                                                    : parsed
                                                                            );
                                                                            setMacroPctDraft(
                                                                                prev => {
                                                                                    const next =
                                                                                        {
                                                                                            ...prev
                                                                                        };
                                                                                    delete next[
                                                                                        draftKey
                                                                                    ];
                                                                                    return next;
                                                                                }
                                                                            );
                                                                        }}
                                                                        className='bg-background border-border pr-6 h-9'
                                                                    />
                                                                    <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground'>
                                                                        %
                                                                    </span>
                                                                </div>
                                                                <div className='rounded-md border border-border bg-background px-3 h-9 flex items-center justify-end text-sm font-medium text-foreground'>
                                                                    {
                                                                        macroMealKcal[
                                                                            macro
                                                                        ]
                                                                    }
                                                                    <span className='ml-1 text-[11px] text-muted-foreground'>
                                                                        kcal
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    );
                                }
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Totals Cards */}
                    <div className='grid grid-cols-2 gap-4'>
                        {[
                            {
                                label: 'Calorias totales',
                                icon: PieChart,
                                value: totalPercentage,
                                color: 'primary'
                            },
                            {
                                label: 'Carbohidratos totales',
                                icon: Wheat,
                                value: totalMacroPercentages['carbs'],
                                color: 'amber'
                            },
                            {
                                label: 'Proteínas totales',
                                icon: Beef,
                                value: totalMacroPercentages['protein'],
                                color: 'red'
                            },
                            {
                                label: 'Grasas totales',
                                icon: Droplets,
                                value: totalMacroPercentages['fat'],
                                color: 'blue'
                            }
                        ].map(item => {
                            const isComplete = item.value === 100;
                            const isOver = item.value > 100;
                            const Icon = item.icon;
                            const colorClasses = {
                                primary: 'text-primary',
                                amber: 'text-amber-500',
                                red: 'text-red-500',
                                blue: 'text-blue-500'
                            };
                            const strokeColors = {
                                primary: isComplete
                                    ? '#22c55e'
                                    : isOver
                                      ? '#ef4444'
                                      : 'hsl(var(--primary))',
                                amber: isComplete
                                    ? '#22c55e'
                                    : isOver
                                      ? '#ef4444'
                                      : '#f59e0b',
                                red: isComplete
                                    ? '#22c55e'
                                    : isOver
                                      ? '#ef4444'
                                      : '#ef4444',
                                blue: isComplete
                                    ? '#22c55e'
                                    : isOver
                                      ? '#ef4444'
                                      : '#3b82f6'
                            };

                            const circumference = 2 * Math.PI * 36;
                            const progress = Math.min(item.value, 100);
                            const offset =
                                circumference -
                                (progress / 100) * circumference;
                            return (
                                <div
                                    key={item.label}
                                    className='relative p-4 rounded-xl border border-border bg-card flex flex-col items-center'>
                                    {/* Circular Progress */}
                                    <div className='relative w-24 h-24'>
                                        <svg
                                            className='w-24 h-24 -rotate-90'
                                            viewBox='0 0 80 80'>
                                            {/* Background circle */}
                                            <circle
                                                cx='40'
                                                cy='40'
                                                r='36'
                                                fill='none'
                                                stroke='hsl(var(--secondary))'
                                                strokeWidth='6'
                                            />
                                            {/* Progress circle */}
                                            <motion.circle
                                                cx='40'
                                                cy='40'
                                                r='36'
                                                fill='none'
                                                stroke={
                                                    strokeColors[
                                                        item.color as keyof typeof strokeColors
                                                    ]
                                                }
                                                strokeWidth='6'
                                                strokeLinecap='round'
                                                initial={{
                                                    strokeDashoffset:
                                                        circumference
                                                }}
                                                animate={{
                                                    strokeDashoffset: offset
                                                }}
                                                style={{
                                                    strokeDasharray:
                                                        circumference
                                                }}
                                                transition={{
                                                    duration: 0.5,
                                                    ease: 'easeOut'
                                                }}
                                            />
                                        </svg>
                                        {/* Center content */}
                                        <div className='absolute inset-0 flex flex-col items-center justify-center'>
                                            <Icon
                                                className={cn(
                                                    'h-5 w-5 mb-0.5',
                                                    colorClasses[
                                                        item.color as keyof typeof colorClasses
                                                    ]
                                                )}
                                            />
                                            <span
                                                className={cn(
                                                    'text-sm font-bold',
                                                    isComplete
                                                        ? 'text-green-500'
                                                        : isOver
                                                          ? 'text-destructive'
                                                          : 'text-foreground'
                                                )}>
                                                {item.value.toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Label */}
                                    <span className='mt-2 text-sm font-medium text-foreground'>
                                        {item.label}
                                    </span>

                                    {/* Status indicator */}
                                    {!isComplete && (
                                        <span className='mt-1 text-xs text-destructive'>
                                            {item.value < 100
                                                ? `Falta ${(100 - item.value).toFixed(1)}%`
                                                : `+${(item.value - 100).toFixed(1)}%`}
                                        </span>
                                    )}
                                    {isComplete && (
                                        <span className='mt-1 text-xs text-green-500 flex items-center gap-1'>
                                            <Check className='h-3 w-3' />
                                            Completo
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    {/* {isMealDistributionValid && areMacroDistributionsValid && (
                        <motion.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            className='p-4 rounded-xl bg-green-500/10 border border-green-500/20'>
                            <div className='flex items-center gap-2 mb-2'>
                                <Check className='h-4 w-4 text-green-500' />
                                <span className='text-sm font-medium text-green-600 dark:text-green-400'>
                                    Distribucion completa
                                </span>
                            </div>
                            <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                                {MEAL_CONFIG.filter(
                                    m => enabledMeals[m.key]
                                ).map(({key, label}) => (
                                    <div key={key} className='text-center'>
                                        <span className='text-xs text-muted-foreground'>
                                            {label}
                                        </span>
                                        <p className='font-semibold text-foreground'>
                                            {Math.round(
                                                (planCalories *
                                                    mealPercentages[key]) /
                                                    100
                                            )}{' '}
                                            kcal
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )} */}
                </CardContent>
            </Card>
            {/* <Button
                onClick={submitGeneration}
                disabled={isGenerating}
                className='w-full h-12 rounded-xl bg-gradient-to-r text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all'>
                {isGenerating ? (
                    <>
                        <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                        Generando plan de comidas...
                    </>
                ) : (
                    <>
                        <Sparkles className='mr-2 h-5 w-5' />
                        Generar plan de comidas
                    </>
                )}
            </Button> */}
        </motion.div>
    );
}
