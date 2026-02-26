import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {redirect} from 'next/navigation';

export default async function AuthLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();

    if (user) {
        redirect('/');
    }

    return (
        <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4'>
            {children}
        </div>
    );
}
