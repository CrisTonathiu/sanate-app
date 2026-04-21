import {requireRole} from '@/lib/auth/requireRole';
import {acceptPatientIntake} from '@/lib/services/patient/patient-intake.service';

export async function POST(
    _req: Request,
    {params}: {params: Promise<{intakeId: string}>}
) {
    const currentUser = await requireRole('ADMIN');
    const {intakeId} = await params;

    if (!intakeId) {
        return Response.json(
            {success: false, message: 'Patient intake ID is required'},
            {status: 400}
        );
    }

    const result = await acceptPatientIntake(intakeId, currentUser.id);
    return Response.json(result, {status: result.success ? 200 : 400});
}
