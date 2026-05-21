import OpenAI from 'openai';

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
}

const globalForOpenAI = global as unknown as {
    openai: OpenAI;
};

export const openai =
    globalForOpenAI.openai ??
    new OpenAI({
        apiKey: openaiApiKey
    });

if (process.env.NODE_ENV !== 'production') {
    globalForOpenAI.openai = openai;
}

export const OPENAI_MODEL = 'gpt-5-nano' as const;
