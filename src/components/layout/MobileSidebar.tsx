'use client';

import {cn} from '@/lib/utils';
import {SidebarBrand} from './SidebarBrand';
import {SidebarFooter} from './SidebarFooter';
import {SidebarNav} from './SidebarNav';

interface MobileSidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
}

export default function MobileSidebar({
    open,
    onOpenChange,
    firstName,
    lastName,
    avatarUrl
}: MobileSidebarProps) {
    const handleClose = () => onOpenChange(false);

    return (
        <>
            <div
                className={cn(
                    'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden',
                    open
                        ? 'opacity-100'
                        : 'pointer-events-none opacity-0'
                )}
                onClick={handleClose}
                aria-hidden={!open}
            />

            <div
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-background transition-transform duration-300 ease-in-out md:hidden',
                    open ? 'translate-x-0' : '-translate-x-full'
                )}
                aria-hidden={!open}>
                <div className='flex h-full flex-col'>
                    <SidebarBrand onClose={handleClose} />
                    <SidebarNav onNavigate={handleClose} />
                    <SidebarFooter
                        firstName={firstName}
                        lastName={lastName}
                        avatarUrl={avatarUrl}
                    />
                </div>
            </div>
        </>
    );
}
