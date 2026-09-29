import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {redirect} from 'next/navigation';
import ClientPage from './client';

export default async function ProfilePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className='relative mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8 space-y-6'>
            <ClientPage
                user={{
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    role: user.role
                }}
            />
        </div>
    );
}
