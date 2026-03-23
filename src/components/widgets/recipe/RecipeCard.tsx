import {Badge} from '@/components/ui/badge';
import {RecipeDTO} from '@/lib/dto/RecipeDTO';
import {cn} from '@/lib/utils';
import {motion} from 'framer-motion';
import {
    Apple,
    Beef,
    Coffee,
    Flame,
    GlassWater,
    Moon,
    Sparkles,
    Sun,
    Wheat
} from 'lucide-react';
import Link from 'next/link';

export function RecipeCard({recipe}: {recipe: RecipeDTO}) {
    const mealTypeLabel: Record<string, string> = {
        SMOOTHIE: 'Licuado',
        BREAKFAST: 'Desayuno',
        SNACK: 'Colacion',
        LUNCH: 'Comida',
        DINNER: 'Cena',
        DRINKS: 'Bebida'
    };

    const mealTypeConfig: Record<
        string,
        {color: string; icon: React.ElementType}
    > = {
        BREAKFAST: {
            color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
            icon: Coffee
        },
        LUNCH: {
            color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
            icon: Sun
        },
        DINNER: {
            color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
            icon: Moon
        },
        SNACK: {
            color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
            icon: Apple
        },
        SMOOTHIE: {
            color: 'bg-green-500/10 text-green-600 border-green-500/20',
            icon: GlassWater
        },
        DRINKS: {
            color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
            icon: GlassWater
        }
    };

    const config = mealTypeConfig[recipe.mealType] || mealTypeConfig.SNACK;
    const MealIcon = config.icon;

    return (
        <Link href={`/recetas/${recipe.id}/editar`} className='block'>
            <motion.div
                layout
                initial={{opacity: 0, scale: 0.95}}
                animate={{opacity: 1, scale: 1}}
                exit={{opacity: 0, scale: 0.95}}
                transition={{duration: 0.2}}
                className='group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer'>
                {/* Image */}
                <div className='relative h-44 w-full overflow-hidden bg-secondary/30'>
                    <img
                        src={recipe.imageUrl ?? undefined}
                        alt={recipe.title}
                        className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent' />

                    {/* Meal Type Badge */}
                    <Badge
                        variant='outline'
                        className={cn(
                            'absolute top-3 left-3 text-xs font-medium border backdrop-blur-sm',
                            config.color
                        )}>
                        <MealIcon className='h-3 w-3 mr-1' />
                        {mealTypeLabel[recipe.mealType] ?? recipe.mealType}
                    </Badge>
                </div>

                {/* Content */}
                <div className='flex flex-col flex-1 p-4'>
                    <h3 className='text-base font-semibold text-foreground line-clamp-1 mb-1'>
                        {recipe.title}
                    </h3>
                    {/* Macros */}
                    <div className='mt-auto grid grid-cols-4 gap-2 pt-3 border-t border-border'>
                        <div className='flex flex-col items-center'>
                            <div className='flex items-center gap-1 text-orange-500'>
                                <Flame className='h-3 w-3' />
                                <span className='text-xs font-semibold'>
                                    {recipe.calories}
                                </span>
                            </div>
                            <span className='text-[10px] text-muted-foreground'>
                                kcal
                            </span>
                        </div>
                        <div className='flex flex-col items-center'>
                            <div className='flex items-center gap-1 text-red-500'>
                                <Beef className='h-3 w-3' />
                                <span className='text-xs font-semibold'>
                                    {recipe.protein}g
                                </span>
                            </div>
                            <span className='text-[10px] text-muted-foreground'>
                                protein
                            </span>
                        </div>
                        <div className='flex flex-col items-center'>
                            <div className='flex items-center gap-1 text-amber-500'>
                                <Wheat className='h-3 w-3' />
                                <span className='text-xs font-semibold'>
                                    {recipe.carbs}g
                                </span>
                            </div>
                            <span className='text-[10px] text-muted-foreground'>
                                carbs
                            </span>
                        </div>
                        <div className='flex flex-col items-center'>
                            <div className='flex items-center gap-1 text-blue-500'>
                                <Sparkles className='h-3 w-3' />
                                <span className='text-xs font-semibold'>
                                    {recipe.fats}g
                                </span>
                            </div>
                            <span className='text-[10px] text-muted-foreground'>
                                fats
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
