'use client';

import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import {PatientAllergyDTO, PatientConditionDTO} from '@/lib/dto/PatientDTO';
import {motion} from 'framer-motion';
import {AlertTriangle, Ruler, Scale, Stethoscope, User} from 'lucide-react';

interface PatientSummaryCardProps {
    name: string;
    age: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    height: number;
    weight: number;
    allergies: PatientAllergyDTO[];
    conditions: PatientConditionDTO[];
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
    name,
    age,
    gender,
    height,
    weight,
    allergies,
    conditions
}: PatientSummaryCardProps) {
    const genderLabel = getGenderLabel(gender);

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
                <div>
                    <span className='flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2'>
                        <AlertTriangle className='h-3.5 w-3.5' />
                        Alergias
                    </span>
                    <div className='flex flex-wrap gap-2'>
                        {allergies.map(allergy => (
                            <Badge
                                key={allergy.id}
                                variant='destructive'
                                className='rounded-lg'>
                                {allergy.allergen}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div>
                    <span className='flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2'>
                        <Stethoscope className='h-3.5 w-3.5' />
                        Condiciones Clínicas
                    </span>
                    <div className='flex flex-wrap gap-2'>
                        {conditions.map(condition => (
                            <Badge
                                key={condition.id}
                                variant='secondary'
                                className='rounded-lg'>
                                {condition.name}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
