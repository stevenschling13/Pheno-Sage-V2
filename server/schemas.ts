import { z } from 'zod';
import { Type } from '@google/genai';

const BASE64_RE = /^[A-Za-z0-9+/=\r\n]+$/;
const MIME_RE = /^(image|video)\/[a-zA-Z0-9.+-]+$/;

export const AnalyzePlantRequestSchema = z.object({
  mediaBase64: z.string().min(1).regex(BASE64_RE, 'mediaBase64 must be base64'),
  mimeType: z.string().regex(MIME_RE, 'mimeType must be image/* or video/*'),
  isVideo: z.boolean().optional(),
});
export type AnalyzePlantRequest = z.infer<typeof AnalyzePlantRequestSchema>;

export const OrchestratorRequestSchema = z
  .object({
    input: z.string().max(8_000).optional(),
    mediaBase64: z.string().regex(BASE64_RE).optional(),
    mimeType: z.string().regex(MIME_RE).optional(),
  })
  .refine((d) => Boolean(d.input || d.mediaBase64), {
    message: 'Provide input or mediaBase64',
  })
  .refine((d) => !d.mediaBase64 || Boolean(d.mimeType), {
    message: 'mimeType is required when mediaBase64 is provided',
  });
export type OrchestratorRequest = z.infer<typeof OrchestratorRequestSchema>;

export const CopilotHistoryEntrySchema = z.object({
  timestamp: z.union([z.string(), z.number()]).optional(),
  date: z.string().optional(),
  vpd: z.number().optional(),
  temp: z.number().optional(),
  temperature: z.number().optional(),
  ec: z.number().optional(),
  notes: z.string().optional(),
});
export const CopilotRequestSchema = z.object({
  input: z.string().min(1).max(4_000),
  history: z.array(CopilotHistoryEntrySchema).max(2_000).optional(),
});
export type CopilotRequest = z.infer<typeof CopilotRequestSchema>;

export const analyzePlantResponseSchema = {
  type: Type.OBJECT,
  properties: {
    isFallback: { type: Type.BOOLEAN, description: 'True if media quality is inadequate.' },
    fallbackReason: { type: Type.STRING },
    overallHealthScore: { type: Type.NUMBER, description: '0-100 score' },
    confidenceScore: { type: Type.NUMBER, description: '0-1' },
    estimatedStage: { type: Type.STRING },
    stageConfidence: { type: Type.NUMBER },
    imageQuality: { type: Type.STRING },
    visualObservations: { type: Type.ARRAY, items: { type: Type.STRING } },
    diagnosticHypotheses: { type: Type.ARRAY, items: { type: Type.STRING } },
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          severity: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          title: { type: Type.STRING },
          recommendation: { type: Type.STRING },
        },
      },
    },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestedTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
    safetyCaveats: { type: Type.STRING },
  },
  required: [
    'isFallback',
    'overallHealthScore',
    'confidenceScore',
    'estimatedStage',
    'stageConfidence',
    'imageQuality',
    'visualObservations',
    'diagnosticHypotheses',
    'findings',
    'recommendations',
    'suggestedTasks',
    'safetyCaveats',
  ],
} as const;

export const orchestratorResponseSchema = {
  type: Type.OBJECT,
  properties: {
    agent: {
      type: Type.STRING,
      description: "'Botanist', 'Scheduler', 'Environment', 'Geneticist', or 'Compiler'",
    },
    component_type: {
      type: Type.STRING,
      description:
        "'GROW_SETUP', 'MORNING_BRIEFING', 'OCR_CAPTURE', 'WALKTHROUGH_REPORT', 'PHENOTYPE_LINEAGE', 'HARVEST_FORECAST', or 'LEDGER_EXPORT'",
    },
    setup_data: {
      type: Type.OBJECT,
      properties: {
        strain: { type: Type.STRING },
        medium: { type: Type.STRING },
        tent_size: { type: Type.STRING },
        quantity: { type: Type.NUMBER },
        nutrient_line: { type: Type.STRING },
      },
    },
    briefing_data: {
      type: Type.OBJECT,
      properties: {
        observations: { type: Type.ARRAY, items: { type: Type.STRING } },
        pending_approvals: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    ocr_data: {
      type: Type.OBJECT,
      properties: {
        temperature: { type: Type.NUMBER },
        humidity: { type: Type.NUMBER },
        target_temperature: { type: Type.NUMBER },
        target_humidity: { type: Type.NUMBER },
        device_type: { type: Type.STRING },
        status: { type: Type.STRING },
      },
    },
    walkthrough_data: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
        plants_identified: { type: Type.NUMBER },
        actions_required: { type: Type.ARRAY, items: { type: Type.STRING } },
        analysisResults: {
          type: Type.OBJECT,
          properties: {
            overallHealthScore: { type: Type.NUMBER },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    },
    lineage_data: {
      type: Type.OBJECT,
      properties: {
        mother_id: { type: Type.STRING },
        mother_traits: { type: Type.ARRAY, items: { type: Type.STRING } },
        clone_count: { type: Type.NUMBER },
        clone_reason: { type: Type.STRING },
        lineage_generation: { type: Type.STRING },
      },
    },
    harvest_data: {
      type: Type.OBJECT,
      properties: {
        pheno_score: { type: Type.STRING },
        yield_estimate: { type: Type.STRING },
        canopy_evaluation: { type: Type.STRING },
        strain_baseline_comparison: { type: Type.STRING },
        status: { type: Type.STRING },
      },
    },
    export_data: {
      type: Type.OBJECT,
      properties: {
        preview_title: { type: Type.STRING },
        run_id: { type: Type.STRING },
        date_range: { type: Type.STRING },
        total_entries: { type: Type.NUMBER },
        strains_included: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
  },
  required: ['agent', 'component_type'],
} as const;

export const copilotResponseSchema = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      description: "'CRITICAL_CORRECTION' or 'LEDGER_ENTRY' or 'PREDICTIVE_INSIGHT'",
    },
    title: { type: Type.STRING },
    message: {
      type: Type.STRING,
      description: 'Detailed analysis of the delta and predictive outcome.',
    },
    metrics_impact: {
      type: Type.ARRAY,
      description: "Which metrics will be impacted and how (e.g. ['VPD: +5%', 'Temp: -2C'])",
      items: { type: Type.STRING },
    },
  },
  required: ['type', 'title', 'message', 'metrics_impact'],
} as const;
