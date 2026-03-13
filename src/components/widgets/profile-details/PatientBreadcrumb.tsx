'use client';

import {motion} from 'framer-motion';
import {useRouter} from 'next/navigation';
import {ChevronRight} from 'lucide-react';
import {useGetPatientProfile} from '@/hooks/use-patients';

interface PatientBreadcrumbProps {
    patientId: string;
    currentPageLabel?: string;
}

export default function PatientBreadcrumb({
    patientId,
    currentPageLabel
}: PatientBreadcrumbProps) {
    const router = useRouter();
    const {data: patient} = useGetPatientProfile(patientId);

    const patientLabel = patient
        ? `${patient.firstName} ${patient.lastName}`
        : 'Paciente';

    return (
        <motion.nav
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.4}}
            aria-label='breadcrumb'
            className='mb-6 flex items-center gap-2 text-sm'>
            <button
                onClick={() => router.push('/pacientes')}
                className='text-muted-foreground transition-colors hover:text-foreground'>
                Lista de pacientes
            </button>
            <ChevronRight className='h-3.5 w-3.5 text-muted-foreground/50' />
            {currentPageLabel ? (
                <>
                    <button
                        onClick={() => router.push(`/pacientes/${patientId}`)}
                        className='text-muted-foreground transition-colors hover:text-foreground'>
                        {patientLabel}
                    </button>
                    <ChevronRight className='h-3.5 w-3.5 text-muted-foreground/50' />
                    <span className='font-medium text-primary'>
                        {currentPageLabel}
                    </span>
                </>
            ) : (
                <span className='font-medium text-primary'>{patientLabel}</span>
            )}
        </motion.nav>
    );
}
