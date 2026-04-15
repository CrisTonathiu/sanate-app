'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {MEAL_CONFIG, MealType} from '@/lib/config/meal-config';
import {cn} from '@/lib/utils';
import {AnimatePresence, motion} from 'framer-motion';
import {AlertCircle, Check, Percent, PieChart, Plus, X} from 'lucide-react';
import React from 'react';

interface ProtocolDistributionCardProps {
    planCalories: number;
    enabledMeals: Record<MealType, boolean>;
    setEnabledMeals: React.Dispatch<
        React.SetStateAction<Record<MealType, boolean>>
    >;
    mealPercentages: Record<MealType, number>;
    setMealPercentages: React.Dispatch<
        React.SetStateAction<Record<MealType, number>>
    >;
}

export function ProtocolDistributionCard({
    planCalories,
    enabledMeals,
    setEnabledMeals,
    mealPercentages,
    setMealPercentages
}: ProtocolDistributionCardProps) {
    // Check if distribution is valid (totals 100%)
    const enabledMealsList = Object.entries(enabledMeals)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);
    const totalPercentage = enabledMealsList.reduce(
        (sum, key) =>
            sum + mealPercentages[key as keyof typeof mealPercentages],
        0
    );
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

    // Add a meal type
    const onAddMealType = (mealType: MealType) => {
        if (enabledMeals[mealType]) return;
        const newEnabled = {...enabledMeals, [mealType]: true};
        setEnabledMeals(newEnabled);
        const enabledKeys = Object.keys(newEnabled).filter(
            k => newEnabled[k as MealType]
        );
        const equalPct = Math.round(100 / enabledKeys.length);
        const newPcts: Record<MealType, number> = {} as any;
        Object.keys(newEnabled).forEach(k => {
            newPcts[k as MealType] = newEnabled[k as MealType] ? equalPct : 0;
        });
        setMealPercentages(newPcts);
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
        const equalPct = Math.round(100 / enabledKeys.length);
        const newPcts: Record<MealType, number> = {} as any;
        Object.keys(newEnabled).forEach(k => {
            newPcts[k as MealType] = newEnabled[k as MealType] ? equalPct : 0;
        });
        setMealPercentages(newPcts);
    };

    const [pctDraft, setPctDraft] = React.useState<
        Partial<Record<MealType, string>>
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
                        Define el porcentaje de calorias para cada tipo de
                        comida. Total: {planCalories} kcal
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
                                        </motion.div>
                                    );
                                }
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Total Percentage Bar */}
                    <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium text-foreground'>
                                Total porcentaje
                            </span>
                            <span
                                className={cn(
                                    'text-sm font-semibold',
                                    totalPercentage === 100
                                        ? 'text-green-500'
                                        : 'text-destructive'
                                )}>
                                {totalPercentage.toFixed(2)}%
                            </span>
                        </div>
                        <div className='h-2 rounded-full bg-secondary overflow-hidden'>
                            <motion.div
                                initial={{width: 0}}
                                animate={{
                                    width: `${Math.min(totalPercentage, 100)}%`
                                }}
                                className={cn(
                                    'h-full rounded-full transition-colors',
                                    totalPercentage === 100
                                        ? 'bg-green-500'
                                        : totalPercentage > 100
                                          ? 'bg-destructive'
                                          : 'bg-amber-500'
                                )}
                            />
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {totalPercentage !== 100 && (
                                <motion.div
                                    initial={{opacity: 0, height: 0}}
                                    animate={{opacity: 1, height: 'auto'}}
                                    exit={{opacity: 0, height: 0}}
                                    className='flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20'>
                                    <AlertCircle className='h-4 w-4 text-destructive flex-shrink-0' />
                                    <span className='text-sm text-destructive'>
                                        {totalPercentage < 100
                                            ? `Faltan ${100 - totalPercentage}% para completar el 100%`
                                            : `Excede el 100% por ${totalPercentage - 100}%`}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Summary */}
                    {totalPercentage === 100 && (
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
                    )}
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
