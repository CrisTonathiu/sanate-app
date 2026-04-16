import {requireRole} from '@/lib/auth/requireRole';
import {deletePatientFoodDislike} from '@/lib/services/patient/patient-food-dislike.service';

export async function DELETE(
    _request: Request,
    {params}: {params: Promise<{patientId: string; foodId: string}>}
) {
    await requireRole('ADMIN');
    const {patientId, foodId} = await params;

    if (!patientId) {
        return Response.json(
            {success: false, message: 'Patient ID is required'},
            {status: 400}
        );
    }

    if (!foodId) {
        return Response.json(
            {success: false, message: 'Food ID is required'},
            {status: 400}
        );
    }

    const result = await deletePatientFoodDislike(patientId, foodId);

    return Response.json(result, {status: result.success ? 200 : 400});
}
