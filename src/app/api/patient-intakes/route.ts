import {requireRole} from '@/lib/auth/requireRole';
import {getPendingPatientIntakes} from '@/lib/services/patient/patient-intake.service';

export async function GET() {
    await requireRole('ADMIN');
    const result = await getPendingPatientIntakes();
    return Response.json(result, {status: result.success ? 200 : 400});
}
