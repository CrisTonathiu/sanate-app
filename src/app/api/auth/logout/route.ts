import {createClient} from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        const {error} = await supabase.auth.signOut();

        if (error) {
            return Response.json({message: error.message}, {status: 400});
        }

        return Response.json({message: 'Logged out successfully'});
    } catch (error) {
        return Response.json(
            {message: 'An error occurred during logout'},
            {status: 500}
        );
    }
}
