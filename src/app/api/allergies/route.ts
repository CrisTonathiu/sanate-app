import {requireRole} from '@/lib/auth/requireRole';
import {
    getAllAllergies,
    createAllergy
} from '@/lib/services/allergy/allergy.service';

export async function GET(_request: Request) {
    await requireRole('ADMIN');
    const allergies = await getAllAllergies();
    return Response.json(allergies, {status: allergies.success ? 200 : 400});
}

export async function POST(request: Request) {
    await requireRole('ADMIN');
    const body = await request.json();
    const result = await createAllergy({
        name: body.name,
        description: body.description
    });
    return Response.json(result, {status: result.success ? 200 : 400});
}
