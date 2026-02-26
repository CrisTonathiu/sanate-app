import {createClient} from '@/lib/supabase/server';
import {prisma} from '@/lib/prisma';

export async function getCurrentUser() {
    const supabase = await createClient();

    const {
        data: {user},
        error
    } = await supabase.auth.getUser();

    console.log('Current user from Supabase:', user);

    if (!user || error) return null;

    console.log('Fetching user from database with email:', user.email);

    const dbUser = await prisma.user.findUnique({
        where: {email: user.email!}
    });

    console.log('Fetched user from database:', dbUser);

    return dbUser;
}
