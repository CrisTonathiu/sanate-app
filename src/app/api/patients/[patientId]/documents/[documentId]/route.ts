import {prisma} from '@/lib/prisma';

export async function DELETE(
    _request: Request,
    {params}: {params: Promise<{patientId: string; documentId: string}>}
) {
    const {patientId, documentId} = await params;

    if (!patientId) {
        return Response.json(
            {success: false, message: 'Patient ID is required'},
            {status: 400}
        );
    }

    if (!documentId) {
        return Response.json(
            {success: false, message: 'Document ID is required'},
            {status: 400}
        );
    }

    try {
        const deleted = await prisma.patientDocument.deleteMany({
            where: {
                id: documentId,
                patientId
            }
        });

        if (deleted.count === 0) {
            return Response.json(
                {success: false, message: 'Documento no encontrado'},
                {status: 404}
            );
        }

        return Response.json(
            {
                success: true,
                message: 'Documento eliminado correctamente'
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
