# Approved Architecture

Use Google-native services exclusively.

## Frontend

- React (Vite-based)
- Responsive web-first design
- Mobile capture optimized

## Backend

- Node.js server-side runtime
- Server routes for privileged operations (Gemini, Admin Firestore access)
- **Never expose Gemini API keys or service credentials to client code.**

## Auth

- Firebase Authentication
- Google sign-in (Primary)

## Database

- Firestore for MVP
- All documents must include `ownerId` or `growId`.
- Security rules enforce user isolation.

## Storage

- Cloud Storage for Firebase
- Private media paths only.
- Server-mediated upload/finalize flow.
- **Never use public bucket URLs.**

## AI

- Server-side Gemini API (Pro/Flash)
- Structured JSON outputs via Zod validation.
- Persistence of prompt version, model version, and confidence scores.

## Deployment

- Cloud Run or Firebase App Hosting.
