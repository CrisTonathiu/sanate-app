import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {redirect} from 'next/navigation';
import Main from './main';

export default async function StaffLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (user.role === 'PATIENT') {
        redirect('/portal');
    }

    return (
        <Main
            user={{
                firstName: user.firstName,
                lastName: user.lastName,
                avatarUrl: user.avatarUrl
            }}>
            {children}
        </Main>
    );
}
