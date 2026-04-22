'use client';

import DesktopSidebar from '@/components/layout/DesktopSidebar';
import Header from '@/components/layout/Header';
import {SidebarProvider, useSidebar} from '@/lib/context/sidebar-context';
import {cn} from '@/lib/utils';
import React from 'react';

type MainProps = {
    children: React.ReactNode;
};

function MainContent({children}: {children: React.ReactNode}) {
    const {sidebarOpen, setSidebarOpen} = useSidebar();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState<boolean>(false);
    return (
        <div className='relative min-h-screen overflow-hidden bg-background'>
            <div className='absolute inset-0 -z-10 opacity-20' />

            <DesktopSidebar sidebarOpen={sidebarOpen} />

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
                />
                <main className='flex-1'>{children}</main>
            </div>
        </div>
    );
}

export default function Main({children}: MainProps) {
    return (
        <SidebarProvider>
            <MainContent>{children}</MainContent>
        </SidebarProvider>
    );
}
