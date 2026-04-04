import {DayMeals} from '@/lib/interface/meal-interface';
import {DEFAULT_ENABLED_MEALS, MealType} from '@/lib/config/meal-config';
import {cn} from '@/lib/utils';
import {motion} from 'framer-motion';
import {Apple, Calendar, Coffee, Moon, Sun} from 'lucide-react';
import MealCell from './MealCell';
import {useState} from 'react';

interface WeeklyMealPlannerProps {
    weekPlan: DayMeals[];
    onOpenRecipeModal: (day: string, mealType: MealType) => void;
}

export default function WeeklyMealPlanner({
    weekPlan,
    onOpenRecipeModal
}: WeeklyMealPlannerProps) {
    const [enabledMeals, setEnabledMeals] = useState(DEFAULT_ENABLED_MEALS);

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
                            {enabledMeals.smoothie && (
                                <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                    <span className='flex items-center gap-1.5'>
                                        <Coffee className='h-3.5 w-3.5' />
                                        Batido
                                    </span>
                                </th>
                            )}
                            {enabledMeals.breakfast && (
                                <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                    <span className='flex items-center gap-1.5'>
                                        <Coffee className='h-3.5 w-3.5' />
                                        Desayuno
                                    </span>
                                </th>
                            )}

                            {enabledMeals.snack1 && (
                                <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                    <span className='flex items-center gap-1.5'>
                                        <Apple className='h-3.5 w-3.5' />
                                        Colación 1
                                    </span>
                                </th>
                            )}

                            {enabledMeals.lunch && (
                                <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                    <span className='flex items-center gap-1.5'>
                                        <Sun className='h-3.5 w-3.5' />
                                        Comida
                                    </span>
                                </th>
                            )}

                            {enabledMeals.snack2 && (
                                <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                    <span className='flex items-center gap-1.5'>
                                        <Apple className='h-3.5 w-3.5' />
                                        Colación 2
                                    </span>
                                </th>
                            )}

                            {enabledMeals.dinner && (
                                <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                    <span className='flex items-center gap-1.5'>
                                        <Moon className='h-3.5 w-3.5' />
                                        Cena
                                    </span>
                                </th>
                            )}

                            {enabledMeals.drinks && (
                                <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                                    <span className='flex items-center gap-1.5'>
                                        <Moon className='h-3.5 w-3.5' />
                                        Bebida
                                    </span>
                                </th>
                            )}
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
                                {enabledMeals.smoothie && (
                                    <td className='px-2 py-2 align-top'>
                                        <MealCell
                                            meal={day.smoothie}
                                            mealType='smoothie'
                                            onReplace={() =>
                                                onOpenRecipeModal(
                                                    day.day,
                                                    'smoothie'
                                                )
                                            }
                                            onEdit={() => {}}
                                        />
                                    </td>
                                )}
                                {enabledMeals.breakfast && (
                                    <td className='px-2 py-2 align-top'>
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
                                )}
                                {enabledMeals.snack1 && (
                                    <td className='px-2 py-2 align-top'>
                                        <MealCell
                                            meal={day.snack1}
                                            mealType='snack1'
                                            onReplace={() =>
                                                onOpenRecipeModal(
                                                    day.day,
                                                    'snack1'
                                                )
                                            }
                                            onEdit={() => {}}
                                        />
                                    </td>
                                )}

                                {enabledMeals.lunch && (
                                    <td className='px-2 py-2 align-top'>
                                        <MealCell
                                            meal={day.lunch}
                                            mealType='lunch'
                                            onReplace={() =>
                                                onOpenRecipeModal(
                                                    day.day,
                                                    'lunch'
                                                )
                                            }
                                            onEdit={() => {}}
                                        />
                                    </td>
                                )}

                                {enabledMeals.snack2 && (
                                    <td className='px-2 py-2 align-top'>
                                        <MealCell
                                            meal={day.snack2}
                                            mealType='snack2'
                                            onReplace={() =>
                                                onOpenRecipeModal(
                                                    day.day,
                                                    'snack2'
                                                )
                                            }
                                            onEdit={() => {}}
                                        />
                                    </td>
                                )}

                                {enabledMeals.dinner && (
                                    <td className='px-2 py-2 align-top'>
                                        <MealCell
                                            meal={day.dinner}
                                            mealType='dinner'
                                            onReplace={() =>
                                                onOpenRecipeModal(
                                                    day.day,
                                                    'dinner'
                                                )
                                            }
                                            onEdit={() => {}}
                                        />
                                    </td>
                                )}

                                {enabledMeals.drinks && (
                                    <td className='px-2 py-2 align-top'>
                                        <MealCell
                                            meal={day.drinks}
                                            mealType='drinks'
                                            onReplace={() =>
                                                onOpenRecipeModal(
                                                    day.day,
                                                    'drinks'
                                                )
                                            }
                                            onEdit={() => {}}
                                        />
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
