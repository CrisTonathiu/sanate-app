'use client';

import React, {createContext, useContext, useState, useCallback} from 'react';

interface SidebarContextType {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
    children: React.ReactNode;
    initialOpen?: boolean;
}

export function SidebarProvider({
    children,
    initialOpen = true
}: SidebarProviderProps) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(initialOpen);

    return (
        <SidebarContext.Provider value={{sidebarOpen, setSidebarOpen}}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider');
    }
    return context;
}
