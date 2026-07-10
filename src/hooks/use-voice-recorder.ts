'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

type RecorderStatus = 'idle' | 'recording' | 'stopped';

export function useVoiceRecorder() {
    const [status, setStatus] = useState<RecorderStatus>('idle');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const cleanupStream = useCallback(() => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }, []);

    const startRecording = useCallback(async () => {
        setError(null);
        setAudioBlob(null);
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });
            streamRef.current = stream;

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                  ? 'audio/webm'
                  : 'audio/mp4';

            const recorder = new MediaRecorder(stream, {mimeType});
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {type: mimeType});
                setAudioBlob(blob);
                setStatus('stopped');
                cleanupStream();
            };

            recorder.start(250);
            setStatus('recording');
        } catch {
            cleanupStream();
            setError(
                'No se pudo acceder al micrófono. Verifica los permisos del navegador.'
            );
            setStatus('idle');
        }
    }, [cleanupStream]);

    const stopRecording = useCallback(() => {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
        }
    }, []);

    const resetRecording = useCallback(() => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== 'inactive'
        ) {
            mediaRecorderRef.current.stop();
        }
        cleanupStream();
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        setAudioBlob(null);
        setStatus('idle');
        setError(null);
    }, [cleanupStream]);

    useEffect(() => {
        return () => {
            if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state !== 'inactive'
            ) {
                mediaRecorderRef.current.stop();
            }
            cleanupStream();
        };
    }, [cleanupStream]);

    return {
        status,
        isRecording: status === 'recording',
        audioBlob,
        error,
        startRecording,
        stopRecording,
        resetRecording
    };
}
