import {claimUser} from '@/lib/services/user.service';

export async function POST(req: Request) {
    const body = await req.json();
    const result = await claimUser(body);

    if (!result.success) {
        return Response.json(
            {message: result.message, errors: result.errors},
            {status: 400}
        );
    }

    return Response.json({message: result.message});
}
