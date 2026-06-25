import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';

export default async function AuthLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();
    const pathname = (await headers()).get('x-pathname') ?? '';
    const isPasswordResetFlow = pathname.startsWith('/restablecer-contrasena');

    if (user && !isPasswordResetFlow) {
        redirect('/');
    }

    return (
        <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4'>
            {children}
        </div>
    );
}
