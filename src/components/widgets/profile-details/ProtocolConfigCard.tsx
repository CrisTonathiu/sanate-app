'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {Separator} from '@/components/ui/separator';
import {calculateGEB, calculateGEBMifflin} from '@/lib/helpers';
import {motion} from 'framer-motion';
import {useEffect, useMemo, useState} from 'react';
export interface GeneratePlanPayload {
    planCalories: number;
}

interface ProtocolConfigCardProps {
    height: number;
    age: number;
    gender: 'MALE' | 'FEMALE';
    planCalories: number;
    setPlanCalories: (calories: number) => void;
}

const PROTEIN_PER_KG_MULTIPLIER = 4;
const CARBS_PER_KG_MULTIPLIER = 4;
const FATS_PER_KG_MULTIPLIER = 9;

export default function ProtocolConfigCard({
    height,
    age,
    gender,
    planCalories,
    setPlanCalories
}: ProtocolConfigCardProps) {
    const [weight, setWeight] = useState(76.0);
    const [activityLevel, setActivityLevel] = useState<any>('moderado');
    const [formula, setFormula] = useState<'mifflin' | 'harris'>('mifflin');

    // Macronutrient percentages
    const [carbsPercent, setCarbsPercent] = useState(45);
    const [proteinPercent, setProteinPercent] = useState(35);
    const [fatsPercent, setFatsPercent] = useState(20);
    const macroPercentTotal = carbsPercent + proteinPercent + fatsPercent;
    const isMacroPercentValid = macroPercentTotal === 100;

    useEffect(() => {
        console.log('Recalculating macros with calories:', planCalories);
    }, [planCalories]);

    // Calculate macros based on plan calories
    const carbsGrams =
        (planCalories * (carbsPercent / 100)) / CARBS_PER_KG_MULTIPLIER;
    const carbsKcal = carbsGrams * CARBS_PER_KG_MULTIPLIER;
    const proteinGrams =
        (planCalories * (proteinPercent / 100)) / PROTEIN_PER_KG_MULTIPLIER;
    const proteinKcal = proteinGrams * PROTEIN_PER_KG_MULTIPLIER;
    const fatsGrams =
        (planCalories * (fatsPercent / 100)) / FATS_PER_KG_MULTIPLIER;
    const fatsKcal = fatsGrams * FATS_PER_KG_MULTIPLIER;

    // Per kg calculations
    const carbsPerKg = carbsGrams / weight;
    const proteinPerKg = proteinGrams / weight;
    const fatsPerKg = fatsGrams / weight;

    // Activity factor mapping
    const activityFactors: Record<any, {label: string; factor: number}> = {
        sedentario: {label: 'Sedentaria', factor: 1.2},
        ligero: {label: 'Ligera', factor: 1.375},
        moderado: {label: 'Moderada', factor: 1.55},
        activo: {label: 'Activa', factor: 1.725},
        muy_activo: {label: 'Muy activa', factor: 1.9}
    };

    const geb = useMemo(() => {
        if (formula === 'mifflin') {
            return calculateGEBMifflin(weight, height, age, gender);
        }
        // Implement other formulas if needed
        return calculateGEB(weight, height, age, gender);
    }, [formula, weight, height, age, gender]);

    const eta = geb * 0.1;
    const activityFactor = activityFactors[activityLevel]?.factor || 1.55;
    const totalCalories = geb * activityFactor;

    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Left Card - Datos y calorias del plan */}
                <Card className='border-border bg-card'>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-lg font-semibold'>
                            Datos y calorias del plan
                        </CardTitle>
                        <p className='text-sm text-muted-foreground'>
                            Calculo de necesidades energeticas
                        </p>
                    </CardHeader>
                    <CardContent className='space-y-5'>
                        {/* Formula */}
                        <div className='space-y-1.5'>
                            <Label className='text-xs text-muted-foreground'>
                                Formula
                            </Label>
                            <Select
                                value={formula}
                                onValueChange={value =>
                                    setFormula(value as 'mifflin' | 'harris')
                                }>
                                <SelectTrigger className='bg-secondary/30 border-border'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='mifflin'>
                                        MIFFLIN
                                    </SelectItem>
                                    <SelectItem value='harris'>
                                        HARRIS-BENEDICT
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Weight & Height */}
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-1.5'>
                                <Label className='text-xs text-muted-foreground'>
                                    Peso
                                </Label>
                                <div className='relative'>
                                    <Input
                                        type='number'
                                        value={weight}
                                        onChange={e =>
                                            setWeight(
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className='bg-secondary/30 border-border pr-10'
                                    />
                                    <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
                                        kg
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* GEB Result */}
                        <div className='flex justify-end'>
                            <span className='text-sm'>
                                <span className='text-muted-foreground'>
                                    GEB:{' '}
                                </span>
                                <span className='font-semibold text-foreground'>
                                    {geb.toFixed(2)} kcal
                                </span>
                            </span>
                        </div>

                        {formula === 'harris' && (
                            <div className='flex justify-end'>
                                <span className='text-sm'>
                                    <span className='text-muted-foreground'>
                                        ETA (10%):{' '}
                                    </span>
                                    <span className='font-semibold text-foreground'>
                                        {eta.toFixed(2)} kcal
                                    </span>
                                </span>
                            </div>
                        )}

                        <Separator />

                        {/* Activity Factor */}
                        <div className='space-y-1.5'>
                            <Label className='text-xs text-muted-foreground'>
                                Factor de actividad fisica
                            </Label>
                            <div className='grid grid-cols-2 gap-4'>
                                <Select
                                    value={activityLevel}
                                    onValueChange={value =>
                                        setActivityLevel(value)
                                    }>
                                    <SelectTrigger className='bg-secondary/30 border-border'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='sedentario'>
                                            Sedentaria
                                        </SelectItem>
                                        <SelectItem value='ligero'>
                                            Ligera
                                        </SelectItem>
                                        <SelectItem value='moderado'>
                                            Moderada
                                        </SelectItem>
                                        <SelectItem value='activo'>
                                            Activa
                                        </SelectItem>
                                        <SelectItem value='muy_activo'>
                                            Muy activa
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Total Calories */}
                        <div className='flex justify-end'>
                            <span className='text-sm'>
                                <span className='text-muted-foreground'>
                                    Calorias totales (GET):{' '}
                                </span>
                                <span className='font-semibold text-foreground'>
                                    {totalCalories
                                        ? totalCalories.toFixed(2)
                                        : '0'}{' '}
                                    kcal
                                </span>
                            </span>
                        </div>

                        <Separator />

                        {/* Plan Calories */}
                        <div className='space-y-1.5'>
                            <Label className='text-xs text-muted-foreground'>
                                Calorias para tu plan
                            </Label>
                            <div className='grid grid-cols-2 items-center gap-4'>
                                <div className='w-full'>
                                    <Input
                                        type='number'
                                        min={0}
                                        value={planCalories}
                                        onChange={e => {
                                            const parsed = parseInt(
                                                e.target.value,
                                                10
                                            );
                                            if (!Number.isFinite(parsed)) {
                                                setPlanCalories(0);
                                                return;
                                            }

                                            setPlanCalories(
                                                Math.max(0, parsed)
                                            );
                                        }}
                                        className='w-full bg-secondary/30 border-border'
                                    />
                                </div>
                                <div className='w-full text-right'>
                                    <span className='text-4xl font-bold text-foreground'>
                                        {planCalories}
                                    </span>
                                    <span className='text-lg text-muted-foreground ml-1'>
                                        Kcal
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Card - Macronutrientes */}
                <Card className='border-border bg-card'>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-lg font-semibold'>
                            Macronutrientes
                        </CardTitle>
                        <p className='text-sm text-muted-foreground'>
                            Distribucion de nutrientes
                        </p>
                    </CardHeader>
                    <CardContent className='space-y-5'>
                        {/* Carbohidratos */}
                        <div className='space-y-1.5'>
                            <Label className='text-xs text-muted-foreground'>
                                Carbohidratos
                            </Label>
                            <div className='grid grid-cols-3 gap-2'>
                                <div className='relative'>
                                    <Input
                                        type='number'
                                        value={carbsPercent}
                                        onChange={e =>
                                            setCarbsPercent(
                                                parseInt(e.target.value) || 0
                                            )
                                        }
                                        className='bg-secondary/30 border-border pr-6'
                                    />
                                    <span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>
                                        %
                                    </span>
                                </div>
                                <div className='relative'>
                                    <Input
                                        type='number'
                                        value={carbsGrams.toFixed(1)}
                                        readOnly
                                        className='bg-secondary/20 border-border pr-6 text-muted-foreground'
                                    />
                                    <span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>
                                        gr
                                    </span>
                                </div>
                                <div className='relative'>
                                    <Input
                                        type='number'
                                        value={carbsKcal.toFixed(0)}
                                        readOnly
                                        className='bg-secondary/20 border-border pr-8 text-muted-foreground'
                                    />
                                    <span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>
                                        kcal
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Proteina */}
                        <div className='space-y-1.5'>
                            <Label className='text-xs text-muted-foreground'>
                                Proteina
                            </Label>
                            <div className='grid grid-cols-3 gap-2'>
                                <div className='relative'>
                                    <Input
                                        type='number'
                                        value={proteinPercent}
                                        onChange={e =>
                                            setProteinPercent(
                                                parseInt(e.target.value) || 0
                                            )
                                        }
                                        className='bg-secondary/30 border-border pr-6'
                                    />
                                    <span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>
                                        %
                                    </span>
                                </div>
                                <div className='relative'>
                                    <Input
                                        type='number'
                                        value={proteinGrams.toFixed(1)}
                                        readOnly
                                        className='bg-secondary/20 border-border pr-6 text-muted-foreground'
                                    />
                                    <span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>
                                        gr
                                    </span>
                                </div>
                                <div className='relative'>
                                    <Input
                                        type='number'
                                        value={proteinKcal.toFixed(0)}
                                        readOnly
                                        className='bg-secondary/20 border-border pr-8 text-muted-foreground'
                                    />
                                    <span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>
                                        kcal
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Grasas */}
                        <div className='space-y-1.5'>
                            <Label className='text-xs text-muted-foreground'>
                                Grasas
                            </Label>
                            <div className='grid grid-cols-3 gap-2'>
                                <div className='relative'>
                                    <Input
                                        type='number'
                                        value={fatsPercent}
                                        onChange={e =>
                                            setFatsPercent(
                                                parseInt(e.target.value) || 0
                                            )
                                        }
                                        className='bg-secondary/30 border-border pr-6'
                                    />
                                    <span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>
                                        %
                                    </span>
                                </div>
                                <div className='relative'>
                                    <Input
                                        type='number'
                                        value={fatsGrams.toFixed(1)}
                                        readOnly
                                        className='bg-secondary/20 border-border pr-6 text-muted-foreground'
                                    />
                                    <span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>
                                        gr
                                    </span>
                                </div>
                                <div className='relative'>
                                    <Input
                                        type='number'
                                        value={fatsKcal.toFixed(0)}
                                        readOnly
                                        className='bg-secondary/20 border-border pr-8 text-muted-foreground'
                                    />
                                    <span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>
                                        kcal
                                    </span>
                                </div>
                            </div>
                        </div>
                        {!isMacroPercentValid && (
                            <p className='text-sm text-destructive'>
                                El porcentaje total de macronutrientes debe ser
                                100%. Actualmente es {macroPercentTotal}%.
                            </p>
                        )}

                        <Separator className='my-4' />

                        {/* Per kg calculations */}
                        <div className='space-y-3'>
                            <div className='flex items-center justify-between'>
                                <span className='text-sm text-muted-foreground'>
                                    Carbohidratos ({carbsGrams.toFixed(2)} gr.)
                                    / Peso ({weight} kg.) =
                                </span>
                                <Input
                                    type='number'
                                    value={carbsPerKg.toFixed(2)}
                                    readOnly
                                    className='w-24 bg-secondary/20 border-border text-right'
                                />
                            </div>
                            <div className='flex items-center justify-between'>
                                <span className='text-sm text-muted-foreground'>
                                    Proteina ({proteinGrams.toFixed(2)} gr.) /
                                    Peso ({weight} kg.) =
                                </span>
                                <Input
                                    type='number'
                                    value={proteinPerKg.toFixed(2)}
                                    readOnly
                                    className='w-24 bg-secondary/20 border-border text-right'
                                />
                            </div>
                            <div className='flex items-center justify-between'>
                                <span className='text-sm text-muted-foreground'>
                                    Grasas ({fatsGrams.toFixed(2)} gr.) / Peso (
                                    {weight} kg.) =
                                </span>
                                <Input
                                    type='number'
                                    value={fatsPerKg.toFixed(2)}
                                    readOnly
                                    className='w-24 bg-secondary/20 border-border text-right'
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}
