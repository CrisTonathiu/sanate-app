'use client';

import {useState, useMemo} from 'react';
import {useGetRecipes, Recipe} from '@/hooks/use-recipes';
import {
    MealType,
    mealTypeConfig,
    mealTypeLabel
} from '@/lib/config/meal-config';
import {MealSlot, MealIngredientPortion} from '@/lib/interface/meal-interface';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Search, UtensilsCrossed, Filter} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';

// Maps MealType (lowercase) to the DB MealType (uppercase) values
const MEAL_TYPE_MAP: Record<string, string[]> = {
    smoothie: ['SMOOTHIE'],
    breakfast: ['BREAKFAST'],
    snack1: ['SNACK1', 'SNACK', 'ANY'],
    snack2: ['SNACK2', 'SNACK', 'ANY'],
    lunch: ['LUNCH', 'ANY'],
    dinner: ['DINNER', 'ANY'],
    drinks: ['DRINKS', 'ANY']
};

function round1(v: number) {
    return Number(v.toFixed(1));
}

function computeNutrition(recipe: Recipe) {
    let calories = 0,
        protein = 0,
        carbs = 0,
        fat = 0;

    for (const item of recipe.ingredients) {
        const grams = item.grams ?? 100;
        const food = item.ingredient?.food;
        if (!food) continue;
        const ratio = grams / 100;
        protein += (food.proteinPer100g ?? 0) * ratio;
        carbs += (food.carbsPer100g ?? 0) * ratio;
        fat += (food.fatPer100g ?? 0) * ratio;
        const kcal =
            food.caloriesPer100g != null
                ? food.caloriesPer100g
                : (food.proteinPer100g ?? 0) * 4 +
                  (food.carbsPer100g ?? 0) * 4 +
                  (food.fatPer100g ?? 0) * 9;
        calories += kcal * ratio;
    }

    return {
        calories: Math.round(calories),
        protein: round1(protein),
        carbs: round1(carbs),
        fat: round1(fat)
    };
}

function recipeToMealSlot(recipe: Recipe, targetCalories?: number): MealSlot {
    const base = computeNutrition(recipe);
    const scale =
        base.calories > 0 && targetCalories
            ? Number((targetCalories / base.calories).toFixed(2))
            : 1;

    const ingredientPortions: MealIngredientPortion[] = recipe.ingredients.map(
        item => {
            const grams = item.grams ?? 0;
            const qty = item.quantity ?? (item.unit === 'PIECE' ? 1 : grams);
            const unit = item.unit ?? 'GRAM';
            return {
                ingredientName: item.ingredient?.name ?? '',
                baseQuantity: qty,
                targetQuantity:
                    unit === 'PIECE'
                        ? Math.max(1, Math.round(qty * scale))
                        : Math.round(qty * scale),
                baseGrams: grams,
                targetGrams: Math.round(grams * scale),
                unit
            };
        }
    );

    return {
        id: recipe.id,
        recipeName: recipe.title,
        imageUrl: recipe.imageUrl ?? undefined,
        calories: Math.round(base.calories * scale),
        protein: round1(base.protein * scale),
        carbs: round1(base.carbs * scale),
        fat: round1(base.fat * scale),
        portionMultiplier: scale,
        ingredientPortions
    };
}

interface RecipePickerModalProps {
    open: boolean;
    mealType: MealType;
    targetCalories?: number;
    onClose: () => void;
    onSelect: (meal: MealSlot) => void;
}

export default function RecipePickerModal({
    open,
    mealType,
    targetCalories,
    onClose,
    onSelect
}: RecipePickerModalProps) {
    const {data: allRecipes = [], isPending} = useGetRecipes();
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    const filtered = useMemo(() => {
        const allowed = MEAL_TYPE_MAP[mealType] ?? [];
        return allRecipes
            .filter(r => allowed.includes(r.mealType))
            .filter(
                r =>
                    search.trim() === '' ||
                    r.title.toLowerCase().includes(search.trim().toLowerCase())
            );
    }, [allRecipes, mealType, search]);

    function handleSelect(recipe: Recipe) {
        onSelect(recipeToMealSlot(recipe, targetCalories));
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={o => !o && onClose()}>
            <DialogContent className='max-w-2xl max-h-[80vh] overflow-hidden flex flex-col'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <UtensilsCrossed className='h-5 w-5 text-primary' />
                        Seleccionar receta
                        {mealType && (
                            <Badge
                                variant='secondary'
                                className='ml-2 capitalize'>
                                {mealType}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div className='flex gap-3 mt-4'>
                    <div className='relative mb-3 w-full'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                        <Input
                            placeholder='Buscar recetas...'
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className='pl-10'
                        />
                    </div>
                </div>

                <div className='flex-1 overflow-y-auto mt-4 pr-2'>
                    {isPending && (
                        <p className='col-span-3 text-sm text-muted-foreground text-center py-8'>
                            Cargando recetas…
                        </p>
                    )}
                    {!isPending && filtered.length === 0 && (
                        <p className='col-span-3 text-sm text-muted-foreground text-center py-8'>
                            No se encontraron recetas.
                        </p>
                    )}
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        {filtered.map(recipe => {
                            const nutrition = computeNutrition(recipe);
                            const config =
                                mealTypeConfig[recipe.mealType] ||
                                mealTypeConfig.SNACK;
                            const MealIcon = config.icon;
                            return (
                                <div
                                    key={recipe.id}
                                    className='group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all'>
                                    {/* Recipe Image */}
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
                                            {mealTypeLabel[recipe.mealType] ??
                                                recipe.mealType}
                                        </Badge>
                                    </div>

                                    {/* Recipe Info */}
                                    <div className='flex flex-col p-3'>
                                        <h4 className='text-sm font-semibold text-foreground'>
                                            {recipe.title}
                                        </h4>
                                        <div className='flex items-center justify-between mt-3'>
                                            {/* <div className='flex gap-2 text-xs text-muted-foreground'>
                                            <span>{recipe.calories} cal</span>
                                            <span className='text-muted-foreground/40'>
                                                |
                                            </span>
                                            <span>
                                                {recipe.protein}g protein
                                            </span>
                                        </div> */}
                                            <Button
                                                size='sm'
                                                onClick={() =>
                                                    handleSelect(recipe)
                                                }
                                                className='h-7 px-3 text-xs'>
                                                Seleccionar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
