import {createClient} from '@/lib/supabase/server';
import {prisma} from '@/lib/prisma';

export async function getCurrentUser() {
    const supabase = await createClient();

    const {
        data: {user},
        error
    } = await supabase.auth.getUser();

    if (!user || error) return null;

    const dbUser = await prisma.user.findUnique({
        where: {email: user.email!}
    });

    return dbUser;
}
