import {Apple, Coffee, GlassWater, Moon, Sun} from 'lucide-react';

export const MEAL_CONFIG = [
    {
        key: 'smoothie',
        icon: Coffee,
        label: 'Batido',
        color: 'bg-green-500/10 text-green-600 border-green-500/20'
    },
    {
        key: 'breakfast',
        icon: Coffee,
        label: 'Desayuno',
        color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
    },
    {
        key: 'snack1',
        icon: Apple,
        label: 'Colación 1',
        color: 'bg-red-500/10 text-red-600 border-red-500/20'
    },
    {
        key: 'lunch',
        icon: Sun,
        label: 'Comida',
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    },
    {
        key: 'snack2',
        icon: Apple,
        label: 'Colación 2',
        color: 'bg-red-500/10 text-red-600 border-red-500/20'
    },
    {
        key: 'dinner',
        icon: Moon,
        label: 'Cena',
        color: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
    },
    {
        key: 'drinks',
        icon: Coffee,
        label: 'Bebida',
        color: 'bg-teal-500/10 text-teal-600 border-teal-500/20'
    }
] as const;

export type MealType = (typeof MEAL_CONFIG)[number]['key'];

export type MealPercentages = Record<MealType, number>;

export type EnabledMeals = Record<MealType, boolean>;

export const DEFAULT_ENABLED_MEALS: EnabledMeals = {
    smoothie: false,
    breakfast: true,
    snack1: false,
    lunch: true,
    snack2: false,
    dinner: true,
    drinks: false
};

export const mealTypeConfig: Record<
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

export const mealTypeLabel: Record<string, string> = {
    SMOOTHIE: 'Licuado',
    BREAKFAST: 'Desayuno',
    SNACK: 'Colacion',
    LUNCH: 'Comida',
    DINNER: 'Cena',
    DRINKS: 'Bebida'
};

export const macros = ['carbs', 'protein', 'fat'] as const;

export type MacroType = (typeof macros)[number];

export type MacroPercents = Record<MacroType, number>;

export type MacroMealPercentages = Record<MacroType, MealPercentages>;
