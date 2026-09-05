'use client';

import {useEffect} from 'react';
import AppErrorFallback from '@/components/widgets/AppErrorFallback';
import './globals.css';

export default function GlobalError({
    error
}: {
    error: Error & {digest?: string};
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang='es'>
            <body className='antialiased'>
                <AppErrorFallback />
            </body>
        </html>
    );
}
