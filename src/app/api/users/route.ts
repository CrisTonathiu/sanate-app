import {createUser, getUsers} from '@/lib/services/user.service';

export async function POST(req: Request) {
    const body = await req.json();

    const user = await createUser(body);

    return Response.json(user);
}

export async function GET() {
    const users = await getUsers();
    return Response.json(users);
}
