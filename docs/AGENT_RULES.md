# Agent Rules

## Non-negotiable rules
1. Read `PROJECT_BRIEF.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `AI_ANALYSIS_SCHEMA.md`, and `ACCEPTANCE_TESTS.md` before major edits.
2. Do not change the approved architecture unless explicitly asked.
3. Do not invent Google/Firebase/Gemini APIs. If unsure, say what is unknown and use official docs.
4. Do not expose API keys, service credentials, or admin credentials in client code.
5. Do not weaken Firebase Security Rules to make something work.
6. Do not use public Storage URLs for private plant media.
7. Do not generate fake production data except in explicit seed/demo files.
8. Do not skip validation. All AI inputs use Zod. All Gemini structured outputs use Zod.
9. Do not silently swallow model failures. Persist inconclusive/fallback analysis.
10. Do not make medical, legal, dosing, sales, dispensary, or recreational-use claims. Cultivation only.

## Development behavior
For every task:
1. Restate the exact goal.
2. List files expected to change.
3. Implement the smallest working version.
4. Run or describe validation.
5. Report changed files and remaining gaps.

## Anti-drift rules
- No new major package without explaining why.
- No new collection/table without updating `DATA_MODEL.md`.
- No new route without updating API documentation.
- No new AI output field without updating `AI_ANALYSIS_SCHEMA.md`.
- No new user-visible feature without loading/error/empty states.
- No destructive rewrite unless explicitly requested.
