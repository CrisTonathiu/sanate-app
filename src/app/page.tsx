import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {redirect} from 'next/navigation';

export default async function Home() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (user.role === 'PATIENT') {
        redirect('/portal');
    }

    redirect('/pacientes');
}
