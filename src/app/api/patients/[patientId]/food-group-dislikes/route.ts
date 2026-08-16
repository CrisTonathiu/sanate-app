import {requireRole} from '@/lib/auth/requireRole';
import {
    createPatientFoodGroupDislike,
    getPatientFoodGroupDislikes
} from '@/lib/services/patient/patient-food-group-dislike.service';

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

    const result = await getPatientFoodGroupDislikes(patientId);

    return Response.json(result, {status: result.success ? 200 : 400});
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
        const result = await createPatientFoodGroupDislike({
            patientId,
            groupId: body.groupId,
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
                        : 'An error occurred while adding the food group dislike'
            },
            {status: 500}
        );
    }
}
