import {openai} from '@/lib/config/openai';

const SUMMARY_MODEL =
    process.env.OPENAI_NOTE_SUMMARY_MODEL?.trim() || 'gpt-4o-mini';

export async function summarizeTranscript(transcript: string): Promise<string> {
    const trimmed = transcript.trim();

    if (!trimmed) {
        throw new Error('La transcripción está vacía.');
    }

    const summaryResponse = await openai.chat.completions.create({
        model: SUMMARY_MODEL,
        temperature: 0.3,
        messages: [
            {
                role: 'system',
                content:
                    'Eres un asistente clínico nutricional. Resume la transcripción de una consulta o nota de voz en español. Devuelve un resumen claro, estructurado y conciso con los puntos clave: motivo, antecedentes relevantes, hallazgos, recomendaciones y seguimiento si aplica. Usa viñetas cuando sea útil.'
            },
            {
                role: 'user',
                content: `Transcripción:\n\n${trimmed}`
            }
        ]
    });

    return (
        summaryResponse.choices[0]?.message?.content?.trim() ??
        'No se pudo generar el resumen.'
    );
}
