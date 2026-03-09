import {requireRole} from '@/lib/auth/requireRole';
import {getPatientConsultation} from '@/lib/services/consultation/consultation.service';

export async function GET(
    _request: Request,
    {params}: {params: Promise<{patientId: string}>}
) {
    await requireRole('ADMIN');
    const {patientId} = await params;
    const allergies = await getPatientConsultation(patientId);
    return Response.json(allergies, {status: allergies.success ? 200 : 400});
}
