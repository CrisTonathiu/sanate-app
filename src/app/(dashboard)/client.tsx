'use client';

import {useState} from 'react';
import QuickAccessCard from '@/components/widgets/QuickAccessCard';
import AddPatientDialog from '@/components/widgets/AddPatientDialog';
import {FileChartPie, UserPlus, Video} from 'lucide-react';

export default function ClientPage() {
    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

    const actions = [
        {
            label: 'Agregar nuevo paciente',
            description:
                'Crea un nuevo paciente para gestionar su información y actividades.',
            icon: <UserPlus className='h-6 w-6 text-blue-600' />,
            cta: 'Agregar Paciente',
            onClick: () => setIsAddPatientOpen(true)
        },
        {
            label: 'Agregar nuevo protocolo',
            href: '/protocolos/nuevo',
            description:
                'Crea un nuevo protocolo para organizar tus procedimientos y guías.',
            icon: <FileChartPie className='h-6 w-6 text-purple-600' />,
            cta: 'Agregar Protocolo'
        },
        {
            label: 'Iniciar nueva consulta',
            href: '/consultas/nueva',
            description:
                'Inicia una nueva consulta para atender a un paciente y registrar su progreso.',
            icon: <Video className='h-6 w-6 text-red-600' />,
            cta: 'Iniciar Consulta'
        }
    ];

    return (
        <div className='mt-0'>
            <QuickAccessCard actions={actions} />
            <AddPatientDialog
                open={isAddPatientOpen}
                onOpenChange={setIsAddPatientOpen}
            />
        </div>
    );
}
