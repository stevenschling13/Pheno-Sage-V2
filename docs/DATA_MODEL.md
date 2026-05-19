# MVP Data Model

| Collection | Purpose | Key Fields | Status |
| :--- | :--- | :--- | :--- |
| **users** | User profile | uid, email, displayName, photoURL, timezone, createdAt, lastLogin | Active (Phase 1) |
| **grows** | Grow containers | id, ownerId, name, stage, medium, startDate, archived, createdAt, updatedAt | Active (Phase 2) |
| **grow_members** | Collaborators | id, growId, userId, role | Planned |
| **plants** | Individual plants | id, growId, ownerId, name, strain, archived, createdAt, updatedAt | Active (Phase 2) |
| **media_assets** | Media records | id, ownerId, growId, plantId, storagePath, fileName, contentType, sizeBytes, mediaType, uploadStatus, createdAt, updatedAt | Active (Phase 3) |
| **analysis_jobs** | Async processing | id, mediaAssetId, status | Planned |
| **plant_analyses**| AI results | id, mediaAssetId, score, summary, modelVersion | Planned (Phase 4) |
| **plant_findings**| Specific issues | id, analysisId, category, severity, recommendation | Planned |
| **grow_events** | Milestones | id, growId, type, timestamp | Planned |
| **plant_observations**| Manual notes | id, plantId, authorId, note | Planned |
| **grow_tasks** | Action items | id, growId, findingId, title, priority, status | Planned |
| **chat_threads** | Conversations | id, ownerId, growId, title | Planned |
| **chat_messages** | Chat history | id, threadId, role, content | Planned |
| **notifications** | User alerts | id, userId, title, message, read | Planned |
| **prompt_versions** | System prompts | id, version, text | Planned |

## Ownership Rule
Every user-owned document must include `ownerId`. Every child document scoped to a grow must include `growId` and `ownerId` unless explicitly documented otherwise. Security rules prevent cross-user access. Authenticated user context is the sole authority for `ownerId`.
