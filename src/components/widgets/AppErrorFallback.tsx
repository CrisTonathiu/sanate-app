'use client';

import {RefreshCw} from 'lucide-react';

export default function AppErrorFallback() {
    function handleRefresh() {
        window.location.reload();
    }

    return (
        <div className='relative flex min-h-screen items-center justify-center bg-background px-6 py-12'>
            <div
                className='pointer-events-none absolute inset-0 opacity-[0.04]'
                style={{
                    backgroundImage:
                        'linear-gradient(hsl(0 0% 20%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 20%) 1px, transparent 1px)',
                    backgroundSize: '64px 64px'
                }}
            />

            <div className='relative w-full max-w-md rounded-3xl border border-border bg-card/80 p-8 text-center shadow-sm backdrop-blur-sm'>
                <img
                    src='/LOGO_ZANATE_FUNTIONAL.png'
                    alt='Zanate'
                    width={64}
                    height={64}
                    className='mx-auto mb-5 size-16 object-contain'
                />
                <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                    Algo salió mal
                </h1>
                <p className='mt-3 text-sm leading-relaxed text-muted-foreground'>
                    No pudimos cargar Zanate en este momento. Recarga la página
                    para intentarlo de nuevo.
                </p>
                <button
                    type='button'
                    onClick={handleRefresh}
                    className='mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg'>
                    <RefreshCw className='size-4' />
                    Recargar página
                </button>
            </div>
        </div>
    );
}
