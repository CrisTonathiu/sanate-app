import {cn} from '@/lib/utils';
import {SidebarBrand} from './SidebarBrand';
import {SidebarFooter} from './SidebarFooter';
import {SidebarNav} from './SidebarNav';

interface DesktopSidebarProps {
    sidebarOpen: boolean;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
}

export default function DesktopSidebar({
    sidebarOpen,
    firstName,
    lastName,
    avatarUrl
}: DesktopSidebarProps) {
    return (
        <div
            className={cn(
                'fixed inset-y-0 left-0 z-30 hidden w-64 transform border-r bg-background transition-transform duration-300 ease-in-out md:block',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
            <div className='flex h-full flex-col'>
                <SidebarBrand />
                <SidebarNav />
                <SidebarFooter
                    firstName={firstName}
                    lastName={lastName}
                    avatarUrl={avatarUrl}
                />
            </div>
        </div>
    );
}
