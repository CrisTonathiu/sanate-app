'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {IngredientGroupPill} from '@/components/widgets/food/IngredientGroupPill';
import {useGetFoods} from '@/hooks/use-foods';
import {INGREDIENT_GROUP_COLORS} from '@/lib/ingredient-group-colors';
import {cn} from '@/lib/utils';
import {AnimatePresence, motion} from 'framer-motion';
import {Loader2, Save, Search, Trash2, X} from 'lucide-react';
import {FormEvent, useEffect, useMemo, useState} from 'react';

export type IngredientGroupFormData = {
    name: string;
    color: string;
    foodIds: string[];
};

type IngredientGroupFormProps = {
    mode?: 'create' | 'edit';
    initialData?: IngredientGroupFormData | null;
    isLoading?: boolean;
    onSave: (data: IngredientGroupFormData) => Promise<void>;
    onCancel: () => void;
    onDelete?: () => Promise<void>;
};

export function IngredientGroupForm({
    mode = 'create',
    initialData,
    isLoading = false,
    onSave,
    onCancel,
    onDelete
}: IngredientGroupFormProps) {
    const {data: foods = [], isPending: isLoadingFoods} = useGetFoods();
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [color, setColor] = useState<string>(INGREDIENT_GROUP_COLORS[0].id);
    const [foodIds, setFoodIds] = useState<string[]>([]);
    const [foodSearch, setFoodSearch] = useState('');

    useEffect(() => {
        if (!initialData) return;

        setName(initialData.name);
        setColor(initialData.color || INGREDIENT_GROUP_COLORS[0].id);
        setFoodIds(initialData.foodIds);
    }, [initialData]);

    const selectedFoods = useMemo(
        () => foods.filter(food => foodIds.includes(food.id)),
        [foods, foodIds]
    );

    const selectedFoodIdSet = useMemo(() => new Set(foodIds), [foodIds]);

    const filteredFoods = useMemo(() => {
        const query = foodSearch.trim().toLowerCase();
        return foods
            .filter(food => !selectedFoodIdSet.has(food.id))
            .filter(food =>
                query ? food.name.toLowerCase().includes(query) : true
            )
            .slice(0, 8);
    }, [foods, foodSearch, selectedFoodIdSet]);

    const handleAddFood = (foodId: string) => {
        setFoodIds(prev => (prev.includes(foodId) ? prev : [...prev, foodId]));
        setFoodSearch('');
    };

    const handleRemoveFood = (foodId: string) => {
        setFoodIds(prev => prev.filter(id => id !== foodId));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('El nombre es obligatorio');
            return;
        }

        if (foodIds.length === 0) {
            setError('Agrega al menos un alimento al grupo');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({
                name: name.trim(),
                color,
                foodIds
            });
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Error al guardar el grupo'
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;

        setIsDeleting(true);
        setError(null);
        try {
            await onDelete();
            setShowDeleteDialog(false);
        } catch (deleteError) {
            setError(
                deleteError instanceof Error
                    ? deleteError.message
                    : 'Error al eliminar el grupo'
            );
            setShowDeleteDialog(false);
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className='flex items-center justify-center py-24 text-muted-foreground'>
                <Loader2 className='h-6 w-6 animate-spin mr-2' />
                Cargando grupo...
            </div>
        );
    }

    return (
        <>
            <form onSubmit={handleSubmit} className='space-y-6'>
                <Card className='border-border bg-card/50 backdrop-blur-sm'>
                    <CardHeader className='pb-3 border-b border-border'>
                        <CardTitle className='text-base'>
                            Información del grupo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-5 space-y-5'>
                        <div>
                            <Label className='text-xs text-muted-foreground mb-1.5 block'>
                                Nombre
                            </Label>
                            <Input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder='ej. Huevos, Lácteos, Frutos secos'
                                className='h-10 bg-background/50'
                            />
                        </div>

                        <div>
                            <Label className='text-xs text-muted-foreground mb-1.5 block'>
                                Color
                            </Label>
                            <div className='flex flex-wrap gap-2'>
                                {INGREDIENT_GROUP_COLORS.map(option => {
                                    const selected = color === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            type='button'
                                            onClick={() => setColor(option.id)}
                                            title={option.label}
                                            aria-label={option.label}
                                            className={cn(
                                                'flex h-9 w-9 items-center justify-center rounded-full border transition-all',
                                                selected
                                                    ? 'border-foreground ring-2 ring-foreground/20'
                                                    : 'border-border hover:border-foreground/40'
                                            )}>
                                            <span
                                                className={cn(
                                                    'h-5 w-5 rounded-full',
                                                    option.swatch
                                                )}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                            <div className='mt-3'>
                                <IngredientGroupPill
                                    name={name.trim() || 'Vista previa'}
                                    color={color}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className='border-border bg-card/50 backdrop-blur-sm'>
                    <CardHeader className='pb-3 border-b border-border'>
                        <CardTitle className='text-base'>
                            Alimentos del grupo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-5 space-y-4'>
                        <div className='relative'>
                            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50' />
                            <Input
                                value={foodSearch}
                                onChange={e => setFoodSearch(e.target.value)}
                                placeholder='Buscar alimento del catálogo'
                                className='h-10 pl-9 bg-background/50'
                                disabled={isLoadingFoods}
                            />
                        </div>

                        {isLoadingFoods ? (
                            <p className='text-sm text-muted-foreground'>
                                Cargando alimentos...
                            </p>
                        ) : filteredFoods.length > 0 ? (
                            <div className='flex flex-wrap gap-2'>
                                {filteredFoods.map(food => (
                                    <Button
                                        key={food.id}
                                        type='button'
                                        variant='outline'
                                        onClick={() => handleAddFood(food.id)}
                                        className='h-9 rounded-lg border-border bg-secondary/20 px-3 text-sm'>
                                        {food.name}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <p className='text-sm text-muted-foreground'>
                                {foodSearch.trim()
                                    ? 'No hay coincidencias disponibles.'
                                    : 'Todos los alimentos del catálogo ya están en el grupo.'}
                            </p>
                        )}

                        <div className='space-y-2'>
                            <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                                {selectedFoods.length} alimento
                                {selectedFoods.length === 1 ? '' : 's'} en el
                                grupo
                            </p>
                            {selectedFoods.length > 0 ? (
                                <div className='flex flex-wrap gap-2'>
                                    <AnimatePresence>
                                        {selectedFoods.map(food => (
                                            <motion.span
                                                key={food.id}
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.95
                                                }}
                                                animate={{opacity: 1, scale: 1}}
                                                className='inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm font-medium'>
                                                {food.name}
                                                <button
                                                    type='button'
                                                    onClick={() =>
                                                        handleRemoveFood(
                                                            food.id
                                                        )
                                                    }
                                                    className='rounded-full text-muted-foreground transition-colors hover:text-foreground'
                                                    aria-label={`Quitar ${food.name}`}>
                                                    <X className='h-3.5 w-3.5' />
                                                </button>
                                            </motion.span>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <p className='text-sm text-muted-foreground'>
                                    Aún no hay alimentos en este grupo.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {error ? (
                    <p className='text-sm text-destructive'>{error}</p>
                ) : null}

                <div className='flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3'>
                    <div>
                        {mode === 'edit' && onDelete ? (
                            <Button
                                type='button'
                                variant='outline'
                                onClick={() => setShowDeleteDialog(true)}
                                disabled={isSaving || isDeleting}
                                className='text-destructive hover:text-destructive'>
                                <Trash2 className='h-4 w-4 mr-2' />
                                Eliminar grupo
                            </Button>
                        ) : (
                            <Button
                                type='button'
                                variant='ghost'
                                onClick={onCancel}
                                disabled={isSaving}>
                                Cancelar
                            </Button>
                        )}
                    </div>
                    <Button
                        type='submit'
                        disabled={isSaving || isDeleting}
                        className='h-11 px-5 rounded-xl font-medium shadow-lg shadow-primary/25'>
                        {isSaving ? (
                            <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                        ) : (
                            <Save className='h-4 w-4 mr-2' />
                        )}
                        {mode === 'edit' ? 'Guardar cambios' : 'Crear grupo'}
                    </Button>
                </div>
            </form>

            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar grupo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará el grupo y se quitará de las
                            preferencias de los pacientes que lo tengan
                            seleccionado. Los alimentos del catálogo no se
                            eliminan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className='bg-destructive text-white hover:bg-destructive/90'>
                            {isDeleting ? (
                                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                            ) : null}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
