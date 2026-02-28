'use client';

import {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {UserPlus, Loader2, Ruler, Weight, Cake} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {Separator} from '@/components/ui/separator';
import {useCreatePatient} from '@/hooks/use-patients';

interface NewPatientForm {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    weight: number;
    height: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    birthday: string;
}

const INITIAL_FORM: NewPatientForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    weight: 0,
    height: 0,
    gender: 'MALE',
    birthday: ''
};

const containerVariants = {
    hidden: {opacity: 0},
    visible: {
        opacity: 1,
        transition: {staggerChildren: 0.04, delayChildren: 0.1}
    }
};

const itemVariants = {
    hidden: {opacity: 0, y: 12},
    visible: {opacity: 1, y: 0}
};

function FormField({
    label,
    children
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <motion.div variants={itemVariants} className='flex flex-col gap-2'>
            <Label className='text-xs font-medium text-muted-foreground'>
                {label}
            </Label>
            {children}
        </motion.div>
    );
}

export default function AddPatientDialog({
    open,
    onOpenChange
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [form, setForm] = useState<NewPatientForm>(INITIAL_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {mutateAsync: createPatientAsync} = useCreatePatient();

    const updateField = (field: keyof NewPatientForm, value: string) => {
        setForm(prev => ({...prev, [field]: value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        await createPatientAsync(form);
        setIsSubmitting(false);
        setForm(INITIAL_FORM);
        onOpenChange(false);
    };

    const handleClose = (value: boolean) => {
        if (!isSubmitting) {
            onOpenChange(value);
            if (!value) setForm(INITIAL_FORM);
        }
    };

    const inputStyles =
        'h-10 rounded-xl border-border bg-secondary/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/50 transition-colors duration-200';

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className='max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-background p-0 sm:max-w-lg'>
                {/* Header with gradient accent */}
                <div className='relative overflow-hidden px-6 pb-4 pt-6'>
                    <div className='absolute inset-0 bg-gradient-to-br from-[hsl(262,80%,60%)/0.06] to-[hsl(220,70%,55%)/0.06]' />
                    <div className='relative'>
                        <DialogHeader>
                            <div className='mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)]'>
                                <UserPlus className='h-5 w-5 text-primary-foreground' />
                            </div>
                            <DialogTitle className='text-lg font-bold text-foreground'>
                                Nuevo Paciente
                            </DialogTitle>
                            <DialogDescription className='text-sm text-muted-foreground'>
                                Complete los datos del paciente para crear un
                                nuevo registro.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                <Separator className='bg-border/50' />

                {/* Form */}
                <form onSubmit={handleSubmit} className='px-6 pb-6 pt-4'>
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key='form-fields'
                            variants={containerVariants}
                            initial='hidden'
                            animate='visible'
                            className='flex flex-col gap-5'>
                            {/* Name row */}
                            <div className='grid grid-cols-2 gap-4'>
                                <FormField label='Nombre'>
                                    <Input
                                        placeholder='ej. Willie'
                                        value={form.firstName}
                                        onChange={e =>
                                            updateField(
                                                'firstName',
                                                e.target.value
                                            )
                                        }
                                        className={inputStyles}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </FormField>
                                <FormField label='Apellido'>
                                    <Input
                                        placeholder='ej. Jennie'
                                        value={form.lastName}
                                        onChange={e =>
                                            updateField(
                                                'lastName',
                                                e.target.value
                                            )
                                        }
                                        className={inputStyles}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </FormField>
                            </div>

                            {/* Contact row */}
                            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                <FormField label='Correo Electrónico'>
                                    <Input
                                        type='email'
                                        placeholder='paciente@email.com'
                                        value={form.email}
                                        onChange={e =>
                                            updateField('email', e.target.value)
                                        }
                                        className={inputStyles}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </FormField>
                                <FormField label='Teléfono'>
                                    <Input
                                        type='tel'
                                        placeholder='(555) 123-4567'
                                        value={form.phone}
                                        onChange={e =>
                                            updateField('phone', e.target.value)
                                        }
                                        className={inputStyles}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </FormField>
                            </div>

                            {/* Physical row */}
                            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
                                <FormField label='Peso (kg)'>
                                    <div className='relative'>
                                        <Input
                                            type='number'
                                            placeholder='72'
                                            value={form.weight}
                                            onChange={e =>
                                                updateField(
                                                    'weight',
                                                    e.target.value
                                                )
                                            }
                                            className={`${inputStyles} pr-9`}
                                            min={0}
                                            disabled={isSubmitting}
                                        />
                                        <Weight className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40' />
                                    </div>
                                </FormField>
                                <FormField label='Altura (cm)'>
                                    <div className='relative'>
                                        <Input
                                            type='number'
                                            placeholder='175'
                                            value={form.height}
                                            onChange={e =>
                                                updateField(
                                                    'height',
                                                    e.target.value
                                                )
                                            }
                                            className={`${inputStyles} pr-9`}
                                            min={0}
                                            disabled={isSubmitting}
                                        />
                                        <Ruler className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40' />
                                    </div>
                                </FormField>
                                <FormField label='Género'>
                                    <Select
                                        value={form.gender}
                                        onValueChange={v =>
                                            updateField('gender', v)
                                        }
                                        disabled={isSubmitting}>
                                        <SelectTrigger
                                            className={`${inputStyles} rounded-xl`}>
                                            <SelectValue placeholder='Seleccionar' />
                                        </SelectTrigger>
                                        <SelectContent className='rounded-xl border-border bg-popover'>
                                            <SelectItem value='male'>
                                                Masculino
                                            </SelectItem>
                                            <SelectItem value='female'>
                                                Femenino
                                            </SelectItem>
                                            <SelectItem value='other'>
                                                Otro
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormField>
                            </div>

                            {/* Birthday */}
                            <FormField label='Fecha de Nacimiento'>
                                <div className='relative'>
                                    <Input
                                        type='date'
                                        value={form.birthday}
                                        onChange={e =>
                                            updateField(
                                                'birthday',
                                                e.target.value
                                            )
                                        }
                                        className={`${inputStyles} pr-9`}
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <Cake className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40' />
                                </div>
                            </FormField>

                            {/* Actions */}
                            <motion.div
                                variants={itemVariants}
                                className='flex items-center justify-end gap-3 pt-2'>
                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={() => handleClose(false)}
                                    disabled={isSubmitting}
                                    className='h-10 rounded-xl border-border bg-secondary/30 px-5 text-sm text-foreground hover:bg-secondary/60'>
                                    Cancelar
                                </Button>
                                <Button
                                    type='submit'
                                    disabled={isSubmitting}
                                    className='h-10 rounded-xl bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)] px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-lg hover:shadow-[hsl(262,80%,60%)/0.25]'>
                                    <AnimatePresence mode='wait'>
                                        {isSubmitting ? (
                                            <motion.span
                                                key='loading'
                                                initial={{opacity: 0}}
                                                animate={{opacity: 1}}
                                                exit={{opacity: 0}}
                                                className='flex items-center gap-2'>
                                                <Loader2 className='h-4 w-4 animate-spin' />
                                                Creando...
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key='idle'
                                                initial={{opacity: 0}}
                                                animate={{opacity: 1}}
                                                exit={{opacity: 0}}
                                                className='flex items-center gap-2'>
                                                <UserPlus className='h-4 w-4' />
                                                Crear Paciente
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Button>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </form>
            </DialogContent>
        </Dialog>
    );
}
