import {requireRole} from '@/lib/auth/requireRole';
import {deletePatientAllergy} from '@/lib/services/patient/patient-allergy.service';

export async function DELETE(
    _request: Request,
    {params}: {params: Promise<{patientId: string; allergyId: string}>}
) {
    await requireRole('ADMIN');
    const {patientId, allergyId} = await params;
    if (!patientId) {
        return Response.json(
            {success: false, message: 'Patient ID is required'},
            {status: 400}
        );
    }
    if (!allergyId) {
        return Response.json(
            {success: false, message: 'Allergy ID is required'},
            {status: 400}
        );
    }
    const result = await deletePatientAllergy(patientId, allergyId);
    return Response.json(result, {status: result.success ? 200 : 400});
}
