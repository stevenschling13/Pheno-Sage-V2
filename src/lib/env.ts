import { z } from 'zod';

const ClientEnvSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  VITE_FIREBASE_APP_ID: z.string().min(1),
  VITE_FIREBASE_DATABASE_ID: z.string().optional(),
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;

export const clientEnv: ClientEnv = (() => {
  const parsed = ClientEnvSchema.safeParse(import.meta.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Missing or invalid Firebase client env vars:\n${issues}\n\nCopy .env.example to .env.local and fill in values.`,
    );
  }
  return parsed.data;
})();
