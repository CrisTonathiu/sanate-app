import {requireRole} from '@/lib/auth/requireRole';
import {createUser, getUsers} from '@/lib/services/user.service';

export async function POST(req: Request) {
    await requireRole('ADMIN');
    const body = await req.json();

    const user = await createUser(body);

    return Response.json(user);
}

export async function GET() {
    await requireRole('ADMIN');
    const users = await getUsers();
    return Response.json(users);
}
