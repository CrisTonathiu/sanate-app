import {requireRole} from '@/lib/auth/requireRole';
import {createPatient, getPatients} from '@/lib/services/patient.service';

export async function POST(req: Request) {
    const currentUser = await requireRole('ADMIN');
    const body = await req.json();

    const result = await createPatient(body, currentUser.id);

    return Response.json(result, {status: result.success ? 200 : 400});
}

export async function GET() {
    await requireRole('ADMIN');
    const patients = await getPatients();
    return Response.json(patients, {status: patients.success ? 200 : 400});
}
