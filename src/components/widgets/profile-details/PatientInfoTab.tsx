'use client';

import {Separator} from '@/components/ui/separator';
import {motion} from 'framer-motion';
import DataGrid from '../DataGrid';
import SectionHeading from '../SectionHeading';
import {PatientProfileDTO} from '@/lib/dto/PatientDTO';
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

    // const MEDICAL_DATA = [
    //     {label: 'Género', value: patient.gender || 'N/A'},
    //     {
    //         label: 'Estatura',
    //         value: patient.height ? `${patient.height} cm` : 'N/A'
    //     },
    //     {
    //         label: 'Peso',
    //         value: patient.vital?.weightKg
    //             ? `${patient.vital.weightKg} kg`
    //             : 'N/A'
    //     }
    // ];
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

            {/* Medical Data */}
            {/* <div className='flex flex-col gap-4'>
                <SectionHeading
                    title='Datos médicos'
                    subtitle='Última actualización 12 de junio de 2025'
                    delay={0.2}
                />
                <DataGrid fields={MEDICAL_DATA} delay={0.25} />
            </div> */}
        </motion.div>
    );
}
