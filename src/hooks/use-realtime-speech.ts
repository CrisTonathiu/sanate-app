'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

function getSpeechRecognitionConstructor():
    | (new () => SpeechRecognition)
    | null {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useRealtimeSpeech() {
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(true);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const shouldListenRef = useRef(false);
    const finalTranscriptRef = useRef('');

    const stop = useCallback(() => {
        shouldListenRef.current = false;
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setIsListening(false);
        setInterimTranscript('');
    }, []);

    const reset = useCallback(() => {
        stop();
        finalTranscriptRef.current = '';
        setTranscript('');
        setInterimTranscript('');
        setError(null);
    }, [stop]);

    const start = useCallback(() => {
        const SpeechRecognitionCtor = getSpeechRecognitionConstructor();

        if (!SpeechRecognitionCtor) {
            setIsSupported(false);
            setError(
                'Tu navegador no soporta transcripción en tiempo real. Usaremos OpenAI al finalizar la grabación.'
            );
            return;
        }

        setIsSupported(true);
        setError(null);
        finalTranscriptRef.current = '';
        setTranscript('');
        setInterimTranscript('');
        shouldListenRef.current = true;

        const startRecognition = () => {
            if (!shouldListenRef.current) return;

            const recognition = new SpeechRecognitionCtor();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'es-MX';
            recognition.maxAlternatives = 1;

            recognition.onresult = event => {
                let interim = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    const text = result[0]?.transcript ?? '';

                    if (result.isFinal) {
                        finalTranscriptRef.current = `${finalTranscriptRef.current}${text} `.trimStart();
                        if (!finalTranscriptRef.current.endsWith(' ')) {
                            finalTranscriptRef.current += ' ';
                        }
                        setTranscript(finalTranscriptRef.current.trim());
                    } else {
                        interim += text;
                    }
                }

                setInterimTranscript(interim);
            };

            recognition.onerror = event => {
                if (event.error === 'aborted' || event.error === 'no-speech') {
                    return;
                }

                if (event.error === 'not-allowed') {
                    setError(
                        'Permiso de micrófono denegado para transcripción en tiempo real.'
                    );
                    shouldListenRef.current = false;
                }
            };

            recognition.onend = () => {
                setIsListening(false);
                if (shouldListenRef.current) {
                    startRecognition();
                }
            };

            recognitionRef.current = recognition;

            try {
                recognition.start();
                setIsListening(true);
            } catch {
                shouldListenRef.current = false;
                setIsListening(false);
            }
        };

        startRecognition();
    }, []);

    useEffect(() => {
        return () => {
            shouldListenRef.current = false;
            recognitionRef.current?.abort();
        };
    }, []);

    const liveTranscript = [transcript, interimTranscript]
        .filter(Boolean)
        .join(transcript && interimTranscript ? ' ' : '')
        .trim();

    return {
        transcript,
        interimTranscript,
        liveTranscript,
        isListening,
        isSupported,
        error,
        start,
        stop,
        reset
    };
}
