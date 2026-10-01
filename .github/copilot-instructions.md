# Copilot Instructions - Math Tutor Platform

## Product

This is a web workspace for a mathematics tutor. The current interface centers on a tutor dashboard, students, classes, assignments, and teaching materials. The primary audience is the tutor; do not assume student-facing workflows exist unless the code confirms them.

End-user interface copy is Ukrainian. Keep developer-facing code, comments, and documentation in English unless the user asks otherwise.

## Stack and project structure

- Next.js 16 App Router, React 19, and TypeScript.
- Tailwind CSS 4 is installed; the application also uses project CSS in `src/app/globals.css`.
- Authentication uses NextAuth. Neon Postgres access is centralized in `src/lib/db.ts`; API endpoints live under `src/app/api/`.
- Application pages and shared components currently live under `src/app/`.
- `AGENTS.md` contains a Next.js-generated instruction block. Do not remove or edit it; `next dev` may regenerate it.

## Working rules

- Before changing Next.js code, read the relevant guide from `node_modules/next/dist/docs/`. This project uses Next.js 16; do not rely on conventions from other versions.
- Read the nearby implementation before extending it. Preserve existing APIs and visual conventions unless the task requires a change.
- Treat `src/app/globals.css` as the source of truth for implemented colors, typography, spacing, and component styles. `DESIGN.md` describes intent, not replacement tokens.
- Keep server-only database access out of client components. Validate API input at the route boundary and return clear HTTP status codes.
- Keep every application error message in `src/lib/error-messages.ts`. Do not hardcode error text in UI components, API routes, Auth.js config, database code, or catch blocks; reference a named catalog entry instead. Keep HTTP status codes and machine-readable conditions in code, map internal database/provider failures to catalog messages, and never expose raw exception messages to users. Add or update the catalog entry before wiring a new error.
- Handle loading, empty, success, and error states for user-facing workflows. Keep labels visible and keyboard focus apparent.
- Do not claim a feature works merely because it appears in navigation or static dashboard content; verify its route and data flow.

## Product and design context

- Read `PRODUCT.md` for the product's current audience and scope.
- Read `DESIGN.md` for the established visual direction and current UI constraints.
- Load `frontend-design` only for new or substantially changed visual direction. Load `ui-ux-pro-max` for a specific UX question in an established interface. Do not load both by default.

## Validation

Run commands from the repository root. Use `npm run lint` for linting and `npm run build` for a production build when the change warrants it. There is no test script currently defined in `package.json`; do not imply a test suite ran when it did not.
