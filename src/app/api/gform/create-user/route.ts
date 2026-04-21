import {createPatientIntake} from '@/lib/services/patient/patient-intake.service';

export async function POST(req: Request) {
    const body = await req.json();

    const result = await createPatientIntake(body);

    return Response.json(result, {status: result.success ? 201 : 400});
}
