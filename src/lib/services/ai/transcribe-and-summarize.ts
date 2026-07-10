import {openai} from '@/lib/config/openai';
import type {TranscribeNoteResult} from '@/lib/dto/PatientNoteDTO';
import {summarizeTranscript} from '@/lib/services/ai/summarize-transcript';

const TRANSCRIPTION_MODEL =
    process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || 'whisper-1';

export async function transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string
): Promise<string> {
    const extension = mimeType.includes('webm')
        ? 'webm'
        : mimeType.includes('mp4')
          ? 'mp4'
          : mimeType.includes('mpeg') || mimeType.includes('mp3')
            ? 'mp3'
            : mimeType.includes('wav')
              ? 'wav'
              : 'webm';

    const file = new File(
        [Uint8Array.from(audioBuffer)],
        `recording.${extension}`,
        {type: mimeType}
    );

    const transcription = await openai.audio.transcriptions.create({
        file,
        model: TRANSCRIPTION_MODEL,
        language: 'es'
    });

    const transcript = transcription.text?.trim() ?? '';

    if (!transcript) {
        throw new Error(
            'No se pudo transcribir el audio. Intenta grabar de nuevo.'
        );
    }

    return transcript;
}

export async function transcribeAndSummarizeAudio(
    audioBuffer: Buffer,
    mimeType: string
): Promise<TranscribeNoteResult> {
    const transcript = await transcribeAudio(audioBuffer, mimeType);
    const summary = await summarizeTranscript(transcript);

    return {transcript, summary};
}

export {summarizeTranscript};
