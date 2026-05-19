import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { loadServerEnv } from './server/env';
import { initFirebaseAdmin } from './server/firebaseAdmin';
import { requireAuth, type AuthedRequest } from './server/auth';
import { classifyGeminiError, createGeminiClient, withTimeout } from './server/gemini';
import {
  AnalyzePlantRequestSchema,
  CopilotRequestSchema,
  OrchestratorRequestSchema,
  analyzePlantResponseSchema,
  copilotResponseSchema,
  orchestratorResponseSchema,
} from './server/schemas';

const env = loadServerEnv();
initFirebaseAdmin(env);
const ai = createGeminiClient(env);

const app = express();

const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as AuthedRequest).userId ?? req.ip ?? 'anonymous',
  message: { error: 'Rate limit exceeded. Please wait and try again.' },
});

function validate<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
}

async function callGemini<T>(
  label: string,
  payload: Parameters<typeof ai.models.generateContent>[0],
): Promise<T> {
  const response = await withTimeout(
    ai.models.generateContent(payload),
    env.GEMINI_REQUEST_TIMEOUT_MS,
    label,
  );
  const text = response.text;
  if (!text) throw new Error(`${label}: empty model response`);
  return JSON.parse(text) as T;
}

const api = express.Router();
api.use(express.json({ limit: '50mb' }));
api.use(requireAuth);
api.use(apiLimiter);

api.post(
  '/analyze-plant',
  validate(AnalyzePlantRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { mediaBase64, mimeType } = req.body as z.infer<typeof AnalyzePlantRequestSchema>;

      const imagePart = { inlineData: { mimeType, data: mediaBase64 } };
      const textPart = {
        text: `You are a professional cannabis cultivation AI operating system.
Analyze the provided plant media and provide a structured JSON response.
Do not fabricate a confident diagnosis from poor media.
If the media quality is inadequate for analysis (e.g., blurry, out of focus, poor lighting/too dark, camera too far away, or plant is obstructed), set 'isFallback' to true.
Provide a specific, detailed, and user-friendly 'fallbackReason' describing exactly why the media cannot be analyzed and MUST include a clear suggestion on how to improve the media for re-analysis (e.g. "The image is too blurry to identify leaf details. Please try taking another photo in a brighter area with the camera held steady and closer to the affected leaves.", "The lighting is too dim to accurately assess color. Please turn on grow lights or use the flash and take another photo.").`,
      };

      const result = await callGemini('analyze-plant', {
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: analyzePlantResponseSchema,
        },
      });
      res.json(result);
    } catch (err) {
      console.error('analyze-plant error:', err);
      const { status, message } = classifyGeminiError(err);
      res.status(status).json({ error: message });
    }
  },
);

api.post(
  '/orchestrator',
  validate(OrchestratorRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { input, mediaBase64, mimeType } = req.body as z.infer<
        typeof OrchestratorRequestSchema
      >;

      const parts: Array<Record<string, unknown>> = [];
      if (mediaBase64 && mimeType) {
        parts.push({ inlineData: { mimeType, data: mediaBase64 } });
      }
      parts.push({
        text: `You are the Master Orchestrator in a MAS (Multi-Agent System) for a cannabis cultivation OS (PhenoSage).
The user input must be parsed and routed to one of five simulated sub-agents:
- Botanist (Diagnostic/Visual/Plant Health/Nutrients/Video Walkthroughs)
- Scheduler (Tasks/Timelines/Watering Schedules)
- Environment (Setup/Telemetry/Sensors/Climate/Starting Grows/OCR)
- Geneticist (Clones/Pheno-hunting/Harvests/Lineage)
- Compiler (Ledger Export/Journal Generation/Reports)

Based on the intent, you must return a "component trigger" to render a specific React component via a Generative UI pattern.

If the user wants to start a new grow, provision space, or configure physical constraints (Environment agent), return a GROW_SETUP component trigger, extracting entities like strain, medium, tent_size, quantity.
If the user asks for a briefing, status, morning summary, plant health diagnostic, climate data update, or general daily update (Botanist or Environment agent), return a MORNING_BRIEFING component trigger.
If the user provides an image containing a physical sensor reading (like a digital thermometer/hygrometer that shows Temp/Humidity), the Environment Agent must perform OCR.
Return an 'OCR_CAPTURE' component trigger, extracting the 'temperature' and 'humidity' from the image, and setting 'status' to 'pending_approval'.
If the user provides a video walkthrough of their grow tent (even as a still image mimicking a video), the Botanist Agent must simulate keyframe extraction. Return a 'WALKTHROUGH_REPORT' component trigger. In the report, you must identify specific plants, note visual anomalies (e.g., "Plant 1: Leaf curling detected", "Plant 2: Optimal"), and provide an overall health summary.
If the user mentions taking clones, tracking lineage, or noting specific phenotypic traits for propagation (Geneticist Agent), return a 'PHENOTYPE_LINEAGE' component trigger. Extract the mother plant traits, the number of clones, and reasons for cloning.
If the user mentions harvesting, curing, or fetching yield forecasts (Geneticist Agent), return a 'HARVEST_FORECAST' component trigger. Evaluate the plant's history and generate a Pheno-Score (S, A, B, C) and a yield estimate.
If the user asks to generate a full report, export a journal, compile a run, or print the ledger (Compiler Agent), return a 'LEDGER_EXPORT' component trigger. Set preview_title, run_id, and date_range.
If it doesn't clearly match any above, default to a MORNING_BRIEFING with relevant observations.

User Input: "${input ?? 'Analyze the provided media.'}"`,
      });

      const result = await callGemini('orchestrator', {
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: orchestratorResponseSchema,
        },
      });
      res.json(result);
    } catch (err) {
      console.error('orchestrator error:', err);
      const { status, message } = classifyGeminiError(err);
      res.status(status).json({ error: message });
    }
  },
);

interface HistoryBucket {
  count: number;
  vpd: number;
  temp: number;
  ec: number;
  notes: string[];
}

api.post('/copilot', validate(CopilotRequestSchema), async (req: Request, res: Response) => {
  try {
    const { input, history } = req.body as z.infer<typeof CopilotRequestSchema>;

    let aggregatedHistory: unknown = history;
    if (Array.isArray(history) && history.length > 0) {
      const buckets = new Map<string | number, HistoryBucket>();
      for (const entry of history) {
        const time = entry.timestamp ? new Date(entry.timestamp).getTime() : 0;
        const bucketKey: string | number =
          time > 0
            ? Math.floor(time / (4 * 60 * 60 * 1000)) * (4 * 60 * 60 * 1000)
            : (entry.date ?? 'unknown');

        let bucket = buckets.get(bucketKey);
        if (!bucket) {
          bucket = { count: 0, vpd: 0, temp: 0, ec: 0, notes: [] };
          buckets.set(bucketKey, bucket);
        }
        bucket.count += 1;
        if (entry.vpd) bucket.vpd += entry.vpd;
        const temp = entry.temp ?? entry.temperature;
        if (temp) bucket.temp += temp;
        if (entry.ec) bucket.ec += entry.ec;
        if (entry.notes) bucket.notes.push(entry.notes);
      }

      aggregatedHistory = Array.from(buckets.entries()).map(([key, bucket]) => ({
        time: typeof key === 'number' ? new Date(key).toISOString() : key,
        avg_vpd:
          bucket.count && bucket.vpd ? Number((bucket.vpd / bucket.count).toFixed(2)) : undefined,
        avg_temp:
          bucket.count && bucket.temp ? Number((bucket.temp / bucket.count).toFixed(2)) : undefined,
        avg_ec:
          bucket.count && bucket.ec ? Number((bucket.ec / bucket.count).toFixed(2)) : undefined,
        events: bucket.notes.length > 0 ? bucket.notes.join('; ') : undefined,
      }));
    }

    const textPart = {
      text: `You are a 'Predictive Analysis Ledger' in a cannabis cultivation OS (PhenoSage).
The user is providing an input or manual override (e.g., "increase humidity to 70%", or "feeding nutrient X at 5ml/gal").
You are provided with the following longitudinal history data for the current batch (aggregated in 4-hour blocks):
${JSON.stringify(aggregatedHistory, null, 2)}

Your directive:
Analyze the user's intent against the historical data.
If the user's input contradicts the historical trend, could cause an issue based on the trends, or violates standard optimize protocols given the history (e.g. they want to raise humdity but history shows signs of PM or already high humidity), you MUST issue a "CRITICAL CORRECTION".
If the input is safe and aligns with the data, issue a "LEDGER_ENTRY" confirming the predictive outcome.

Output your response as JSON:`,
    };

    const result = await callGemini('copilot', {
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: copilotResponseSchema,
      },
    });
    res.json(result);
  } catch (err) {
    console.error('copilot error:', err);
    const { status, message } = classifyGeminiError(err);
    res.status(status).json({ error: message });
  }
});

app.use('/api', api);

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

async function startServer(): Promise<void> {
  if (env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
