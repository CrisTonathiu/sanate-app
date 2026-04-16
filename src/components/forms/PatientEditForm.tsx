'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {motion, AnimatePresence} from 'framer-motion';
import {
    ArrowLeft,
    Save,
    Loader2,
    User,
    Mail,
    Phone,
    Ruler,
    Weight,
    Cake,
    Check,
    Search,
    X,
    UtensilsCrossed
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import SectionHeading from '../widgets/SectionHeading';
import FormField from '../widgets/FormField';
import {PatientProfileDTO} from '@/lib/dto/PatientDTO';
import {
    useAddPatientFoodDislike,
    useDeletePatientFoodDislike,
    useGetPatientFoodDislikes,
    useUpdatePatient
} from '@/hooks/use-patients';
import {useGetFoods} from '@/hooks/use-foods';

const containerVariants = {
    hidden: {opacity: 0},
    visible: {
        opacity: 1,
        transition: {staggerChildren: 0.03, delayChildren: 0.05}
    }
};

const itemVariants = {
    hidden: {opacity: 0, y: 12},
    visible: {opacity: 1, y: 0, transition: {duration: 0.3, ease: 'easeOut'}}
} as const;

const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return '';

    // Parse date string directly to avoid timezone issues
    const dateParts = dateString.split(/[-T\s]/);
    if (dateParts.length < 3) return '';

    const year = dateParts[0];
    const month = dateParts[1].padStart(2, '0');
    const day = dateParts[2].padStart(2, '0');

    return `${year}-${month}-${day}`;
};

interface PatientEditFormProps {
    patientProfile: Partial<PatientProfileDTO>;
    onBack: () => void;
}

export function PatientEditForm({
    patientProfile,
    onBack
}: PatientEditFormProps) {
    const {register, watch, handleSubmit, formState} =
        useForm<PatientProfileDTO>({
            defaultValues: {
                ...patientProfile,
                birthDate: formatDateForInput(patientProfile.birthDate)
            } as PatientProfileDTO
        });

    const {mutateAsync: updatePatientProfile, isPending: isUpdating} =
        useUpdatePatient(patientProfile.id || '');
    const {data: allFoods = [], isPending: isLoadingFoods} = useGetFoods();
    const {data: foodDislikes = [], isPending: isLoadingFoodDislikes} =
        useGetPatientFoodDislikes(patientProfile.id);
    const {mutateAsync: addFoodDislike, isPending: isAddingFoodDislike} =
        useAddPatientFoodDislike(patientProfile.id || '');
    const {mutateAsync: deleteFoodDislike, isPending: isDeletingFoodDislike} =
        useDeletePatientFoodDislike(patientProfile.id || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [foodSearch, setFoodSearch] = useState('');

    const selectedFoodIds = new Set(foodDislikes.map(item => item.id));
    const filteredFoods = allFoods
        .filter(food => !selectedFoodIds.has(food.id))
        .filter(food =>
            food.name.toLowerCase().includes(foodSearch.trim().toLowerCase())
        )
        .slice(0, 8);

    const isMutatingFoodDislikes =
        isAddingFoodDislike || isDeletingFoodDislike || isSaving;

    const onSubmit = async (data: PatientProfileDTO) => {
        if (isUpdating) return;
        setIsSaving(true);
        try {
            await updatePatientProfile(data);
            setIsSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (error) {
            setIsSaving(false);
        }
    };

    const inputStyles =
        'h-10 rounded-xl border-border bg-secondary/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/50 transition-colors duration-200';

    const handleAddFoodDislike = async (foodId: string) => {
        if (!foodId || isMutatingFoodDislikes) return;

        await addFoodDislike({foodId});
        setFoodSearch('');
    };

    const handleRemoveFoodDislike = async (foodId?: string) => {
        if (!foodId || isMutatingFoodDislikes) return;

        await deleteFoodDislike(foodId);
    };

    return (
        <div className='relative min-h-screen bg-background'>
            <div
                className='absolute inset-0 opacity-[0.02]'
                style={{
                    backgroundImage:
                        'linear-gradient(hsl(0 0% 95%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 95%) 1px, transparent 1px)',
                    backgroundSize: '64px 64px'
                }}
            />

            <div className='relative mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8'>
                {/* Header */}
                <motion.div
                    initial={{opacity: 0, y: -10}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.4}}
                    className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex items-center gap-4'>
                        <Button
                            variant='outline'
                            size='icon'
                            onClick={onBack}
                            className='h-10 w-10 shrink-0 rounded-xl border-border bg-secondary/30 text-foreground hover:bg-secondary/60'>
                            <ArrowLeft className='h-4 w-4' />
                            <span className='sr-only'>
                                Volver al detalle del paciente
                            </span>
                        </Button>
                        <div className='flex flex-col gap-0.5'>
                            <h1 className='text-xl font-bold tracking-tight text-foreground sm:text-2xl'>
                                Editar Paciente
                            </h1>
                            <p className='text-sm text-muted-foreground'>
                                {patientProfile.firstName}{' '}
                                {patientProfile.lastName}
                            </p>
                        </div>
                    </div>

                    <div className='flex items-center gap-2'>
                        <Button
                            variant='outline'
                            onClick={onBack}
                            className='h-10 rounded-xl border-border bg-secondary/30 px-5 text-sm text-foreground hover:bg-secondary/60'>
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => handleSubmit(onSubmit)()}
                            disabled={isSaving}
                            className='h-10 rounded-xl bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)] px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-lg hover:shadow-[hsl(262,80%,60%)/0.25]'>
                            <AnimatePresence mode='wait'>
                                {isSaving ? (
                                    <motion.span
                                        key='saving'
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                        exit={{opacity: 0}}
                                        className='flex items-center gap-2'>
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                        Guardando...
                                    </motion.span>
                                ) : saved ? (
                                    <motion.span
                                        key='saved'
                                        initial={{opacity: 0, scale: 0.9}}
                                        animate={{opacity: 1, scale: 1}}
                                        exit={{opacity: 0}}
                                        className='flex items-center gap-2'>
                                        <Check className='h-4 w-4' />
                                        Guardado
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key='idle'
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                        exit={{opacity: 0}}
                                        className='flex items-center gap-2'>
                                        <Save className='h-4 w-4' />
                                        Guardar Cambios
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Button>
                    </div>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <motion.div
                        variants={containerVariants}
                        initial='hidden'
                        animate='visible'
                        className='flex flex-col gap-8'>
                        {/* Personal Info */}
                        <motion.div
                            variants={itemVariants}
                            className='rounded-2xl border border-border bg-card/50 p-6'>
                            <SectionHeading title='Información Personal' />
                            <div className='mt-5 flex flex-col gap-5'>
                                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                    <FormField
                                        label='Nombre'
                                        icon={<User className='h-3.5 w-3.5' />}>
                                        <Input
                                            placeholder='Nombre'
                                            {...register('firstName')}
                                            className={inputStyles}
                                            required
                                            disabled={isSaving}
                                        />
                                    </FormField>
                                    <FormField
                                        label='Apellido'
                                        icon={<User className='h-3.5 w-3.5' />}>
                                        <Input
                                            placeholder='Apellido'
                                            {...register('lastName')}
                                            className={inputStyles}
                                            required
                                            disabled={isSaving}
                                        />
                                    </FormField>
                                </div>

                                <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                                    <FormField
                                        label='Fecha de Nacimiento'
                                        icon={<Cake className='h-3.5 w-3.5' />}>
                                        <Input
                                            type='date'
                                            {...register('birthDate')}
                                            className={inputStyles}
                                            required
                                            disabled={isSaving}
                                        />
                                    </FormField>
                                    <FormField label='Género'>
                                        <Select
                                            value={watch('gender')}
                                            onValueChange={v => {
                                                const input =
                                                    document.querySelector(
                                                        '[name="gender"]'
                                                    ) as HTMLInputElement;
                                                if (input) input.value = v;
                                            }}
                                            disabled={isSaving}>
                                            <SelectTrigger
                                                className={`${inputStyles} rounded-xl`}>
                                                <SelectValue placeholder='Seleccionar' />
                                            </SelectTrigger>
                                            <SelectContent className='rounded-xl border-border bg-popover'>
                                                <SelectItem value='MALE'>
                                                    Masculino
                                                </SelectItem>
                                                <SelectItem value='FEMALE'>
                                                    Femenino
                                                </SelectItem>
                                                <SelectItem value='OTHER'>
                                                    Otro
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <input
                                            {...register('gender')}
                                            type='hidden'
                                        />
                                    </FormField>
                                </div>

                                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                    <FormField
                                        label='Peso (kg)'
                                        icon={
                                            <Weight className='h-3.5 w-3.5' />
                                        }>
                                        <Input
                                            type='number'
                                            placeholder='72'
                                            {...register('initialWeight', {
                                                valueAsNumber: true
                                            })}
                                            className={inputStyles}
                                            min={0}
                                            disabled={isSaving}
                                        />
                                    </FormField>
                                    <FormField
                                        label='Altura (cm)'
                                        icon={
                                            <Ruler className='h-3.5 w-3.5' />
                                        }>
                                        <Input
                                            type='number'
                                            placeholder='175'
                                            {...register('height', {
                                                valueAsNumber: true
                                            })}
                                            className={inputStyles}
                                            min={0}
                                            disabled={isSaving}
                                        />
                                    </FormField>
                                </div>
                            </div>
                        </motion.div>

                        {/* Contact Info */}
                        <motion.div
                            variants={itemVariants}
                            className='rounded-2xl border border-border bg-card/50 p-6'>
                            <SectionHeading title='Información de Contacto' />
                            <div className='mt-5 flex flex-col gap-5'>
                                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                    <FormField
                                        label='Correo Electrónico'
                                        icon={<Mail className='h-3.5 w-3.5' />}>
                                        <Input
                                            type='email'
                                            placeholder='paciente@email.com'
                                            {...register('email')}
                                            className={inputStyles}
                                            required
                                            disabled={isSaving}
                                        />
                                    </FormField>
                                    <FormField
                                        label='Número de Teléfono'
                                        icon={
                                            <Phone className='h-3.5 w-3.5' />
                                        }>
                                        <Input
                                            type='tel'
                                            placeholder='(302) 555-0107'
                                            {...register('phone')}
                                            className={inputStyles}
                                            required
                                            disabled={isSaving}
                                        />
                                    </FormField>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className='rounded-2xl border border-border bg-card/50 p-6'>
                            <SectionHeading
                                title='Alimentos que no desea'
                                subtitle='Preferencias del paciente distintas de alergias o restricciones médicas'
                            />

                            <div className='mt-5 flex flex-col gap-5'>
                                <div className='space-y-3'>
                                    <div className='relative'>
                                        <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50' />
                                        <Input
                                            value={foodSearch}
                                            onChange={event =>
                                                setFoodSearch(
                                                    event.target.value
                                                )
                                            }
                                            placeholder='Buscar alimento para excluir por preferencia'
                                            className={`${inputStyles} pl-9`}
                                            disabled={isMutatingFoodDislikes}
                                        />
                                    </div>

                                    <div className='rounded-xl border border-border bg-background/70 p-3'>
                                        <div className='mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                                            <UtensilsCrossed className='h-3.5 w-3.5' />
                                            Catálogo de alimentos
                                        </div>

                                        {isLoadingFoods ||
                                        isLoadingFoodDislikes ? (
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
                                                        onClick={() =>
                                                            handleAddFoodDislike(
                                                                food.id
                                                            )
                                                        }
                                                        disabled={
                                                            isMutatingFoodDislikes
                                                        }
                                                        className='h-9 rounded-lg border-border bg-secondary/20 px-3 text-sm text-foreground hover:bg-secondary/50'>
                                                        {food.name}
                                                    </Button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className='text-sm text-muted-foreground'>
                                                {foodSearch.trim()
                                                    ? 'No hay coincidencias disponibles.'
                                                    : 'Escribe para buscar alimentos del catálogo.'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className='space-y-3'>
                                    <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                                        <X className='h-3.5 w-3.5' />
                                        Alimentos no deseados
                                    </div>

                                    {foodDislikes.length > 0 ? (
                                        <div className='flex flex-wrap gap-2'>
                                            {foodDislikes.map(item => (
                                                <Badge
                                                    key={item.id}
                                                    variant='secondary'
                                                    className='flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm font-medium text-foreground'>
                                                    <span>{item.food}</span>
                                                    <button
                                                        type='button'
                                                        onClick={() =>
                                                            handleRemoveFoodDislike(
                                                                item.id
                                                            )
                                                        }
                                                        disabled={
                                                            isMutatingFoodDislikes
                                                        }
                                                        className='rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50'
                                                        aria-label={`Eliminar ${item.food}`}>
                                                        <X className='h-3.5 w-3.5' />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className='text-sm text-muted-foreground'>
                                            Aún no se han agregado alimentos
                                            rechazados por preferencia.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Medical Data */}
                        {/* <motion.div
                            variants={itemVariants}
                            className='rounded-2xl border border-border bg-card/50 p-6'>
                            <SectionHeading
                                title='Datos Médicos'
                                subtitle='Última actualización 12 Junio 2025'
                            />
                            <div className='mt-5 flex flex-col gap-5'>
                                <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                                    <FormField
                                        label='Presión Arterial (sistólica)'
                                        icon={
                                            <Activity className='h-3.5 w-3.5' />
                                        }>
                                        <div className='relative'>
                                            <Input
                                                type='number'
                                                placeholder='130'
                                                {...register(
                                                    'vital.bloodPressureSystolic',
                                                    {valueAsNumber: true}
                                                )}
                                                className={`${inputStyles} pr-12`}
                                                disabled={isSaving}
                                            />
                                            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50'>
                                                mm
                                            </span>
                                        </div>
                                    </FormField>
                                    <FormField
                                        label='Presión Arterial (diastólica)'
                                        icon={
                                            <Activity className='h-3.5 w-3.5' />
                                        }>
                                        <div className='relative'>
                                            <Input
                                                type='number'
                                                placeholder='80'
                                                {...register(
                                                    'vital.bloodPressureDiastolic',
                                                    {valueAsNumber: true}
                                                )}
                                                className={`${inputStyles} pr-12`}
                                                disabled={isSaving}
                                            />
                                            <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50'>
                                                HG
                                            </span>
                                        </div>
                                    </FormField>
                                    <FormField
                                        label='Frecuencia Cardíaca'
                                        icon={
                                            <Heart className='h-3.5 w-3.5' />
                                        }>
                                        <Input
                                            type='number'
                                            placeholder='70'
                                            {...register('vital.heartRate', {
                                                valueAsNumber: true
                                            })}
                                            className={inputStyles}
                                            disabled={isSaving}
                                        />
                                    </FormField>
                                </div>
                            </div>
                        </motion.div> */}

                        {/* Bottom save bar */}
                        <motion.div
                            variants={itemVariants}
                            className='sticky bottom-4 flex items-center justify-between rounded-2xl border border-border bg-card/80 p-4 backdrop-blur-xl'>
                            <p className='text-sm text-muted-foreground'>
                                Revisa los cambios antes de guardar
                            </p>
                            <div className='flex items-center gap-2'>
                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={onBack}
                                    disabled={isSaving}
                                    className='h-10 rounded-xl border-border bg-secondary/30 px-5 text-sm text-foreground hover:bg-secondary/60'>
                                    Descartar
                                </Button>
                                <Button
                                    type='submit'
                                    disabled={isSaving}
                                    className='h-10 rounded-xl bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)] px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-lg hover:shadow-[hsl(262,80%,60%)/0.25]'>
                                    <AnimatePresence mode='wait'>
                                        {isSaving ? (
                                            <motion.span
                                                key='saving'
                                                initial={{opacity: 0}}
                                                animate={{opacity: 1}}
                                                exit={{opacity: 0}}
                                                className='flex items-center gap-2'>
                                                <Loader2 className='h-4 w-4 animate-spin' />
                                                Guardando...
                                            </motion.span>
                                        ) : saved ? (
                                            <motion.span
                                                key='saved'
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9
                                                }}
                                                animate={{opacity: 1, scale: 1}}
                                                exit={{opacity: 0}}
                                                className='flex items-center gap-2'>
                                                <Check className='h-4 w-4' />
                                                Guardado
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key='idle'
                                                initial={{opacity: 0}}
                                                animate={{opacity: 1}}
                                                exit={{opacity: 0}}
                                                className='flex items-center gap-2'>
                                                <Save className='h-4 w-4' />
                                                Guardar Cambios
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                </form>
            </div>
        </div>
    );
}
