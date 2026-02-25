'use client';

import DesktopSidebar from '@/components/layout/DesktopSidebar';
import Header from '@/components/layout/Header';
import {cn} from '@/lib/utils';
import {motion} from 'framer-motion';
import React from 'react';

type MainProps = {
    children: React.ReactNode;
};

export default function Main({children}: MainProps) {
    const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState<boolean>(false);
    return (
        <div className='relative min-h-screen overflow-hidden bg-background'>
            {/* Animated gradient background */}
            <motion.div
                className='absolute inset-0 -z-10 opacity-20'
                animate={{
                    background: [
                        'radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)',
                        'radial-gradient(circle at 30% 70%, rgba(233, 30, 99, 0.5) 0%, rgba(81, 45, 168, 0.5) 50%, rgba(0, 0, 0, 0) 100%)',
                        'radial-gradient(circle at 70% 30%, rgba(76, 175, 80, 0.5) 0%, rgba(32, 119, 188, 0.5) 50%, rgba(0, 0, 0, 0) 100%)',
                        'radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)'
                    ]
                }}
                transition={{
                    duration: 30,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'linear'
                }}
            />

            {/* Sidebar - Desktop */}
            <DesktopSidebar sidebarOpen={sidebarOpen} />

            <div
                className={cn(
                    'min-h-screen transition-all duration-300 ease-in-out',
                    sidebarOpen ? 'md:pl-64' : 'md:pl-0'
                )}>
                {/* Header */}
                <Header
                    setMobileMenuOpen={setMobileMenuOpen}
                    setSidebarOpen={setSidebarOpen}
                    sidebarOpen={sidebarOpen}
                    notifications={5}
                />
                <main className='flex-1 p-4 md:p-6'>{children}</main>
            </div>
        </div>
    );
}
