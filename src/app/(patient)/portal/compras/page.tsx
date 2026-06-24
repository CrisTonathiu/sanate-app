import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {loadProtocolShoppingListForUser} from '@/lib/services/patient/patient-shopping-list.service';
import ShoppingListClient from './client';

export const dynamic = 'force-dynamic';

export default async function ShoppingListPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'PATIENT') {
        return (
            <main className='mx-auto max-w-4xl min-h-screen bg-background p-4 md:p-6 lg:p-8'>
                <p className='text-muted-foreground'>
                    No tienes acceso a esta página.
                </p>
            </main>
        );
    }

    const {weeklyLists} = await loadProtocolShoppingListForUser(user.id);

    return <ShoppingListClient weeklyLists={weeklyLists} />;
}
