import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {loadProtocolPlanMenuForUser} from '@/lib/services/patient/patient-plan-menu.service';

export async function GET() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return Response.json(
            {success: false, message: 'Unauthorized'},
            {status: 401}
        );
    }

    if (currentUser.role !== 'PATIENT') {
        return Response.json(
            {success: false, message: 'Forbidden'},
            {status: 403}
        );
    }

    const menu = await loadProtocolPlanMenuForUser(currentUser.id);

    return Response.json({success: true, menu});
}
