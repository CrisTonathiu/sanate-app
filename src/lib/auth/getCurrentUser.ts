import {createClient} from '@/lib/supabase/server';
import {prisma} from '@/lib/prisma';

export async function getCurrentUser() {
    const supabase = await createClient();

    const {
        data: {user},
        error
    } = await supabase.auth.getUser();

    if (!user || error) return null;

    const normalizedEmail = user.email?.trim();

    if (!normalizedEmail) {
        return null;
    }

    const dbUser = await prisma.user.findUnique({
        where: {email: normalizedEmail}
    });

    if (!dbUser) {
        return null;
    }

    return {
        ...dbUser,
        email:
            typeof dbUser.email === 'string'
                ? dbUser.email.trim()
                : dbUser.email
    };
}
