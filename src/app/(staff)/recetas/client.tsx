'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {EmptyStateRecipeList} from '@/components/widgets/recipe/EmptyStateRecipeList';
import {RecipeCard} from '@/components/widgets/recipe/RecipeCard';
import {useGetRecipes} from '@/hooks/use-recipes';
import {cn} from '@/lib/utils';
import {AnimatePresence, motion} from 'framer-motion';
import {
    Apple,
    Coffee,
    Filter,
    GlassWater,
    LayoutGrid,
    Moon,
    Plus,
    Search,
    Sun
} from 'lucide-react';
import Link from 'next/link';
import {useState} from 'react';

const MEAL_TYPE_FILTERS = [
    {value: 'all', label: 'Todas', icon: LayoutGrid},
    {value: 'SMOOTHIE', label: 'Licuado', icon: GlassWater},
    {value: 'BREAKFAST', label: 'Desayuno', icon: Coffee},
    {value: 'SNACK', label: 'Colación', icon: Apple},
    {value: 'LUNCH', label: 'Comida', icon: Sun},
    {value: 'DINNER', label: 'Cena', icon: Moon},
    {value: 'DRINKS', label: 'Bebida', icon: GlassWater}
];

export default function ClientPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const {data: recipes = [], isPending} = useGetRecipes();

    // Filter recipes
    const filteredRecipes = recipes.filter(recipe => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            recipe.title.toLowerCase().includes(q) ||
            recipe.steps.some(step =>
                step.instruction.toLowerCase().includes(q)
            ) ||
            recipe.ingredients.some(item =>
                (item.ingredient?.food?.name || item.ingredient?.name || '')
                    .toLowerCase()
                    .includes(q)
            );
        const matchesFilter =
            activeFilter === 'all' || recipe.mealType === activeFilter;
        return matchesSearch && matchesFilter;
    });
    return (
        <div className='relative w-full md:w-auto mt-3 md:mt-0'>
            {/* Header */}
            <motion.div
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className='mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                            Mis Recetas
                        </h1>
                    </div>
                    <Button
                        asChild
                        className='h-11 px-5 rounded-xl font-medium shadow-lg shadow-primary/25'>
                        <Link href='/recetas/nuevo'>
                            <Plus className='h-4 w-4 mr-2' />
                            Crear nueva receta
                        </Link>
                    </Button>
                </div>
            </motion.div>

            {/* Search and Filters */}
            <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.1}}
                className='mb-8 space-y-4'>
                {/* Search */}
                <div className='relative max-w-md'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder='Buscar recetas...'
                        className='h-11 pl-10 bg-card/50 border-border rounded-xl'
                    />
                </div>

                {/* Filter Pills */}
                <div className='flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide'>
                    <div className='flex items-center gap-1 text-sm text-muted-foreground mr-2'>
                        <Filter className='h-4 w-4' />
                        <span className='hidden sm:inline'>Filtrar:</span>
                    </div>
                    {MEAL_TYPE_FILTERS.map(filter => {
                        const isActive = activeFilter === filter.value;
                        return (
                            <button
                                key={filter.value}
                                onClick={() => setActiveFilter(filter.value)}
                                className={cn(
                                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border'
                                )}>
                                <filter.icon className='h-3.5 w-3.5' />
                                {filter.label}
                            </button>
                        );
                    })}
                </div>

                {/* Results count */}
                <div className='flex items-center justify-between'>
                    <p className='text-sm text-muted-foreground'>
                        {isPending ? 'Cargando recetas...' : 'Mostrando'}{' '}
                        <span className='font-medium text-foreground'>
                            {filteredRecipes.length}
                        </span>{' '}
                        recetas
                    </p>
                </div>

                {/* Recipe Grid */}
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.2}}
                    className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                    <AnimatePresence mode='popLayout'>
                        {filteredRecipes.length > 0 ? (
                            filteredRecipes.map(recipe => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={{
                                        id: recipe.id,
                                        title: recipe.title,
                                        mealType: recipe.mealType,
                                        calories: 0,
                                        protein: 0,
                                        carbs: 0,
                                        fats: 0,
                                        prepTime: recipe.steps.length,
                                        imageUrl: recipe.imageUrl
                                    }}
                                />
                            ))
                        ) : (
                            <EmptyStateRecipeList />
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </div>
    );
}
