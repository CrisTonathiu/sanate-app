import {summarizeTranscript} from '@/lib/services/ai/summarize-transcript';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const transcript = body?.transcript as string | undefined;

        if (!transcript?.trim()) {
            return Response.json(
                {success: false, message: 'La transcripción es requerida'},
                {status: 400}
            );
        }

        const summary = await summarizeTranscript(transcript);

        return Response.json(
            {
                success: true,
                message: 'Resumen generado correctamente',
                data: {summary}
            },
            {status: 200}
        );
    } catch (error) {
        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'Error al generar el resumen'
            },
            {status: 500}
        );
    }
}
