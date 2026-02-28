'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import Table from '@/components/widgets/Table';
import {useGetPatients} from '@/hooks/use-patients';
import {Search} from 'lucide-react';

export default function ClientPage() {
    const {data: patients, isPending} = useGetPatients();

    const rows = (patients ?? []).map(patient => ({
        name: {
            primary: `${patient.firstName} ${patient.lastName}`,
            secondary: patient.email
        },
        status: patient.isActive ? 'Activo' : 'Inactivo',
        lastActivity: patient.lastLoginAt
            ? new Date(patient.lastLoginAt).toLocaleDateString('es-MX')
            : 'Nunca',
        actions: <Button size={'sm'}>Ver perfil</Button>
    }));
    return (
        <>
            <div className='relative w-full md:w-auto mt-3 md:mt-0'>
                <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                    type='search'
                    placeholder='Buscar por nombre o email'
                    className='w-full rounded-2xl pl-9 md:w-[500px]'
                />
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
        </>
    );
}
