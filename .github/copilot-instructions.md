# Copilot Instructions - Math Tutor Platform

## Product

This is a web workspace for a mathematics tutor. The current interface centers on a tutor dashboard, students, classes, assignments, and teaching materials. The primary audience is the tutor; do not assume student-facing workflows exist unless the code confirms them.

**Language:** The entire application interface is exclusively in Ukrainian. Keep developer-facing code, comments, and documentation in English unless the user asks otherwise. All user-facing text, labels, placeholders, error messages, and UI copy must be in Ukrainian.

## Stack and project structure

- Next.js 16 App Router, React 19, and TypeScript.
- UI is built with Material UI (MUI v9). The theme (palette, shape, component defaults, light/dark schemes) lives in `src/components/Providers.tsx`; there is no Tailwind and no global stylesheet.
- Authentication uses NextAuth. Neon Postgres access is centralized in `src/lib/db.ts`; API endpoints live under `src/app/api/`.
- Pages live under `src/app/`; shared components (`AppShell`, `PageSection`, `ItemRow`, `LinkList`, `FormDialog`, `FieldsDialog`, `AddAction`, `StatCard`, `ProgressChart`) live under `src/components/`. Client data helpers (`api`, `useApi`, `useAction`) are in `src/lib/api.ts`.
- `AGENTS.md` contains a Next.js-generated instruction block. Do not remove or edit it; `next dev` may regenerate it.

## Working rules

- Before changing Next.js code, read the relevant guide from `node_modules/next/dist/docs/`. This project uses Next.js 16; do not rely on conventions from other versions.
- Read the nearby implementation before extending it. Preserve existing APIs and visual conventions unless the task requires a change.
- **Reuse MUI and shared components first:** Compose pages from MUI components and the shared components above before writing new markup. Use theme tokens (`sx` with `primary.main`, `text.secondary`, `theme.vars`) and MUI breakpoints (`{ xs, sm, md }`); never hardcode hex colors or pixel breakpoints. Change global look in the theme, not per component.
  - `DESIGN.md` describes intent, not replacement tokens
- Keep server-only database access out of client components. Validate API input at the route boundary and return clear HTTP status codes.
- Keep every application error message in `src/lib/error-messages.ts`. Do not hardcode error text in UI components, API routes, Auth.js config, database code, or catch blocks; reference a named catalog entry instead. Keep HTTP status codes and machine-readable conditions in code, map internal database/provider failures to catalog messages, and never expose raw exception messages to users. Add or update the catalog entry before wiring a new error.
- Handle loading, empty, success, and error states for user-facing workflows. Keep labels visible and keyboard focus apparent.
- Do not claim a feature works merely because it appears in navigation or static dashboard content; verify its route and data flow.
- **Form Validation:** All form inputs must have client-side validation. Use `validateEmail()`, `validatePassword()`, and other validators from `@/lib/validation`. Display field-level error messages below invalid fields (MUI `error` + `helperText`). Disable submit button if form is invalid. Show server errors prominently at the top of the form.

## Product and design context

- Read `PRODUCT.md` for the product's current audience and scope.
- Read `DESIGN.md` for the established visual direction and current UI constraints.
- Load `frontend-design` only for new or substantially changed visual direction. Load `ui-ux-pro-max` for a specific UX question in an established interface. Do not load both by default.

## Validation

Run commands from the repository root. Use `npm run lint` for linting and `npm run build` for a production build when the change warrants it. There is no test script currently defined in `package.json`; do not imply a test suite ran when it did not.
