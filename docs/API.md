# PhenoSage API

The Express server exposes three Gemini-backed endpoints under `/api`. All routes share the same middleware chain:

1. **JSON body parsing** (50 MB cap, intended for base64-encoded media)
2. **Auth** — `Authorization: Bearer <Firebase ID token>` is required. Tokens are verified server-side with the Firebase Admin SDK; the decoded `uid` is attached to the request.
3. **Rate limiting** — keyed by authenticated `uid` (falls back to IP). Defaults: 20 requests per 60s window. Tunable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`.
4. **Request validation** — Zod schemas reject malformed bodies with `400` and an `issues[]` array.

Upstream Gemini calls run under a configurable timeout (`GEMINI_REQUEST_TIMEOUT_MS`, default 45s) and errors are classified before being returned to the client.

## Error envelope

All errors share one shape:

```json
{
  "error": "human readable message",
  "issues": [
    /* zod issues, validation only */
  ]
}
```

| Status | Meaning                                                                                       |
| ------ | --------------------------------------------------------------------------------------------- |
| 400    | Request body failed Zod validation, or the model rejected the prompt (`INVALID_ARGUMENT`)     |
| 401    | Missing / malformed / expired ID token                                                        |
| 429    | Rate limit exceeded (express-rate-limit) **or** Gemini quota exhausted (`RESOURCE_EXHAUSTED`) |
| 502    | Upstream model error                                                                          |
| 504    | Gemini request exceeded `GEMINI_REQUEST_TIMEOUT_MS`                                           |

## `GET /healthz`

Unauthenticated liveness probe. Returns `{ "status": "ok" }`.

## `POST /api/analyze-plant`

Runs Gemini visual diagnosis on a single image or video frame.

**Request body**

```ts
{
  mediaBase64: string;  // base64 (no data: prefix)
  mimeType: string;     // image/* or video/*
  isVideo?: boolean;
}
```

**Response** — see `server/schemas.ts` (`analyzePlantResponseSchema`) for the full shape. Key fields:

```ts
{
  isFallback: boolean;          // true → bad media, fallbackReason explains
  fallbackReason?: string;
  overallHealthScore: number;   // 0..100
  confidenceScore: number;      // 0..1
  estimatedStage: string;
  stageConfidence: number;
  imageQuality: string;
  visualObservations: string[];
  diagnosticHypotheses: string[];
  findings: Array<{
    category: string;
    severity: string;
    confidence: number;
    title: string;
    recommendation: string;
  }>;
  recommendations: string[];
  suggestedTasks: string[];
  safetyCaveats: string;
}
```

## `POST /api/orchestrator`

Master Orchestrator. Routes a freeform user message (optionally with media) to one of five simulated sub-agents and returns a Generative-UI component trigger.

**Request body** — at least one of `input` or `mediaBase64` is required.

```ts
{
  input?: string;              // max 8000 chars
  mediaBase64?: string;
  mimeType?: string;           // required if mediaBase64 set
}
```

**Response** — discriminated by `component_type`:

```ts
{
  agent: 'Botanist' | 'Scheduler' | 'Environment' | 'Geneticist' | 'Compiler';
  component_type:
    | 'GROW_SETUP'
    | 'MORNING_BRIEFING'
    | 'OCR_CAPTURE'
    | 'WALKTHROUGH_REPORT'
    | 'PHENOTYPE_LINEAGE'
    | 'HARVEST_FORECAST'
    | 'LEDGER_EXPORT';
  setup_data?: { ... };        // populated for GROW_SETUP
  briefing_data?: { ... };
  ocr_data?: { ... };
  walkthrough_data?: { ... };
  lineage_data?: { ... };
  harvest_data?: { ... };
  export_data?: { ... };
}
```

See `server/schemas.ts` (`orchestratorResponseSchema`) for the per-component payload shape.

## `POST /api/copilot`

Predictive Analysis Ledger. Takes a user override / intent plus longitudinal history and returns either a critical correction or a safe ledger entry.

**Request body**

```ts
{
  input: string;                                 // 1..4000 chars
  history?: Array<{
    timestamp?: string | number;
    date?: string;
    vpd?: number;
    temp?: number;
    temperature?: number;
    ec?: number;
    notes?: string;
  }>;                                            // up to 2000 entries
}
```

Server aggregates history into 4-hour buckets before passing to Gemini.

**Response**

```ts
{
  type: 'CRITICAL_CORRECTION' | 'LEDGER_ENTRY' | 'PREDICTIVE_INSIGHT';
  title: string;
  message: string;
  metrics_impact: string[];   // e.g. ["VPD: +5%", "Temp: -2C"]
}
```

## Client integration

Use `src/lib/apiClient.ts` — `apiPost<T>(path, body, signal?)` automatically attaches the current Firebase ID token and throws an `ApiError` on non-2xx responses.
