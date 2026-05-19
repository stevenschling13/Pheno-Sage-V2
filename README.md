# PhenoSage v2 MVP

PhenoSage v2 is a professional cannabis cultivation AI operating system. 
Phase 2 focuses on secure, owner-scoped Grow and Plant CRUD functionality.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   Copy `.env.example` to `.env.local` and add your Firebase configuration details:
   Ensure you have enabled Cloud Storage in your Firebase Console.
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

   **Note:** Do NOT configure `GEMINI_API_KEY` for this phase. The Phase 3 MVP adds secure media upload but does not use Gemini on the client side. Gemini API keys are only required for Phase 4+ server-side features.

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

## Phase 3 Features
- Secure image/video upload to Cloud Storage
- Private owner-scoped media storage rules
- Firebase Storage validation (size and type)
- Real-time media gallery view per plant

## Security Testing (Firestore & Storage)
This project uses `@firebase/rules-unit-testing` for verifying Firestore and Storage security rules locally. The tests are written using `vitest` and run against the Firebase Local Emulator.
Note: You must have Java installed locally to run the emulators.

To run the security tests:
```bash
npm run test:rules
```

## Documentation
Please refer to the `/docs` directory for the system constitution:
- `PROJECT_BRIEF.md`
- `ARCHITECTURE.md`
- `DATA_MODEL.md`
- `ROADMAP.md`
- `ACCEPTANCE_TESTS.md`
