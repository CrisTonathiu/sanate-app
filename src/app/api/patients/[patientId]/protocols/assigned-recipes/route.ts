import {requireRole} from '@/lib/auth/requireRole';
import {listPreviouslyAssignedRecipeIdsForPatient} from '@/lib/services/protocol/protocol-week-plan.service';

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

    try {
        const recipeIds =
            await listPreviouslyAssignedRecipeIdsForPatient(patientId);

        return Response.json(
            {
                success: true,
                message: 'Recetas asignadas anteriormente obtenidas correctamente',
                data: recipeIds
            },
            {status: 200}
        );
    } catch (error) {
        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : 'Error desconocido'
            },
            {status: 500}
        );
    }
}
