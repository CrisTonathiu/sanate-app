import {cn} from '@/lib/utils';
import {
    Apple,
    ChevronDown,
    FileHeart,
    LayoutDashboard,
    Settings,
    Users,
    X
} from 'lucide-react';
import {ScrollArea} from '../ui/scroll-area';
import {Badge} from '../ui/badge';
import {useState} from 'react';
import {Avatar, AvatarFallback, AvatarImage} from '../ui/avatar';

interface DesktopSidebarProps {
    sidebarOpen: boolean;
}

const sidebarItems = [
    {
        title: 'Inicio',
        icon: <LayoutDashboard className='size-4' />,
        isActive: true,
        url: '/'
    },
    {
        title: 'Usuarios',
        icon: <Users className='size-4' />,
        items: [
            {title: 'Lista de Usuarios', url: '/usuarios'},
            {title: 'Agregar Usuario', url: '/usuarios/nuevo'}
        ]
    },
    {
        title: 'Pacientes',
        icon: <Users className='size-4' />,
        items: [
            {title: 'Lista de Pacientes', url: '/pacientes'},
            {title: 'Agregar Paciente', url: '/pacientes/nuevo'}
        ]
    },
    {
        title: 'Dietas',
        icon: <Apple className='size-4' />,
        items: [
            {title: 'Mis Dietas', url: '/dietas'},
            {title: 'Crear Dieta', url: '/dietas/nueva'}
        ]
    },
    {
        title: 'Recetas',
        icon: <FileHeart className='size-4' />,
        url: '/recetas'
    }
];

export default function DesktopSidebar({sidebarOpen}: DesktopSidebarProps) {
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
        {}
    );
    const toggleExpanded = (title: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };
    return (
        <div
            className={cn(
                'fixed inset-y-0 left-0 z-30 hidden w-64 transform border-r bg-background transition-transform duration-300 ease-in-out md:block',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
            <div className='flex h-full flex-col'>
                <div className='p-4'>
                    <div className='flex items-center gap-3'>
                        <div className='flex aspect-square size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white'>
                            <Apple className='size-5' />
                        </div>
                        <div>
                            <h2 className='font-semibold'>Sanate App</h2>
                            <p className='text-xs text-muted-foreground'>
                                Gestion Nutricional
                            </p>
                        </div>
                    </div>
                </div>
                <ScrollArea className='flex-1 px-3 py-2'>
                    <div className='space-y-1'>
                        {sidebarItems.map(item => (
                            <div key={item.title} className='mb-1'>
                                {item.url && !item.items ? (
                                    <a
                                        href={item.url}
                                        className={cn(
                                            'flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium',
                                            item.isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'hover:bg-muted'
                                        )}>
                                        <div className='flex items-center gap-3'>
                                            {item.icon}
                                            <span>{item.title}</span>
                                        </div>
                                    </a>
                                ) : (
                                    <button
                                        className={cn(
                                            'flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium',
                                            item.isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'hover:bg-muted'
                                        )}
                                        onClick={() =>
                                            item.items &&
                                            toggleExpanded(item.title)
                                        }>
                                        <div className='flex items-center gap-3'>
                                            {item.icon}
                                            <span>{item.title}</span>
                                        </div>
                                        {item.items && (
                                            <ChevronDown
                                                className={cn(
                                                    'ml-2 h-4 w-4 transition-transform',
                                                    expandedItems[item.title]
                                                        ? 'rotate-180'
                                                        : ''
                                                )}
                                            />
                                        )}
                                    </button>
                                )}

                                {item.items && expandedItems[item.title] && (
                                    <div className='mt-1 ml-6 space-y-1 border-l pl-3'>
                                        {item.items.map((subItem: any) => (
                                            <a
                                                key={subItem.title}
                                                href={subItem.url}
                                                className='flex items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted'>
                                                {subItem.title}
                                                {subItem.badge && (
                                                    <Badge
                                                        variant='outline'
                                                        className='ml-auto rounded-full px-2 py-0.5 text-xs'>
                                                        {subItem.badge}
                                                    </Badge>
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className='border-t p-3'>
                    <div className='space-y-1'>
                        <button className='flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium hover:bg-muted'>
                            <Settings className='h-5 w-5' />
                            <span>Configuracion</span>
                        </button>
                        <button className='flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium hover:bg-muted'>
                            <div className='flex items-center gap-3'>
                                <Avatar className='h-6 w-6'>
                                    <AvatarImage
                                        src='/placeholder.svg?height=32&width=32'
                                        alt='User'
                                    />
                                    <AvatarFallback>C</AvatarFallback>
                                </Avatar>
                                <span>Cynthia</span>
                            </div>
                            <Badge variant='outline' className='ml-auto'>
                                Pro
                            </Badge>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
