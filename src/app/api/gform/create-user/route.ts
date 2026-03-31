export async function POST(req: Request) {
    const body = await req.json();

    console.log('Received user data:', body);
    return Response.json(
        {message: 'User created successfully', user: body},
        {status: 201}
    );
}
