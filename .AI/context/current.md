# Current Project Context

## Current state

- Next.js 16 App Router application for a mathematics tutor.
- Current routes include the dashboard, login, student management, and class-oriented materials.
- The UI is Ukrainian and currently targets tablet/desktop widths; `src/app/globals.css` contains the mobile guard below 700px.
- NextAuth handles authentication. SQLite access is in `src/lib/db.ts`; API route handlers are under `src/app/api/`.
- Teacher Google sign-in is allowlisted by `ADMIN_EMAIL`; students sign in with email/password created by the teacher.
- Student homeworks are individually assigned and API-filtered by student ID. Uploads are proxied to the teacher's Google Drive, with one Drive folder per student; scores are 0-12 and a student-reported "Немає ДЗ" records 0.
- The active local roster has four names, but seeded roster records without account credentials cannot sign in until the teacher adds email/password credentials.
- `PRODUCT.md` and `DESIGN.md` are the concise product and design references.

## Validation

- `npm run lint`
- `npm run build`
- `package.json` does not currently define a test script.
- On Windows, use `npm.cmd run dev:system-ca` when Node cannot load the system certificate chain.

Keep this file as a short operational snapshot. Update it only when current project state or an active blocker changes; do not use it as a session log.
