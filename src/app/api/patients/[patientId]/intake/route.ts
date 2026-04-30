import {requireRole} from '@/lib/auth/requireRole';
import {getPatientIntakeByPatientId} from '@/lib/services/patient/patient-intake.service';

export async function GET(
    _request: Request,
    {params}: {params: Promise<{patientId: string}>}
) {
    await requireRole('ADMIN');
    const {patientId} = await params;

    if (!patientId) {
        return Response.json(
            {success: false, message: 'Patient ID is required'},
            {status: 400}
        );
    }

    const result = await getPatientIntakeByPatientId(patientId);
    return Response.json(result, {status: result.success ? 200 : 404});
}
