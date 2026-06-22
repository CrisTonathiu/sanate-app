'use client';

import DesktopSidebar from '@/components/layout/DesktopSidebar';
import Header from '@/components/layout/Header';
import MobileSidebar from '@/components/layout/MobileSidebar';
import {SidebarProvider, useSidebar} from '@/lib/context/sidebar-context';
import {cn} from '@/lib/utils';
import React from 'react';

type LayoutUser = {
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
};

type MainProps = {
    children: React.ReactNode;
    user: LayoutUser;
};

function MainContent({
    children,
    user
}: {
    children: React.ReactNode;
    user: LayoutUser;
}) {
    const {sidebarOpen, setSidebarOpen} = useSidebar();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState<boolean>(false);
    return (
        <div className='relative min-h-screen overflow-hidden bg-background'>
            <div className='absolute inset-0 -z-10 opacity-20' />

            <DesktopSidebar
                sidebarOpen={sidebarOpen}
                firstName={user.firstName}
                lastName={user.lastName}
                avatarUrl={user.avatarUrl}
            />
            <MobileSidebar
                open={mobileMenuOpen}
                onOpenChange={setMobileMenuOpen}
                firstName={user.firstName}
                lastName={user.lastName}
                avatarUrl={user.avatarUrl}
            />

            <div
                className={cn(
                    'min-h-screen transition-all duration-300 ease-in-out',
                    sidebarOpen ? 'md:pl-64' : 'md:pl-0'
                )}>
                <Header
                    setMobileMenuOpen={setMobileMenuOpen}
                    setSidebarOpen={setSidebarOpen}
                    sidebarOpen={sidebarOpen}
                    notifications={5}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    avatarUrl={user.avatarUrl}
                />
                <main className='flex-1'>{children}</main>
            </div>
        </div>
    );
}

export default function Main({children, user}: MainProps) {
    return (
        <SidebarProvider>
            <MainContent user={user}>{children}</MainContent>
        </SidebarProvider>
    );
}
