'use client';

import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {motion} from 'framer-motion';
import DataGrid from '../DataGrid';
import SectionHeading from '../SectionHeading';
import {PatientProfileDTO} from '@/lib/dto/PatientDTO';
import {useGetPatientFoodDislikes} from '@/hooks/use-patients';
import {getAgeFromDateString} from '@/lib/utils';

interface PatientInfoTabProps {
    patient: PatientProfileDTO;
}

const formatDateToSpanish = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';

    // Parse date string directly to avoid timezone issues
    const dateParts = dateString.split(/[-T\s]/);
    const year = parseInt(dateParts[0]);
    const monthIndex = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);

    const months = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre'
    ];

    return `${day} de ${months[monthIndex]} ${year}`;
};

export default function PatientInfoTab({patient}: PatientInfoTabProps) {
    if (!patient) {
        return <div>Paciente no encontrado</div>;
    }

    const {data: foodDislikes = [], isPending: isLoadingFoodDislikes} =
        useGetPatientFoodDislikes(patient.id);

    const patientAge = getAgeFromDateString(patient.birthDate);

    const PATIENT_DATA = [
        {
            label: 'Nombre Completo',
            value: `${patient.firstName} ${patient.lastName}`
        },
        {
            label: 'Fecha de Nacimiento',
            value: formatDateToSpanish(patient.birthDate)
        },
        {
            label: 'Edad',
            value: patientAge !== null ? `${patientAge} años` : 'N/A'
        },
        {label: 'Correo Electrónico', value: patient.email || 'N/A'},
        {label: 'Teléfono', value: patient.phone || 'N/A'}
    ];

    return (
        <motion.div
            key='info'
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -12}}
            transition={{duration: 0.35}}
            className='flex flex-col gap-8'>
            {/* Patient Data */}
            <div className='flex flex-col gap-4'>
                <SectionHeading title='Datos del paciente' delay={0.1} />
                <DataGrid fields={PATIENT_DATA} delay={0.15} />
            </div>

            <Separator className='bg-border/50' />

            <div className='flex flex-col gap-4'>
                <SectionHeading
                    title='Preferencias alimentarias'
                    subtitle='Alimentos que el paciente prefiere evitar por gusto o rechazo, no por alergia'
                    delay={0.2}
                />

                {isLoadingFoodDislikes ? (
                    <p className='text-sm text-muted-foreground'>
                        Cargando preferencias alimentarias...
                    </p>
                ) : foodDislikes.length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                        {foodDislikes.map(item => (
                            <Badge
                                key={item.id}
                                variant='outline'
                                className='rounded-lg border-amber-200 bg-amber-50 px-3 py-1 text-amber-800'>
                                {item.food}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className='text-sm text-muted-foreground'>
                        No hay alimentos rechazados registrados.
                    </p>
                )}
            </div>
        </motion.div>
    );
}
