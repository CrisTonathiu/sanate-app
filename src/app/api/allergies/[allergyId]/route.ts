import {requireRole} from '@/lib/auth/requireRole';
import {
    updateAllergy,
    deleteAllergy
} from '@/lib/services/allergy/allergy.service';

export async function PUT(
    request: Request,
    {params}: {params: Promise<{allergyId: string}>}
) {
    await requireRole('ADMIN');
    const {allergyId} = await params;
    if (!allergyId) {
        return Response.json(
            {success: false, message: 'Allergy ID is required'},
            {status: 400}
        );
    }

    try {
        const body = await request.json();
        const result = await updateAllergy({
            id: allergyId,
            name: body.name,
            description: body.description
        });
        return Response.json(result, {status: result.success ? 200 : 400});
    } catch (error) {
        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'An error occurred while updating the allergy'
            },
            {status: 500}
        );
    }
}

export async function DELETE(
    _request: Request,
    {params}: {params: Promise<{allergyId: string}>}
) {
    await requireRole('ADMIN');
    const {allergyId} = await params;
    if (!allergyId) {
        return Response.json(
            {success: false, message: 'Allergy ID is required'},
            {status: 400}
        );
    }
    const result = await deleteAllergy(allergyId);
    return Response.json(result, {status: result.success ? 200 : 400});
}
