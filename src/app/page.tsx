import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {redirect} from 'next/navigation';
import Main from './(dashboard)/main';
import ClientPage from './(dashboard)/client';

export default async function Home() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }
    return (
        <Main>
            <ClientPage />
        </Main>
    );
}
