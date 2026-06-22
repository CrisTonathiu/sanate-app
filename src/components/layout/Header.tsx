'use client';

import {getUserFullName, getUserInitials} from '@/lib/utils';
import {LogOut, Menu, PanelLeft} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {Button} from '../ui/button';
import {Avatar, AvatarFallback, AvatarImage} from '../ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '../ui/tooltip';

interface HeaderProps {
    setMobileMenuOpen: (open: boolean) => void;
    setSidebarOpen: (open: boolean) => void;
    sidebarOpen: boolean;
    notifications: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
}

export default function Header({
    setMobileMenuOpen,
    setSidebarOpen,
    sidebarOpen,
    notifications,
    firstName,
    lastName,
    avatarUrl
}: HeaderProps) {
    const router = useRouter();
    const name = getUserFullName(firstName, lastName);
    const initials = getUserInitials(firstName, lastName);

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/auth/logout', {
                method: 'POST'
            });

            if (res.ok) {
                router.push('/login');
            }
        } catch {}
    };
    return (
        <header className='sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur'>
            <Button
                variant='ghost'
                size='icon'
                className='md:hidden'
                onClick={() => setMobileMenuOpen(true)}>
                <Menu className='h-5 w-5' />
            </Button>
            <Button
                variant='ghost'
                size='icon'
                className='hidden md:flex'
                onClick={() => setSidebarOpen(!sidebarOpen)}>
                <PanelLeft className='h-5 w-5' />
            </Button>
            <div className='flex flex-1 items-center justify-between'>
                <h1 className='text-xl font-semibold'>Zanate</h1>
                <div className='flex items-center gap-3'>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    className='rounded-2xl relative group'
                                    onClick={handleLogout}>
                                    <LogOut className='h-5 w-5 group-hover:text-red-600 transition-colors' />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Salir</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Avatar className='h-9 w-9 border-2 border-primary'>
                        <AvatarImage
                            src={avatarUrl || undefined}
                            alt={name}
                        />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    );
}
