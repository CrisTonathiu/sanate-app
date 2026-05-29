import {DayMeals, MealSlot} from '@/lib/interface/meal-interface';
import {MEAL_CONFIG, MealType} from '@/lib/config/meal-config';
import {cn} from '@/lib/utils';
import {motion} from 'framer-motion';
import {Calendar} from 'lucide-react';
import MealCell from './MealCell';

const DAY_WIDTH_PX = 96;
const MEAL_MIN_WIDTH_PX = 256;
const DAY_COLUMN_CLASS = 'w-24';
const MEAL_COLUMN_CLASS = 'min-w-64';

interface WeeklyMealPlannerProps {
    weekPlan: DayMeals[];
    onOpenRecipeModal: (day: string, mealType: MealType) => void;
    onMealUpdate?: (
        day: string,
        mealType: MealType,
        updatedMeal: MealSlot,
        options?: {applyToAllDays?: boolean}
    ) => void;
}

export default function WeeklyMealPlanner({
    weekPlan,
    onOpenRecipeModal,
    onMealUpdate
}: WeeklyMealPlannerProps) {
    const mealColumns = MEAL_CONFIG.filter(({key}) =>
        weekPlan.some(day => key in day)
    );
    const tableMinWidth =
        DAY_WIDTH_PX + mealColumns.length * MEAL_MIN_WIDTH_PX;

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

            <div className='w-full overflow-x-auto overscroll-x-contain'>
                <table
                    className='w-full table-fixed border-separate border-spacing-0'
                    style={{minWidth: tableMinWidth}}>
                    <colgroup>
                        <col style={{width: DAY_WIDTH_PX}} />
                        {mealColumns.map(({key}) => (
                            <col key={key} />
                        ))}
                    </colgroup>
                    <thead>
                        <tr className='border-b border-border bg-secondary/20'>
                            <th
                                className={cn(
                                    DAY_COLUMN_CLASS,
                                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'
                                )}>
                                Dia
                            </th>
                            {mealColumns.map(({key, label, icon: Icon}) => (
                                <th
                                    key={key}
                                    className={cn(
                                        MEAL_COLUMN_CLASS,
                                        'px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'
                                    )}>
                                    <span className='flex items-center gap-1.5'>
                                        <Icon className='h-3.5 w-3.5' />
                                        {label}
                                    </span>
                                </th>
                            ))}
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
                                <td
                                    className={cn(
                                        DAY_COLUMN_CLASS,
                                        'px-4 py-3 align-top'
                                    )}>
                                    <span className='text-sm font-semibold text-foreground'>
                                        {day.day}
                                    </span>
                                </td>
                                {mealColumns.map(({key, label}) => (
                                    <td
                                        key={key}
                                        className={cn(
                                            MEAL_COLUMN_CLASS,
                                            'px-2 py-2 align-top'
                                        )}>
                                        <MealCell
                                            meal={day[key]}
                                            mealType={key}
                                            dayLabel={day.day}
                                            mealTypeLabel={label}
                                            onReplace={() =>
                                                onOpenRecipeModal(day.day, key)
                                            }
                                            onEdit={(m, options) =>
                                                onMealUpdate?.(
                                                    day.day,
                                                    key,
                                                    m,
                                                    options
                                                )
                                            }
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
