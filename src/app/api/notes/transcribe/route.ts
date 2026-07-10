import {transcribeAndSummarizeAudio} from '@/lib/services/ai/transcribe-and-summarize';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const audio = formData.get('audio');

        if (!(audio instanceof File) || audio.size === 0) {
            return Response.json(
                {success: false, message: 'El archivo de audio es requerido'},
                {status: 400}
            );
        }

        const buffer = Buffer.from(await audio.arrayBuffer());
        const mimeType = audio.type || 'audio/webm';

        const result = await transcribeAndSummarizeAudio(buffer, mimeType);

        return Response.json(
            {
                success: true,
                message: 'Audio procesado correctamente',
                data: result
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
                        : 'Error al procesar el audio'
            },
            {status: 500}
        );
    }
}
