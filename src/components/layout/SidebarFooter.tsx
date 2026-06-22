import {getUserFullName, getUserInitials} from '@/lib/utils';
import {Settings} from 'lucide-react';
import {Avatar, AvatarFallback, AvatarImage} from '../ui/avatar';

interface SidebarFooterProps {
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
}

export function SidebarFooter({
    firstName,
    lastName,
    avatarUrl
}: SidebarFooterProps) {
    const name = getUserFullName(firstName, lastName);
    const initials = getUserInitials(firstName, lastName);
    return (
        <div className='border-t p-3'>
            <div className='space-y-1'>
                <button
                    type='button'
                    className='flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium hover:bg-muted'>
                    <Settings className='h-5 w-5' />
                    <span>Configuracion</span>
                </button>
                <button
                    type='button'
                    className='flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium hover:bg-muted'>
                    <div className='flex items-center gap-3'>
                        <Avatar className='h-6 w-6'>
                            <AvatarImage
                                src={avatarUrl || undefined}
                                alt={name}
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <span>{name}</span>
                    </div>
                    {/* <Badge variant='outline' className='ml-auto'>
                        Pro
                    </Badge> */}
                </button>
            </div>
        </div>
    );
}
