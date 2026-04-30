'use client';

import {motion} from 'framer-motion';
import SectionHeading from '../SectionHeading';
import {PatientProfileDTO} from '@/lib/dto/PatientDTO';
import {useGetPatientIntake} from '@/hooks/use-patients';
import DataGrid from '../DataGrid';

interface MedicalRecordsTabProps {
    patient: PatientProfileDTO;
}

export default function MedicalRecordsTab({patient}: MedicalRecordsTabProps) {
    const {data: patientIntake, isPending: isLoadingPatientIntake} =
        useGetPatientIntake(patient.id);
    return (
        <motion.div
            key='records'
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -12}}
            transition={{duration: 0.35}}
            className='flex flex-col gap-4'>
            {/* <SectionHeading title='Historial médico' delay={0.1} />
            <div className='flex flex-col gap-3'>
                {RECORDS.map((rec, i) => (
                    <motion.div
                        key={rec.name}
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.1 + i * 0.06, duration: 0.3}}
                        className='group flex items-center justify-between rounded-xl border border-border bg-card/50 p-4 transition-colors duration-200 hover:bg-secondary/30'>
                        <div className='flex items-center gap-4'>
                            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(262,80%,60%)/0.15] to-[hsl(220,70%,55%)/0.15]'>
                                <FileText className='h-4 w-4 text-primary' />
                            </div>
                            <div className='flex flex-col gap-0.5'>
                                <span className='text-sm font-medium text-foreground'>
                                    {rec.name}
                                </span>
                                <span className='text-xs text-muted-foreground'>
                                    {rec.date}
                                </span>
                            </div>
                        </div>
                        <div className='flex items-center gap-3'>
                            <Badge
                                variant='outline'
                                className='hidden text-xs sm:inline-flex'>
                                {rec.type}
                            </Badge>
                            <span className='text-xs text-muted-foreground'>
                                {rec.size}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div> */}

            <div className='flex flex-col gap-4'>
                <SectionHeading
                    title='Formulario historial del paciente'
                    subtitle='Respuestas enviadas por el paciente en su formulario inicial de Google Forms.'
                    delay={0.2}
                />

                {isLoadingPatientIntake ? (
                    <p className='text-sm text-muted-foreground'>
                        Cargando datos del paciente...
                    </p>
                ) : patientIntake ? (
                    <>
                        <div className='rounded-xl border border-border bg-secondary/50 p-4 text-sm'>
                            <p className='font-medium text-foreground'>
                                Enviado el{' '}
                                {new Date(
                                    patientIntake.createdAt
                                ).toLocaleString('es-MX', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                        <DataGrid
                            fields={Object.entries(
                                patientIntake.data ?? {}
                            ).map(([label, value]) => ({
                                label,
                                value:
                                    value === null ||
                                    value === undefined ||
                                    value === ''
                                        ? 'N/A'
                                        : Array.isArray(value)
                                          ? value.join(', ')
                                          : typeof value === 'object'
                                            ? JSON.stringify(value)
                                            : String(value)
                            }))}
                            delay={0.35}
                        />
                    </>
                ) : (
                    <p className='text-sm text-muted-foreground'>
                        No se encontró un intake vinculado a este paciente.
                    </p>
                )}
            </div>
        </motion.div>
    );
}
