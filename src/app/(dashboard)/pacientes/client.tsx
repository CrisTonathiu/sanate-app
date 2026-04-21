'use client';

import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import Table from '@/components/widgets/Table';
import {
    useAcceptPatientIntake,
    useGetPatientIntakes,
    useGetPatients
} from '@/hooks/use-patients';
import {Loader2, Search, UserPlus} from 'lucide-react';

export default function ClientPage() {
    const router = useRouter();
    const [acceptingIntakeId, setAcceptingIntakeId] = useState<string | null>(
        null
    );
    const {data: patients, isPending} = useGetPatients();
    const {data: patientIntakes, isPending: isPendingIntakes} =
        useGetPatientIntakes();
    const {mutateAsync: acceptPatientIntakeAsync} = useAcceptPatientIntake();

    const handleAcceptIntake = async (intakeId: string) => {
        setAcceptingIntakeId(intakeId);

        try {
            await acceptPatientIntakeAsync(intakeId);
        } finally {
            setAcceptingIntakeId(null);
        }
    };

    const rows = (patients ?? []).map(patient => ({
        name: {
            primary: `${patient.firstName} ${patient.lastName}`,
            secondary: patient.email
        },
        status: patient.isActive ? 'Activo' : 'Inactivo',
        lastActivity: patient.lastLoginAt
            ? new Date(patient.lastLoginAt).toLocaleDateString('es-MX')
            : 'Nunca',
        actions: (
            <Button
                size={'sm'}
                onClick={() => router.push(`/pacientes/${patient.id}`)}>
                Ver perfil
            </Button>
        )
    }));

    const intakeRows = (patientIntakes ?? []).map(intake => ({
        name: {
            primary:
                `${intake.firstName ?? ''} ${intake.lastName ?? ''}`.trim() ||
                'Sin nombre capturado',
            secondary: intake.email || 'Sin correo electrónico'
        },
        source: intake.source,
        submittedAt: new Date(intake.createdAt).toLocaleDateString('es-MX'),
        actions: (
            <Button
                size='sm'
                onClick={() => handleAcceptIntake(intake.id)}
                disabled={acceptingIntakeId === intake.id}>
                {acceptingIntakeId === intake.id ? (
                    <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Aceptando...
                    </>
                ) : (
                    <>
                        <UserPlus className='mr-2 h-4 w-4' />
                        Aceptar
                    </>
                )}
            </Button>
        )
    }));

    return (
        <div className='space-y-8'>
            <div className='relative w-full md:w-auto mt-3 md:mt-0'>
                <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                    type='search'
                    placeholder='Buscar por nombre o email'
                    className='w-full rounded-2xl pl-9 md:w-[500px]'
                />
            </div>

            <section className='space-y-4'>
                <div>
                    <h2 className='text-lg font-semibold text-foreground'>
                        Solicitudes desde Google Form
                    </h2>
                    <p className='text-sm text-muted-foreground'>
                        Revisa los registros capturados por formulario y
                        conviértelos en pacientes cuando estés listo.
                    </p>
                </div>

                <Table
                    columns={[
                        {key: 'name', label: 'Nombre'},
                        {key: 'source', label: 'Origen'},
                        {key: 'submittedAt', label: 'Fecha'},
                        {key: 'actions', label: 'Acciones'}
                    ]}
                    rows={intakeRows}
                    isLoading={isPendingIntakes}
                />
            </section>

            <section className='space-y-4'>
                <div>
                    <h2 className='text-lg font-semibold text-foreground'>
                        Pacientes activos
                    </h2>
                </div>

                <Table
                    columns={[
                        {key: 'name', label: 'Nombre'},
                        {key: 'status', label: 'Estado'},
                        {key: 'lastActivity', label: 'Ultima actividad'},
                        {key: 'actions', label: 'Acciones'}
                    ]}
                    rows={rows}
                    isLoading={isPending}
                />
            </section>
        </div>
    );
}
