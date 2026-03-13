import {requireRole} from '@/lib/auth/requireRole';
import {createConsultation} from '@/lib/services/consultation/consultation.service';

export async function POST(request: Request) {
    const currentUser = await requireRole('ADMIN');
    const body = await request.json();
    const result = await createConsultation({
        patientId: body.patientId,
        nutritionistId: currentUser.id,
        reason: body.reason,
        diagnosis: body.diagnosis,
        notes: body.notes,
        followUpAt: body.followUpAt
    });
    return Response.json(result, {status: result.success ? 200 : 400});
}
