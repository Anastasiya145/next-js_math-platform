# Current Project Context

## Current state

- Next.js 16 App Router application for a mathematics tutor.
- Next.js 16 App Router application for a mathematics tutor, with teacher (`/`, `/students`, `/homework`, `/materials`) and student (`/student`) areas plus `/login`.
- The UI is Ukrainian and built with Material UI; the theme lives in `src/components/Providers.tsx` and shared components in `src/components/`. It is responsive from phone to desktop.
- NextAuth handles authentication. Neon Postgres access is in `src/lib/db.ts`; API route handlers are under `src/app/api/`.
- Teacher Google sign-in is restricted to the platform owner's email; students sign in with the email/password created by the teacher.
- Student homeworks are individually assigned and API-filtered by student ID. Uploads are proxied to the teacher's Google Drive, with one Drive folder per student; scores are 0-12 and a student-reported "Немає ДЗ" records 0.
- Roster records without account credentials cannot sign in until the teacher adds email/password credentials.
- Class folders and topics under Materials (`/api/materials`) are held in memory and reset on server restart.
- `PRODUCT.md` and `DESIGN.md` are the concise product and design references.

## Validation

- `npx tsc --noEmit`
- `npm run lint` (existing issues remain in `api/nush`, `api/student/change-password`, and `api/students/[studentId]/textbooks` routes)
- `npm run build`
- `package.json` does not currently define a test script.
- On Windows, use `npm.cmd run dev:system-ca` when Node cannot load the system certificate chain.

Keep this file as a short operational snapshot. Update it only when current project state or an active blocker changes; do not use it as a session log.
