import {requireRole} from '@/lib/auth/requireRole';
import {generateProtocolPlanForPatient} from '@/lib/services/protocol/protocol-generation.service';
import {generateProtocolPlanSchema} from '@/lib/validations/protocol-generation.schema';
import {ZodError} from 'zod';

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
        const validatedInput = generateProtocolPlanSchema.parse(body);

        const result = await generateProtocolPlanForPatient(
            patientId,
            validatedInput
        );

        return Response.json(result, {status: result.success ? 200 : 400});
    } catch (error) {
        if (error instanceof ZodError) {
            return Response.json(
                {
                    success: false,
                    message: 'Error de validación',
                    errors: error.flatten()
                },
                {status: 400}
            );
        }

        return Response.json(
            {
                success: false,
                message: 'Error al generar protocolo',
                error:
                    error instanceof Error ? error.message : 'Error desconocido'
            },
            {status: 500}
        );
    }
}
