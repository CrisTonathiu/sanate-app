import {
    Apple,
    FileHeart,
    LayoutDashboard,
    Users,
    Video
} from 'lucide-react';
import type {ReactNode} from 'react';

export type SidebarSubItem = {
    title: string;
    url: string;
    badge?: string;
};

export type SidebarItem = {
    title: string;
    icon: ReactNode;
    isActive?: boolean;
    url?: string;
    items?: SidebarSubItem[];
};

export const sidebarItems: SidebarItem[] = [
    {
        title: 'Inicio',
        icon: <LayoutDashboard className='size-4' />,
        isActive: true,
        url: '/'
    },
    {
        title: 'Usuarios',
        icon: <Users className='size-4' />,
        items: [{title: 'Lista de Usuarios', url: '/usuarios'}]
    },
    {
        title: 'Pacientes',
        icon: <Users className='size-4' />,
        items: [{title: 'Lista de Pacientes', url: '/pacientes'}]
    },
    {
        title: 'Videos',
        icon: <Video className='size-4' />,
        items: [
            {title: 'Mis Videos', url: '/videos'},
            {title: 'Subir Video', url: '/videos/subir'}
        ]
    },
    {
        title: 'Recetas',
        icon: <FileHeart className='size-4' />,
        items: [
            {title: 'Mis Recetas', url: '/recetas'},
            {title: 'Crear Receta', url: '/recetas/nuevo'}
        ]
    },
    {
        title: 'Alimentos',
        icon: <Apple className='size-4' />,
        items: [
            {title: 'Catálogo', url: '/alimentos'},
            {title: 'Agregar alimento', url: '/alimentos/nuevo'}
        ]
    }
];
