import {ZanateWhatsAppButton} from '@/components/widgets/patient-portal/ZanateWhatsAppButton';
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

	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<div className='flex-1 md:pb-24'>{children}</div>
			<ZanateWhatsAppButton />
		</div>
	);
}
