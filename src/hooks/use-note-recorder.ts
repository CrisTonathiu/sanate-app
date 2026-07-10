'use client';

import {useCallback} from 'react';
import {useRealtimeSpeech} from '@/hooks/use-realtime-speech';
import {useVoiceRecorder} from '@/hooks/use-voice-recorder';

export function useNoteRecorder() {
    const voiceRecorder = useVoiceRecorder();
    const realtimeSpeech = useRealtimeSpeech();

    const startRecording = useCallback(async () => {
        realtimeSpeech.reset();
        realtimeSpeech.start();
        await voiceRecorder.startRecording();
    }, [realtimeSpeech, voiceRecorder]);

    const stopRecording = useCallback(() => {
        voiceRecorder.stopRecording();
        realtimeSpeech.stop();
    }, [realtimeSpeech, voiceRecorder]);

    const resetRecording = useCallback(() => {
        voiceRecorder.resetRecording();
        realtimeSpeech.reset();
    }, [realtimeSpeech, voiceRecorder]);

    return {
        status: voiceRecorder.status,
        isRecording: voiceRecorder.isRecording,
        audioBlob: voiceRecorder.audioBlob,
        recorderError: voiceRecorder.error,
        transcript: realtimeSpeech.transcript,
        liveTranscript: realtimeSpeech.liveTranscript,
        interimTranscript: realtimeSpeech.interimTranscript,
        isListening: realtimeSpeech.isListening,
        speechSupported: realtimeSpeech.isSupported,
        speechError: realtimeSpeech.error,
        startRecording,
        stopRecording,
        resetRecording
    };
}
