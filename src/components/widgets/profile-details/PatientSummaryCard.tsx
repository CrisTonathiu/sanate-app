'use client';

import {Button} from '@/components/ui/button';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {
    useAddPatientFoodDislike,
    useDeletePatientFoodDislike
} from '@/hooks/use-patients';
import {useGetFoods} from '@/hooks/use-foods';
import {
    PatientAllergyDTO,
    PatientConditionDTO,
    PatientFoodDislikeDTO
} from '@/lib/dto/PatientDTO';
import {AnimatePresence, motion} from 'framer-motion';
import {useEffect, useState} from 'react';
import {
    AlertTriangle,
    Loader2,
    Plus,
    Ruler,
    Scale,
    Search,
    Stethoscope,
    User,
    UtensilsCrossed,
    X
} from 'lucide-react';

interface PatientSummaryCardProps {
    patientId: string;
    name: string;
    age: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    height: number;
    weight: number;
    allergies: PatientAllergyDTO[];
    conditions: PatientConditionDTO[];
    foodDislikes: any[];
}

function getGenderLabel(gender: PatientSummaryCardProps['gender']): string {
    const labels = {
        MALE: 'Masculino',
        FEMALE: 'Femenino',
        OTHER: 'Otro'
    } as const;

    return labels[gender];
}

export default function PatientSummaryCard({
    patientId,
    name,
    age,
    gender,
    height,
    weight,
    allergies,
    conditions,
    foodDislikes
}: PatientSummaryCardProps) {
    const genderLabel = getGenderLabel(gender);
    const {data: allFoods = [], isPending: isLoadingFoods} = useGetFoods();
    const {mutateAsync: addFoodDislike, isPending: isAddingFoodDislike} =
        useAddPatientFoodDislike(patientId);
    const {mutateAsync: deleteFoodDislike, isPending: isDeletingFoodDislike} =
        useDeletePatientFoodDislike(patientId);
    const [foodSearch, setFoodSearch] = useState('');
    const [foodDislikeError, setFoodDislikeError] = useState<string | null>(
        null
    );
    const [showFoodDropdown, setShowFoodDropdown] = useState<boolean>(false);

    const isMutatingFoodDislikes = isAddingFoodDislike || isDeletingFoodDislike;
    const normalizedSearch = foodSearch.trim().toLowerCase();
    const selectedFoodIds = new Set(
        foodDislikes
            .map(item => item.id)
            .filter((id): id is string => Boolean(id))
    );
    const filteredFoods = allFoods
        .filter(food => !selectedFoodIds.has(food.id))
        .filter(food => food.name.toLowerCase().includes(normalizedSearch))
        .slice(0, 8);

    const handleAddFoodDislike = async (food: any) => {
        console.log('Adding food dislike:', food);
        if (!food || isMutatingFoodDislikes) return;
        const foodId = food.id;
        try {
            setFoodDislikeError(null);
            await addFoodDislike({foodId});
            setFoodSearch('');
        } catch (error) {
            setFoodDislikeError(
                error instanceof Error
                    ? error.message
                    : 'No se pudo agregar el alimento.'
            );
        }
    };

    const handleRemoveFoodDislike = async (foodId: string) => {
        if (!foodId || isMutatingFoodDislikes) return;
        try {
            setFoodDislikeError(null);
            await deleteFoodDislike(foodId);
        } catch (error) {
            setFoodDislikeError(
                error instanceof Error
                    ? error.message
                    : 'No se pudo eliminar el alimento.'
            );
        }
    };

    useEffect(() => {
        console.log('Updated food dislikes:', foodDislikes);
    }, [foodDislikes]);

    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            className='rounded-2xl border border-border bg-card p-6'>
            <div className='flex items-start gap-4 mb-6'>
                <Avatar className='h-14 w-14 border-2 border-border'>
                    <AvatarFallback className='bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)] text-primary-foreground hover:shadow-lg hover:shadow-[hsl(262,80%,60%)/0.25] text-lg font-semibold text-primary-foreground'>
                        {name
                            .split(' ')
                            .map(part => part[0])
                            .join('')
                            .toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                    <h2 className='text-xl font-bold text-foreground'>
                        {name}
                    </h2>
                    <div className='flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground'>
                        <span className='flex items-center gap-1.5'>
                            <User className='h-4 w-4' />
                            {age} años, {genderLabel}
                        </span>
                        <span className='flex items-center gap-1.5'>
                            <Ruler className='h-4 w-4' />
                            {height}
                        </span>
                        <span className='flex items-center gap-1.5'>
                            <Scale className='h-4 w-4' />
                            {weight}
                        </span>
                    </div>
                </div>
            </div>

            <div className='space-y-4'>
                {/* Allergies Section */}
                <div>
                    <span className='flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2'>
                        <AlertTriangle className='h-3.5 w-3.5' />
                        Alergias
                    </span>
                    <div className='flex flex-wrap gap-2'>
                        {allergies.length > 0 ? (
                            allergies.map(allergy => (
                                <Badge
                                    key={allergy.id}
                                    variant='destructive'
                                    className='rounded-lg'>
                                    {allergy.allergen}
                                </Badge>
                            ))
                        ) : (
                            <span className='text-sm text-muted-foreground'>
                                Sin alergias registradas
                            </span>
                        )}
                    </div>
                </div>

                {/* Condiciones Clínicas */}
                <div>
                    <span className='flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2'>
                        <Stethoscope className='h-3.5 w-3.5' />
                        Condiciones Clínicas
                    </span>
                    <div className='flex flex-wrap gap-2'>
                        {conditions.length > 0 ? (
                            conditions.map(condition => (
                                <Badge
                                    key={condition.id}
                                    variant='secondary'
                                    className='rounded-lg'>
                                    {condition.name}
                                </Badge>
                            ))
                        ) : (
                            <span className='text-sm text-muted-foreground'>
                                Sin condiciones registradas
                            </span>
                        )}
                    </div>
                </div>

                {/* Alimentos que no desea */}
                <div>
                    <span className='flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2'>
                        <UtensilsCrossed className='h-3.5 w-3.5' />
                        Alimentos que no desea
                    </span>

                    {/* Search Input */}
                    <div className='relative space-y-3 mb-3'>
                        <div className='relative'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                            <Input
                                placeholder='Buscar alimento...'
                                value={foodSearch}
                                onChange={event => {
                                    setFoodSearch(event.target.value);
                                    setShowFoodDropdown(true);
                                    if (foodDislikeError) {
                                        setFoodDislikeError(null);
                                    }
                                }}
                                onFocus={() => setShowFoodDropdown(true)}
                                className='pl-9 h-9 bg-background'
                                disabled={isMutatingFoodDislikes}
                            />
                        </div>

                        {/* Dropdown */}
                        <AnimatePresence>
                            {showFoodDropdown &&
                                foodSearch &&
                                filteredFoods.length > 0 && (
                                    <motion.div
                                        initial={{opacity: 0, y: -4}}
                                        animate={{opacity: 1, y: 0}}
                                        exit={{opacity: 0, y: -4}}
                                        className='absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto'>
                                        {filteredFoods
                                            .slice(0, 6)
                                            .map((food: any) => (
                                                <button
                                                    key={food.id}
                                                    onClick={() =>
                                                        handleAddFoodDislike(
                                                            food
                                                        )
                                                    }
                                                    className='w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-2'>
                                                    <Plus className='h-3.5 w-3.5 text-muted-foreground' />
                                                    {food.name}
                                                </button>
                                            ))}
                                    </motion.div>
                                )}
                        </AnimatePresence>
                    </div>

                    {/* Tags */}
                    <div className='flex flex-wrap gap-2'>
                        {foodDislikes.map(
                            ({id, food}: {id: string; food: string}) => (
                                <Badge
                                    key={id}
                                    variant='outline'
                                    className='rounded-lg border-muted-foreground/30 text-muted-foreground pr-1.5 flex items-center gap-1'>
                                    {food}
                                    <button
                                        onClick={() =>
                                            handleRemoveFoodDislike(id)
                                        }
                                        className='ml-1 p-0.5 rounded hover:bg-secondary transition-colors'>
                                        <X className='h-3 w-3' />
                                    </button>
                                </Badge>
                            )
                        )}
                        {foodDislikes.length === 0 && (
                            <span className='text-sm text-muted-foreground'>
                                Sin alimentos registrados
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
