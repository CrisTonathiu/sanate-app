'use client';

import {Download, LogOut, MoreVertical} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    DownloadPlanButton,
    useDownloadPlan
} from './DownloadPlanButton';
import {LogoutButton, useLogout} from './LogoutButton';
import type {PlanRecommendations} from './PlanPdf';

type PortalHeaderActionsProps = {
    recommendations: PlanRecommendations;
};

export function PortalHeaderActions({
    recommendations
}: PortalHeaderActionsProps) {
    const {isDownloading, handleDownload} = useDownloadPlan(recommendations);
    const {isLoading, handleLogout} = useLogout();

    return (
        <>
            <div className='hidden items-center gap-2 md:flex'>
                <DownloadPlanButton recommendations={recommendations} />
                <LogoutButton />
            </div>

            <div className='md:hidden'>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type='button'
                            variant='outline'
                            size='icon'
                            className='h-10 w-10 rounded-full'>
                            <MoreVertical className='h-4 w-4' />
                            <span className='sr-only'>Más opciones</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align='end'
                        className='w-48 rounded-xl border-border bg-popover'>
                        <DropdownMenuItem
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className='cursor-pointer'>
                            <Download className='h-4 w-4' />
                            {isDownloading ? 'Generando...' : 'Descargar Plan'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleLogout}
                            disabled={isLoading}
                            className='cursor-pointer'>
                            <LogOut className='h-4 w-4' />
                            {isLoading ? 'Cerrando sesion...' : 'Cerrar sesion'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    );
}
