import {Bell, Menu, PanelLeft} from 'lucide-react';
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
}

export default function Header({
    setMobileMenuOpen,
    setSidebarOpen,
    sidebarOpen,
    notifications
}: HeaderProps) {
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
                <h1 className='text-xl font-semibold'>Sanate App</h1>
                <div className='flex items-center gap-3'>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    className='rounded-2xl relative'>
                                    <Bell className='h-5 w-5' />
                                    {notifications > 0 && (
                                        <span className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white'>
                                            {notifications}
                                        </span>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Notificaciones</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Avatar className='h-9 w-9 border-2 border-primary'>
                        <AvatarImage
                            src='/placeholder.svg?height=40&width=40'
                            alt='User'
                        />
                        <AvatarFallback>CC</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    );
}
