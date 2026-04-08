import {Apple, Coffee, Moon, Sun} from 'lucide-react';

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
