import {requireRole} from '@/lib/auth/requireRole';
import {deletePatientCondition} from '@/lib/services/patient/patient-condition.service';

export async function DELETE(
    _request: Request,
    {params}: {params: Promise<{patientId: string; conditionId: string}>}
) {
    await requireRole('ADMIN');
    const {patientId, conditionId} = await params;
    if (!patientId) {
        return Response.json(
            {success: false, message: 'Patient ID is required'},
            {status: 400}
        );
    }
    if (!conditionId) {
        return Response.json(
            {success: false, message: 'Condition ID is required'},
            {status: 400}
        );
    }
    const result = await deletePatientCondition(patientId, conditionId);
    return Response.json(result, {status: result.success ? 200 : 400});
}
