'use client';

import {useEffect} from 'react';
import AppErrorFallback from '@/components/widgets/AppErrorFallback';

export default function ErrorPage({
    error
}: {
    error: Error & {digest?: string};
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return <AppErrorFallback />;
}
