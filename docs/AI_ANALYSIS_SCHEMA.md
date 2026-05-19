# AI Plant Analysis Schema

Every image or video analysis must return structured JSON.

## Required top-level fields:
- `analysisId`: string
- `plantId`: string
- `mediaAssetId`: string
- `mediaType`: "image" | "video"
- `modelVersion`: string
- `promptVersion`: string
- `analyzedAt`: string (ISO)
- `isFallback`: boolean
- `fallbackReason`: string
- `overallHealthScore`: number (0-100)
- `confidenceScore`: number (0-1)
- `estimatedStage`: string
- `stageConfidence`: number
- `imageQuality`: string
- `visualObservations`: string[]
- `diagnosticHypotheses`: string[]
- `findings`: Array<{category, severity, confidence, title, recommendation}>
- `recommendations`: string[]
- `suggestedTasks`: string[]
- `comparisonSummary`: string (if previous data exists)
- `safetyCaveats`: string

## Rules:
- If media quality is inadequate, return `isFallback=true`.
- Never fabricate a confident diagnosis from poor media.
- Findings must include category, severity, confidence, recommendation, and whether human confirmation is required.
- High/critical findings may create suggested tasks.
- Stage changes must be suggested, not automatically applied, unless user confirms.
