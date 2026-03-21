import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {Beef, Droplets, Flame, Info, Sparkles, Wheat} from 'lucide-react';

interface NutritionData {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

export function NutritionCard({nutrition}: {nutrition: NutritionData}) {
    const nutrients = [
        {
            label: 'Calorías',
            value: nutrition.calories,
            unit: 'kcal',
            icon: Flame,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10'
        },
        {
            label: 'Proteínas',
            value: nutrition.protein,
            unit: 'g',
            icon: Beef,
            color: 'text-red-400',
            bg: 'bg-red-400/10'
        },
        {
            label: 'Carbohidratos',
            value: nutrition.carbs,
            unit: 'g',
            icon: Wheat,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10'
        },
        {
            label: 'Grasas',
            value: nutrition.fats,
            unit: 'g',
            icon: Droplets,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        }
    ];

    return (
        <Card className='border-border bg-card/50 backdrop-blur-sm sticky top-6'>
            <CardHeader className='pb-3 border-b border-border'>
                <CardTitle className='text-base flex items-center gap-2'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
                        <Sparkles className='h-4 w-4 text-primary' />
                    </div>
                    Resumen Nutricional
                </CardTitle>
            </CardHeader>
            <CardContent className='pt-4'>
                <div className='space-y-3'>
                    {nutrients.map(nutrient => (
                        <div
                            key={nutrient.label}
                            className='flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border'>
                            <div className='flex items-center gap-3'>
                                <div
                                    className={cn(
                                        'flex h-9 w-9 items-center justify-center rounded-lg',
                                        nutrient.bg
                                    )}>
                                    <nutrient.icon
                                        className={cn(
                                            'h-4 w-4',
                                            nutrient.color
                                        )}
                                    />
                                </div>
                                <span className='text-sm font-medium text-foreground'>
                                    {nutrient.label}
                                </span>
                            </div>
                            <div className='text-right'>
                                <span className='text-lg font-semibold text-foreground'>
                                    {nutrient.value}
                                </span>
                                <span className='text-sm text-muted-foreground ml-1'>
                                    {nutrient.unit}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className='mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20'>
                    <div className='flex items-start gap-2'>
                        <Info className='h-4 w-4 text-primary mt-0.5 shrink-0' />
                        <p className='text-xs text-muted-foreground'>
                            Los valores nutricionales se calculan en base a los
                            datos de los ingredientes. Los valores reales pueden
                            variar.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
