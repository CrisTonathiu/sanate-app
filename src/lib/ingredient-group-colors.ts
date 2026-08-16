export const INGREDIENT_GROUP_COLORS = [
    {
        id: 'violet',
        label: 'Violeta',
        swatch: 'bg-violet-500',
        pill: 'border-violet-400/40 bg-violet-500/15 text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/20 dark:text-violet-200'
    },
    {
        id: 'rose',
        label: 'Rosa',
        swatch: 'bg-rose-500',
        pill: 'border-rose-400/40 bg-rose-500/15 text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/20 dark:text-rose-200'
    },
    {
        id: 'amber',
        label: 'Ámbar',
        swatch: 'bg-amber-500',
        pill: 'border-amber-400/40 bg-amber-500/15 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-200'
    },
    {
        id: 'emerald',
        label: 'Esmeralda',
        swatch: 'bg-emerald-500',
        pill: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/20 dark:text-emerald-200'
    },
    {
        id: 'sky',
        label: 'Cielo',
        swatch: 'bg-sky-500',
        pill: 'border-sky-400/40 bg-sky-500/15 text-sky-800 dark:border-sky-400/30 dark:bg-sky-500/20 dark:text-sky-200'
    },
    {
        id: 'orange',
        label: 'Naranja',
        swatch: 'bg-orange-500',
        pill: 'border-orange-400/40 bg-orange-500/15 text-orange-800 dark:border-orange-400/30 dark:bg-orange-500/20 dark:text-orange-200'
    },
    {
        id: 'pink',
        label: 'Fucsia',
        swatch: 'bg-pink-500',
        pill: 'border-pink-400/40 bg-pink-500/15 text-pink-800 dark:border-pink-400/30 dark:bg-pink-500/20 dark:text-pink-200'
    },
    {
        id: 'teal',
        label: 'Verde azulado',
        swatch: 'bg-teal-500',
        pill: 'border-teal-400/40 bg-teal-500/15 text-teal-800 dark:border-teal-400/30 dark:bg-teal-500/20 dark:text-teal-200'
    }
] as const;

export type IngredientGroupColorId =
    (typeof INGREDIENT_GROUP_COLORS)[number]['id'];

export function getIngredientGroupColor(colorId?: string | null) {
    return (
        INGREDIENT_GROUP_COLORS.find(color => color.id === colorId) ??
        INGREDIENT_GROUP_COLORS[0]
    );
}
