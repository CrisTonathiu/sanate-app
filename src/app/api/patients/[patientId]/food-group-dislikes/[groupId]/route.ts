import {requireRole} from '@/lib/auth/requireRole';
import {deletePatientFoodGroupDislike} from '@/lib/services/patient/patient-food-group-dislike.service';

export async function DELETE(
    _request: Request,
    {params}: {params: Promise<{patientId: string; groupId: string}>}
) {
    await requireRole('ADMIN');
    const {patientId, groupId} = await params;

    if (!patientId) {
        return Response.json(
            {success: false, message: 'Patient ID is required'},
            {status: 400}
        );
    }

    if (!groupId) {
        return Response.json(
            {success: false, message: 'Group ID is required'},
            {status: 400}
        );
    }

    const result = await deletePatientFoodGroupDislike(patientId, groupId);

    return Response.json(result, {status: result.success ? 200 : 400});
}
