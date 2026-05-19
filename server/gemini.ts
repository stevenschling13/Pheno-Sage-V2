import { GoogleGenAI } from '@google/genai';
import type { ServerEnv } from './env';

export function createGeminiClient(env: ServerEnv): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });
}

export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function classifyGeminiError(err: unknown): { status: number; message: string } {
  const message = err instanceof Error ? err.message : 'Unknown error';
  const status = (err as { status?: number })?.status;

  if (status === 429 || /429|RESOURCE_EXHAUSTED/i.test(message)) {
    return {
      status: 429,
      message:
        'RATE LIMIT EXCEEDED. The analysis engine quota has been reached. Please wait and try again shortly.',
    };
  }
  if (status === 400 || /INVALID_ARGUMENT/i.test(message)) {
    return { status: 400, message: 'The model rejected the request.' };
  }
  if (/timed out/i.test(message)) {
    return { status: 504, message };
  }
  return { status: 502, message: 'Upstream model error.' };
}
