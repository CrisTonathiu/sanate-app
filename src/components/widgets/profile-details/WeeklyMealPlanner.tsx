import {DayMeals} from '@/lib/interface/meal-interface';
import {cn} from '@/lib/utils';
import {motion} from 'framer-motion';
import {Apple, Calendar, Coffee, Moon, Sun} from 'lucide-react';
import MealCell from './MealCell';

interface WeeklyMealPlannerProps {
    weekPlan: DayMeals[];
    onOpenRecipeModal: (
        day: string,
        mealType: 'breakfast' | 'snack' | 'lunch' | 'dinner'
    ) => void;
}

export default function WeeklyMealPlanner({
    weekPlan,
    onOpenRecipeModal
}: WeeklyMealPlannerProps) {
    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            className='rounded-2xl border border-border bg-card overflow-hidden'>
            <div className='p-4 border-b border-border bg-secondary/30'>
                <h3 className='text-lg font-semibold text-foreground flex items-center gap-2'>
                    <Calendar className='h-5 w-5 text-primary' />
                    Planificador semanal de comidas
                </h3>
            </div>

            <div className='overflow-x-auto'>
                <table className='w-full min-w-[800px] table-fixed'>
                    <thead>
                        <tr className='border-b border-border bg-secondary/20'>
                            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-24'>
                                Dia
                            </th>
                            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                <span className='flex items-center gap-1.5'>
                                    <Coffee className='h-3.5 w-3.5' />
                                    Desayuno
                                </span>
                            </th>
                            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                <span className='flex items-center gap-1.5'>
                                    <Apple className='h-3.5 w-3.5' />
                                    Colación
                                </span>
                            </th>
                            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                <span className='flex items-center gap-1.5'>
                                    <Sun className='h-3.5 w-3.5' />
                                    Comida
                                </span>
                            </th>
                            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                <span className='flex items-center gap-1.5'>
                                    <Moon className='h-3.5 w-3.5' />
                                    Cena
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {weekPlan.map((day, index) => (
                            <tr
                                key={day.day}
                                className={cn(
                                    'border-b border-border last:border-0',
                                    index % 2 === 0
                                        ? 'bg-background'
                                        : 'bg-secondary/10'
                                )}>
                                <td className='px-4 py-3'>
                                    <span className='text-sm font-semibold text-foreground'>
                                        {day.day}
                                    </span>
                                </td>
                                <td className='px-2 py-2'>
                                    <MealCell
                                        meal={day.breakfast}
                                        mealType='breakfast'
                                        onReplace={() =>
                                            onOpenRecipeModal(
                                                day.day,
                                                'breakfast'
                                            )
                                        }
                                        onEdit={() => {}}
                                    />
                                </td>
                                <td className='px-2 py-2'>
                                    <MealCell
                                        meal={day.snack}
                                        mealType='snack'
                                        onReplace={() =>
                                            onOpenRecipeModal(day.day, 'snack')
                                        }
                                        onEdit={() => {}}
                                    />
                                </td>
                                <td className='px-2 py-2'>
                                    <MealCell
                                        meal={day.lunch}
                                        mealType='lunch'
                                        onReplace={() =>
                                            onOpenRecipeModal(day.day, 'lunch')
                                        }
                                        onEdit={() => {}}
                                    />
                                </td>
                                <td className='px-2 py-2'>
                                    <MealCell
                                        meal={day.dinner}
                                        mealType='dinner'
                                        onReplace={() =>
                                            onOpenRecipeModal(day.day, 'dinner')
                                        }
                                        onEdit={() => {}}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
