import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {redirect} from 'next/navigation';

export default async function PatientLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	const user = await getCurrentUser();

	if (!user) {
		redirect('/login');
	}

	if (user.role !== 'PATIENT') {
		redirect('/');
	}

	return <div className='min-h-screen bg-background'>{children}</div>;
}
