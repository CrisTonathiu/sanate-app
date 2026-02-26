'use client';

import QuickAccessCard from '@/components/widgets/QuickAccessCard';
import {FileChartPie, User, Video} from 'lucide-react';

const actions = [
    {
        label: 'Agregar nuevo paciente',
        href: '/usuarios/nuevo',
        description:
            'Crea un nuevo paciente para gestionar su información y actividades.',
        icon: <User className='h-6 w-6 text-blue-600' />,
        cta: 'Agregar Paciente'
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

export default function ClientPage() {
    return (
        <div className='mt-0'>
            <QuickAccessCard actions={actions} />
        </div>
    );
}
