import {requireRole} from '@/lib/auth/requireRole';
import {
    createPatientProtocol,
    getActiveProtocolForPatient,
    getDraftProtocolForPatient,
    saveProtocolDraft,
    updatePatientProtocol,
    type ProtocolDraftSnapshot,
    type WeekPlanPayload
} from '@/lib/services/protocol/protocol-week-plan.service';
import {affiliateLinkSchema} from '@/lib/validations/protocol-template.schema';
import {Prisma, ProtocolStatus} from '@prisma/client';
import {z} from 'zod';

function parseOptionalRecommendationText(
    value: unknown
): string | null | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function parseProtocolBody(body: unknown) {
    const payload = body as Record<string, unknown>;
    const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
    const weekCount =
        typeof payload?.weekCount === 'number' && payload.weekCount > 0
            ? Math.floor(payload.weekCount)
            : 1;
    const status =
        payload?.status === 'DRAFT' ||
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
    const draftSnapshot =
        payload?.draftSnapshot && typeof payload.draftSnapshot === 'object'
            ? (payload.draftSnapshot as ProtocolDraftSnapshot)
            : null;

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
        draftSnapshot,
        affiliateLinksResult,
        generalRecommendations: parseOptionalRecommendationText(
            payload?.generalRecommendations
        ),
        tips: parseOptionalRecommendationText(payload?.tips),
        hydrationRecommendations: parseOptionalRecommendationText(
            payload?.hydrationRecommendations
        ),
        supplementRecommendations: parseOptionalRecommendationText(
            payload?.supplementRecommendations
        )
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

    const [activeProtocol, draftProtocol] = await Promise.all([
        getActiveProtocolForPatient(patientId),
        getDraftProtocolForPatient(patientId)
    ]);

    return Response.json(
        {
            success: true,
            data: {
                protocolId: activeProtocol?.protocolId ?? null,
                title: activeProtocol?.title ?? null,
                weekCount: activeProtocol?.weekCount ?? 1,
                createdAt: activeProtocol?.createdAt ?? null,
                weekPlan: activeProtocol?.weekPlan ?? [],
                generalRecommendations:
                    activeProtocol?.generalRecommendations ?? null,
                tips: activeProtocol?.tips ?? null,
                hydrationRecommendations:
                    activeProtocol?.hydrationRecommendations ?? null,
                supplementRecommendations:
                    activeProtocol?.supplementRecommendations ?? null,
                draft: draftProtocol
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
            status,
            weekPlan,
            protocolId,
            draftSnapshot,
            affiliateLinksResult,
            generalRecommendations,
            tips,
            hydrationRecommendations,
            supplementRecommendations
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

        const recommendations = {
            generalRecommendations,
            tips,
            hydrationRecommendations,
            supplementRecommendations
        };

        if (status === 'DRAFT') {
            if (!draftSnapshot) {
                return Response.json(
                    {
                        success: false,
                        message: 'El borrador del protocolo es requerido'
                    },
                    {status: 400}
                );
            }

            const savedDraft = await saveProtocolDraft({
                patientId,
                protocolId,
                title: title || 'Borrador de protocolo',
                weekCount,
                draftSnapshot,
                affiliateLinks,
                ...recommendations
            });

            return Response.json(
                {
                    success: true,
                    message: 'Borrador guardado correctamente',
                    data: savedDraft
                },
                {status: 200}
            );
        }

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

        const existingDraft = protocolId
            ? await getDraftProtocolForPatient(patientId)
            : null;
        const shouldPromoteDraft =
            Boolean(protocolId) &&
            existingDraft?.protocolId === protocolId;

        const saved = shouldPromoteDraft
            ? await updatePatientProtocol({
                  protocolId: protocolId!,
                  title,
                  weekCount,
                  weekPlan,
                  affiliateLinks,
                  promoteFromDraft: true,
                  ...recommendations
              })
            : protocolId
              ? await updatePatientProtocol({
                    protocolId,
                    title,
                    weekCount,
                    weekPlan,
                    affiliateLinks,
                    ...recommendations
                })
              : await createPatientProtocol({
                    patientId,
                    title,
                    weekCount,
                    weekPlan,
                    affiliateLinks,
                    ...recommendations
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
            status,
            weekPlan,
            protocolId,
            draftSnapshot,
            affiliateLinksResult,
            generalRecommendations,
            tips,
            hydrationRecommendations,
            supplementRecommendations
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

        const recommendations = {
            generalRecommendations,
            tips,
            hydrationRecommendations,
            supplementRecommendations
        };

        if (status === 'DRAFT') {
            if (!draftSnapshot) {
                return Response.json(
                    {
                        success: false,
                        message: 'El borrador del protocolo es requerido'
                    },
                    {status: 400}
                );
            }

            const savedDraft = await saveProtocolDraft({
                patientId,
                protocolId,
                title: title || 'Borrador de protocolo',
                weekCount,
                draftSnapshot,
                affiliateLinks,
                ...recommendations
            });

            return Response.json(
                {
                    success: true,
                    message: 'Borrador guardado correctamente',
                    data: savedDraft
                },
                {status: 200}
            );
        }

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
        let promoteFromDraft = false;

        if (targetProtocolId) {
            const draft = await getDraftProtocolForPatient(patientId);
            promoteFromDraft = draft?.protocolId === targetProtocolId;
        }

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
            affiliateLinks,
            promoteFromDraft,
            generalRecommendations,
            tips,
            hydrationRecommendations,
            supplementRecommendations
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
