'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {LogOut} from 'lucide-react';
import {Button} from '@/components/ui/button';

export function LogoutButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            });

            if (response.ok) {
                router.push('/login');
                router.refresh();
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            type='button'
            variant='outline'
            onClick={handleLogout}
            disabled={isLoading}
            className='gap-2 rounded-full'>
            <LogOut className='h-4 w-4' />
            {isLoading ? 'Cerrando sesion...' : 'Cerrar sesion'}
        </Button>
    );
}
