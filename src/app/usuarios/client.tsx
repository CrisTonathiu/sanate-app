'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import Table from '@/components/widgets/Table';
import {Search} from 'lucide-react';
import {useGetUsers} from '@/hooks/use-users';

export default function ClientPage() {
    const {data: users, isPending} = useGetUsers();

    const rows = (users ?? []).map(user => ({
        name: {
            primary: `${user.firstName} ${user.lastName}`,
            secondary: user.email
        },
        status: user.isActive ? 'Activo' : 'Inactivo',
        lastActivity: user.lastLoginAt
            ? new Date(user.lastLoginAt).toLocaleDateString('es-MX')
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
