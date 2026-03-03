import {requireRole} from '@/lib/auth/requireRole';
import {
    getPatientProfile,
    updatePatientProfile,
    deletePatient
} from '@/lib/services/patient.service';

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
    const patient = await getPatientProfile(patientId);

    return Response.json(patient, {status: patient.success ? 200 : 400});
}

export async function PUT(
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
        const result = await updatePatientProfile(patientId, body);
        return Response.json(result, {status: result.success ? 200 : 400});
    } catch (error) {
        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'An error occurred while updating the patient profile'
            },
            {status: 500}
        );
    }
}

export async function DELETE(
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
    const result = await deletePatient(patientId);
    return Response.json(result, {status: result.success ? 200 : 400});
}
