import {requireRole} from '@/lib/auth/requireRole';
import {
    createPatientProtocol,
    getActiveProtocolForPatient,
    updatePatientProtocol,
    type WeekPlanPayload
} from '@/lib/services/protocol/protocol-week-plan.service';
import {affiliateLinkSchema} from '@/lib/validations/protocol-template.schema';
import {Prisma, ProtocolStatus} from '@prisma/client';
import {z} from 'zod';

function parseProtocolBody(body: unknown) {
    const payload = body as Record<string, unknown>;
    const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
    const weekCount =
        typeof payload?.weekCount === 'number' && payload.weekCount > 0
            ? Math.floor(payload.weekCount)
            : 1;
    const status =
        payload?.status === 'ACTIVE' ||
        payload?.status === 'COMPLETED' ||
        payload?.status === 'ARCHIVED'
            ? (payload.status as ProtocolStatus)
            : 'ACTIVE';
    const weekPlan = Array.isArray(payload?.weekPlan)
        ? (payload.weekPlan as WeekPlanPayload)
        : [];
    const protocolId =
        typeof payload?.protocolId === 'string' ? payload.protocolId : undefined;

    const affiliateLinksResult = z
        .array(affiliateLinkSchema)
        .optional()
        .safeParse(payload?.affiliateLinks);

    return {
        title,
        weekCount,
        status,
        weekPlan,
        protocolId,
        affiliateLinksResult
    };
}

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

    const activeProtocol = await getActiveProtocolForPatient(patientId);

    return Response.json(
        {
            success: true,
            data: {
                protocolId: activeProtocol?.protocolId ?? null,
                title: activeProtocol?.title ?? null,
                weekPlan: activeProtocol?.weekPlan ?? []
            }
        },
        {status: 200}
    );
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
        const {
            title,
            weekCount,
            weekPlan,
            protocolId,
            affiliateLinksResult
        } = parseProtocolBody(body);

        if (!affiliateLinksResult.success) {
            return Response.json(
                {
                    success: false,
                    message: 'Enlaces de afiliado no válidos',
                    errors: affiliateLinksResult.error.flatten()
                },
                {status: 400}
            );
        }

        const affiliateLinks = affiliateLinksResult.data?.length
            ? (affiliateLinksResult.data as Prisma.InputJsonValue)
            : undefined;

        if (title.length < 3) {
            return Response.json(
                {
                    success: false,
                    message:
                        'El nombre del protocolo debe tener al menos 3 caracteres'
                },
                {status: 400}
            );
        }

        if (weekPlan.length === 0) {
            return Response.json(
                {
                    success: false,
                    message: 'El plan semanal no puede estar vacío'
                },
                {status: 400}
            );
        }

        const saved = protocolId
            ? await updatePatientProtocol({
                  protocolId,
                  title,
                  weekCount,
                  weekPlan,
                  affiliateLinks
              })
            : await createPatientProtocol({
                  patientId,
                  title,
                  weekCount,
                  weekPlan,
                  affiliateLinks
              });

        return Response.json(
            {
                success: true,
                message: protocolId
                    ? 'Protocolo actualizado correctamente'
                    : 'Protocolo generado correctamente',
                data: saved
            },
            {status: 200}
        );
    } catch (error) {
        return Response.json(
            {
                success: false,
                message: 'No se pudo guardar el protocolo',
                error:
                    error instanceof Error ? error.message : 'Error desconocido'
            },
            {status: 500}
        );
    }
}

export async function PUT(
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
        const {
            title,
            weekCount,
            weekPlan,
            protocolId,
            affiliateLinksResult
        } = parseProtocolBody(body);

        if (!affiliateLinksResult.success) {
            return Response.json(
                {
                    success: false,
                    message: 'Enlaces de afiliado no válidos',
                    errors: affiliateLinksResult.error.flatten()
                },
                {status: 400}
            );
        }

        const affiliateLinks = affiliateLinksResult.data?.length
            ? (affiliateLinksResult.data as Prisma.InputJsonValue)
            : undefined;

        if (title.length < 3) {
            return Response.json(
                {
                    success: false,
                    message:
                        'El nombre del protocolo debe tener al menos 3 caracteres'
                },
                {status: 400}
            );
        }

        if (weekPlan.length === 0) {
            return Response.json(
                {
                    success: false,
                    message: 'El plan semanal no puede estar vacío'
                },
                {status: 400}
            );
        }

        let targetProtocolId = protocolId;

        if (!targetProtocolId) {
            const activeProtocol = await getActiveProtocolForPatient(patientId);
            targetProtocolId = activeProtocol?.protocolId;
        }

        if (!targetProtocolId) {
            return Response.json(
                {
                    success: false,
                    message: 'No hay un protocolo activo para actualizar'
                },
                {status: 404}
            );
        }

        const saved = await updatePatientProtocol({
            protocolId: targetProtocolId,
            title,
            weekCount,
            weekPlan,
            affiliateLinks
        });

        return Response.json(
            {
                success: true,
                message: 'Protocolo actualizado correctamente',
                data: saved
            },
            {status: 200}
        );
    } catch (error) {
        return Response.json(
            {
                success: false,
                message: 'No se pudo actualizar el protocolo',
                error:
                    error instanceof Error ? error.message : 'Error desconocido'
            },
            {status: 500}
        );
    }
}
