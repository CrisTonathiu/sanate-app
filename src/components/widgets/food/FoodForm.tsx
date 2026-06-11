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
import {FoodGroup, useGetFoodGroups} from '@/hooks/use-foods';
import {AnimatePresence, motion} from 'framer-motion';
import {Loader2, Save, Trash2} from 'lucide-react';
import {FormEvent, useEffect, useMemo, useState} from 'react';

export type FoodFormData = {
    name: string;
    groupId: string;
    caloriesPer100g?: number | null;
    proteinPer100g?: number | null;
    carbsPer100g?: number | null;
    fatPer100g?: number | null;
    density?: number | null;
    isDiscrete?: boolean;
    maxPortionGrams?: number | null;
};

type FoodFormProps = {
    mode?: 'create' | 'edit';
    initialData?: FoodFormData | null;
    isLoading?: boolean;
    onSave: (data: FoodFormData) => Promise<void>;
    onCancel: () => void;
    onDelete?: () => Promise<void>;
};

function parseOptionalNumber(value: string): number | null | undefined {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
}

function formatNumberField(value?: number | null) {
    if (value == null) return '';
    return String(value);
}

export function FoodForm({
    mode = 'create',
    initialData,
    isLoading = false,
    onSave,
    onCancel,
    onDelete
}: FoodFormProps) {
    const {data: groups = [], isPending: isLoadingGroups} = useGetFoodGroups();
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [groupId, setGroupId] = useState('');
    const [groupQuery, setGroupQuery] = useState('');
    const [showGroupSuggestions, setShowGroupSuggestions] = useState(false);
    const [caloriesPer100g, setCaloriesPer100g] = useState('');
    const [proteinPer100g, setProteinPer100g] = useState('');
    const [carbsPer100g, setCarbsPer100g] = useState('');
    const [fatPer100g, setFatPer100g] = useState('');
    const [density, setDensity] = useState('');
    const [maxPortionGrams, setMaxPortionGrams] = useState('');
    const [isDiscrete, setIsDiscrete] = useState(false);

    useEffect(() => {
        if (!initialData) return;

        setName(initialData.name);
        setGroupId(initialData.groupId);
        setCaloriesPer100g(formatNumberField(initialData.caloriesPer100g));
        setProteinPer100g(formatNumberField(initialData.proteinPer100g));
        setCarbsPer100g(formatNumberField(initialData.carbsPer100g));
        setFatPer100g(formatNumberField(initialData.fatPer100g));
        setDensity(formatNumberField(initialData.density));
        setMaxPortionGrams(formatNumberField(initialData.maxPortionGrams));
        setIsDiscrete(initialData.isDiscrete ?? false);
    }, [initialData]);

    useEffect(() => {
        if (!initialData?.groupId || groups.length === 0) return;

        const matchedGroup = groups.find(
            group => group.id === initialData.groupId
        );
        if (matchedGroup) {
            setGroupQuery(matchedGroup.name);
        }
    }, [initialData?.groupId, groups]);

    const groupSuggestions = useMemo(() => {
        const query = groupQuery.trim().toLowerCase();
        if (!query) return groups;

        return groups.filter(group =>
            group.name.toLowerCase().includes(query)
        );
    }, [groupQuery, groups]);

    const handleGroupQueryChange = (value: string) => {
        setGroupQuery(value);

        const exactMatch = groups.find(
            group => group.name.toLowerCase() === value.trim().toLowerCase()
        );
        setGroupId(exactMatch?.id ?? '');
    };

    const selectGroup = (group: FoodGroup) => {
        setGroupQuery(group.name);
        setGroupId(group.id);
        setShowGroupSuggestions(false);
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('El nombre es obligatorio');
            return;
        }

        if (!groupId) {
            setError('Selecciona un grupo');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({
                name: name.trim(),
                groupId,
                caloriesPer100g: parseOptionalNumber(caloriesPer100g),
                proteinPer100g: parseOptionalNumber(proteinPer100g),
                carbsPer100g: parseOptionalNumber(carbsPer100g),
                fatPer100g: parseOptionalNumber(fatPer100g),
                density: parseOptionalNumber(density),
                maxPortionGrams: parseOptionalNumber(maxPortionGrams),
                isDiscrete
            });
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Error al guardar el alimento'
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
                    : 'Error al eliminar el alimento'
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
                Cargando alimento...
            </div>
        );
    }

    return (
        <>
            <form onSubmit={handleSubmit} className='space-y-6'>
                <Card
                    className={`border-border bg-card/50 backdrop-blur-sm${showGroupSuggestions ? ' relative z-20' : ''}`}>
                    <CardHeader className='pb-3 border-b border-border'>
                        <CardTitle className='text-base'>
                            Información general
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='sm:col-span-2'>
                            <Label className='text-xs text-muted-foreground mb-1.5 block'>
                                Nombre
                            </Label>
                            <Input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder='ej. Palomitas de maíz (microondas)'
                                className='h-10 bg-background/50'
                            />
                        </div>

                        <div className='sm:col-span-2 relative'>
                            <Label className='text-xs text-muted-foreground mb-1.5 block'>
                                Grupo
                            </Label>
                            <Input
                                value={groupQuery}
                                onChange={e =>
                                    handleGroupQueryChange(e.target.value)
                                }
                                onFocus={() => setShowGroupSuggestions(true)}
                                onBlur={() =>
                                    setTimeout(
                                        () => setShowGroupSuggestions(false),
                                        150
                                    )
                                }
                                disabled={isLoadingGroups}
                                placeholder={
                                    isLoadingGroups
                                        ? 'Cargando grupos...'
                                        : 'ej. Cereales, Proteínas...'
                                }
                                className='h-10 bg-background/50'
                            />
                            <AnimatePresence>
                                {showGroupSuggestions &&
                                    groupSuggestions.length > 0 && (
                                        <motion.div
                                            initial={{opacity: 0, y: -5}}
                                            animate={{opacity: 1, y: 0}}
                                            exit={{opacity: 0, y: -5}}
                                            className='absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto'>
                                            {groupSuggestions
                                                .slice(0, 8)
                                                .map(group => (
                                                    <button
                                                        key={group.id}
                                                        type='button'
                                                        onMouseDown={() =>
                                                            selectGroup(group)
                                                        }
                                                        className='w-full px-3 py-2 text-left text-sm hover:bg-secondary/50 transition-colors'>
                                                        {group.name}
                                                    </button>
                                                ))}
                                        </motion.div>
                                    )}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>

                <Card className='border-border bg-card/50 backdrop-blur-sm'>
                    <CardHeader className='pb-3 border-b border-border'>
                        <CardTitle className='text-base'>
                            Nutrición por 100 g
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div>
                            <Label className='text-xs text-muted-foreground mb-1.5 block'>
                                Calorías (kcal)
                            </Label>
                            <Input
                                type='text'
                                inputMode='decimal'
                                value={caloriesPer100g}
                                onChange={e =>
                                    setCaloriesPer100g(e.target.value)
                                }
                                placeholder='541'
                                className='h-10 bg-background/50'
                            />
                        </div>
                        <div>
                            <Label className='text-xs text-muted-foreground mb-1.5 block'>
                                Proteína (g)
                            </Label>
                            <Input
                                type='text'
                                inputMode='decimal'
                                value={proteinPer100g}
                                onChange={e => setProteinPer100g(e.target.value)}
                                placeholder='13'
                                className='h-10 bg-background/50'
                            />
                        </div>
                        <div>
                            <Label className='text-xs text-muted-foreground mb-1.5 block'>
                                Carbohidratos (g)
                            </Label>
                            <Input
                                type='text'
                                inputMode='decimal'
                                value={carbsPer100g}
                                onChange={e => setCarbsPer100g(e.target.value)}
                                placeholder='78'
                                className='h-10 bg-background/50'
                            />
                        </div>
                        <div>
                            <Label className='text-xs text-muted-foreground mb-1.5 block'>
                                Grasa (g)
                            </Label>
                            <Input
                                type='text'
                                inputMode='decimal'
                                value={fatPer100g}
                                onChange={e => setFatPer100g(e.target.value)}
                                placeholder='4.5'
                                className='h-10 bg-background/50'
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className='border-border bg-card/50 backdrop-blur-sm'>
                    <CardHeader className='pb-3 border-b border-border'>
                        <CardTitle className='text-base'>
                            Medidas y porciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div>
                            <Label className='text-xs text-muted-foreground mb-1.5 block'>
                                Densidad (g/ml)
                            </Label>
                            <Input
                                type='text'
                                inputMode='decimal'
                                value={density}
                                onChange={e => setDensity(e.target.value)}
                                placeholder='0.046'
                                className='h-10 bg-background/50'
                            />
                            <p className='text-xs text-muted-foreground mt-1.5'>
                                Para taza, ml, cda y cdita. Ej: palomitas ≈
                                0.046 (11 g / taza). Vacío = agua (1 g/ml).
                            </p>
                        </div>
                        <div>
                            <Label className='text-xs text-muted-foreground mb-1.5 block'>
                                Porción máxima (g)
                            </Label>
                            <Input
                                type='text'
                                inputMode='decimal'
                                value={maxPortionGrams}
                                onChange={e =>
                                    setMaxPortionGrams(e.target.value)
                                }
                                placeholder='200'
                                className='h-10 bg-background/50'
                            />
                        </div>
                        <div className='sm:col-span-2 flex items-center gap-2'>
                            <input
                                id='isDiscrete'
                                type='checkbox'
                                checked={isDiscrete}
                                onChange={e => setIsDiscrete(e.target.checked)}
                                className='h-4 w-4 rounded border-border'
                            />
                            <Label htmlFor='isDiscrete' className='text-sm'>
                                Porción discreta (piezas, unidades)
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <p className='text-sm text-destructive rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3'>
                        {error}
                    </p>
                )}

                <div className='flex flex-col-reverse sm:flex-row sm:justify-between gap-3'>
                    {mode === 'edit' && onDelete ? (
                        <Button
                            type='button'
                            variant='destructive'
                            onClick={() => setShowDeleteDialog(true)}
                            disabled={isSaving || isDeleting}>
                            {isDeleting ? (
                                <>
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                    Eliminando...
                                </>
                            ) : (
                                <>
                                    <Trash2 className='h-4 w-4 mr-2' />
                                    Eliminar
                                </>
                            )}
                        </Button>
                    ) : (
                        <div />
                    )}

                    <div className='flex flex-col-reverse sm:flex-row gap-3'>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={onCancel}
                            disabled={isSaving || isDeleting}>
                            Cancelar
                        </Button>
                        <Button
                            type='submit'
                            disabled={
                                isSaving || isDeleting || isLoadingGroups
                            }>
                            {isSaving ? (
                                <>
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className='h-4 w-4 mr-2' />
                                    {mode === 'edit'
                                        ? 'Guardar cambios'
                                        : 'Guardar alimento'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>

            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar alimento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Solo se puede
                            eliminar si el alimento no está vinculado a
                            recetas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={event => {
                                event.preventDefault();
                                void handleDelete();
                            }}
                            disabled={isDeleting}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
