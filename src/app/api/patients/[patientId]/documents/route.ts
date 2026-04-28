import {requireRole} from '@/lib/auth/requireRole';
import {prisma} from '@/lib/prisma';

type DocumentPayload = {
    name: string;
    type: 'pdf' | 'image';
    size: number; // in bytes
    storagePath: string;
    publicUrl?: string;
};

export async function GET(
    _request: Request,
    {params}: {params: Promise<{patientId: string}>}
) {
    const {patientId} = await params;

    if (!patientId) {
        return Response.json(
            {success: false, message: 'Patient ID is required'},
            {status: 400}
        );
    }

    try {
        // await requireRole('ADMIN');

        const documents = await prisma.patientDocument.findMany({
            where: {patientId},
            orderBy: {uploadedAt: 'desc'}
        });

        return Response.json(
            {
                success: true,
                message: 'Documentos obtenidos correctamente',
                data: documents
            },
            {status: 200}
        );
    } catch (error) {
        const status =
            error instanceof Error && error.message === 'Forbidden'
                ? 403
                : error instanceof Error && error.message === 'Unauthorized'
                  ? 401
                  : 500;

        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : 'Error desconocido'
            },
            {status}
        );
    }
}

export async function POST(
    request: Request,
    {params}: {params: Promise<{patientId: string}>}
) {
    const {patientId} = await params;

    if (!patientId) {
        return Response.json(
            {success: false, message: 'Patient ID is required'},
            {status: 400}
        );
    }

    try {
        // await requireRole('ADMIN');

        const body = await request.json();
        const documentData = body as DocumentPayload;

        // Validate required fields
        if (!documentData.name || typeof documentData.name !== 'string') {
            return Response.json(
                {
                    success: false,
                    message: 'El nombre del documento es requerido'
                },
                {status: 400}
            );
        }

        if (
            !documentData.type ||
            !['pdf', 'image'].includes(documentData.type)
        ) {
            return Response.json(
                {
                    success: false,
                    message: 'El tipo de documento debe ser "pdf" o "image"'
                },
                {status: 400}
            );
        }

        if (
            !documentData.size ||
            typeof documentData.size !== 'number' ||
            documentData.size <= 0
        ) {
            return Response.json(
                {
                    success: false,
                    message:
                        'El tamaño del documento debe ser un número positivo'
                },
                {status: 400}
            );
        }

        if (
            !documentData.storagePath ||
            typeof documentData.storagePath !== 'string'
        ) {
            return Response.json(
                {
                    success: false,
                    message: 'La ruta de almacenamiento es requerida'
                },
                {status: 400}
            );
        }

        // Verify patient exists
        const patient = await prisma.patient.findUnique({
            where: {id: patientId}
        });

        if (!patient) {
            return Response.json(
                {
                    success: false,
                    message: 'Paciente no encontrado'
                },
                {status: 404}
            );
        }

        // Create the document record
        const document = await prisma.patientDocument.create({
            data: {
                patientId,
                name: documentData.name.trim(),
                type: documentData.type,
                size: documentData.size,
                storagePath: documentData.storagePath,
                publicUrl: documentData.publicUrl || null
            }
        });

        return Response.json(
            {
                success: true,
                message: 'Documento guardado correctamente',
                data: document
            },
            {status: 201}
        );
    } catch (error) {
        const status =
            error instanceof Error && error.message === 'Forbidden'
                ? 403
                : error instanceof Error && error.message === 'Unauthorized'
                  ? 401
                  : 500;

        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error ? error.message : 'Error desconocido'
            },
            {status}
        );
    }
}
