# Acceptance Tests

## Phase 0: Scaffolding

- [ ] App starts without runtime errors.
- [ ] Landing page is accessible.
- [ ] Protected layout shell exists.
- [ ] Dashboard placeholder is visible.
- [ ] All 7 core docs are present in `/docs`.
- [ ] No secrets are exposed in the client bundle.

## Phase 1: Authentication

- [x] User can sign in with Google.
- [x] Unauthenticated users are redirected to the Landing page.
- [x] Auth state persists across refreshes.
- [x] User profile is created in Firestore on first login.
- [x] Sign out clears the session and redirects to Landing.

## Phase 2: Grows and Plants

- [x] User can create a new Grow.
- [x] User can list active Grows.
- [x] User can edit an existing Grow.
- [x] User can archive a Grow (no hard deletes).
- [x] User can add a Plant to a Grow.
- [x] User can list Plants in a Grow.
- [x] User can edit an existing Plant.
- [x] User can archive a Plant (no hard deletes).
- [x] Data is correctly constrained by `ownerId`.
- [x] Firestore security rules block unauthorized mutations (Emulator tests added; must be run locally with Java and Firebase Emulator access).
- [x] Firestore restricts allowed fields and types (Emulator tests added; must be run locally with Java and Firebase Emulator access).
- [x] Empty states show when no grows or plants exist.
- [x] Storage remains deny-all for all paths during Phase 2 (owner-scoped media logic is deferred to Phase 3).

## Phase 3: Media Architecture

- [ ] User can upload valid image/video to a plant.
- [ ] User can view uploaded media in the gallery.
- [ ] Media upload progress is visible.
- [ ] Firestore media_assets records are created upon successful upload.
- [ ] Firebase Storage security rules prevent unauthenticated access.
- [ ] Firebase Storage security rules restrict to owner paths and sizes.
- [ ] Storage emulator tests pass successfully locally.
