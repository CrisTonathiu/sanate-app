import {requireRole} from '@/lib/auth/requireRole';
import {
    getPatientAllergies,
    createPatientAllergy
} from '@/lib/services/patient/patient-allergy.service';

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
    const patient = await getPatientAllergies(patientId);

    return Response.json(patient, {status: patient.success ? 200 : 400});
}

export async function POST(
    request: Request,
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

    try {
        const body = await request.json();
        const result = await createPatientAllergy({
            patientId,
            allergyId: body.allergyId,
            severity: body.severity,
            notes: body.notes
        });
        return Response.json(result, {status: result.success ? 200 : 400});
    } catch (error) {
        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'An error occurred while adding the allergy to the patient'
            },
            {status: 500}
        );
    }
}
