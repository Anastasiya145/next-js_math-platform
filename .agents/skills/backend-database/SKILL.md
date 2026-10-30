---
name: backend-database
description: 'Use when working with this project backend, Neon Postgres schema, SQL queries, API routes, database migrations, or documenting data flows. Load the project reference for verified endpoint and table examples.'
---

# Backend and Database Skill

Use this skill for backend API, database, SQL, and migration work in the math tutor platform.

## Source of truth

- Read [the backend and database reference](../../../docs/backend-database.md) for the endpoint catalog, schema overview, and examples.
- Confirm implementation details in `src/app/api/**/route.ts`, `src/lib/db.ts`, `src/lib/authz.ts`, and the relevant files under `db/migrations/`. Source code and migrations take precedence over the reference when they differ.
- The app exposes Next.js REST routes, not GraphQL. Do not invent GraphQL operations or claim a GraphQL endpoint exists.
- `src/lib/db.ts` is server-only and uses `@neondatabase/serverless`. Keep database access on the server.

## Workflow

1. Identify the concrete route, database function, table, or migration involved before making changes.
2. Trace the route through its authorization helper and database function. Preserve the distinction between teacher access and a student's own account/site access.
3. Validate request bodies at the route boundary, retain existing `{ data }` / `{ error }` response conventions, and use catalogued messages from `src/lib/error-messages.ts` for user-visible errors.
4. Write SQL with Neon tagged-template parameters. Never concatenate untrusted input into SQL.
5. Treat password hashes/salts and Google Drive credentials/tokens as secrets. Do not expose them through API responses, examples, logs, or diagnostic queries.
6. Make schema changes in a new ordered migration under `db/migrations/`; do not modify production schema with ad hoc SQL. Preserve existing migration history.
7. Update [the backend and database reference](../../../docs/backend-database.md) when adding or changing public route behavior, tables, important constraints, or query examples.
8. Run the narrow relevant validation first, then `npm run lint` or `npm run build` when warranted. There is no configured test script.

## Query guidance

- Prefer selecting only the columns needed; avoid `SELECT *`, especially for account or credential tables.
- Use a development/test database for exploratory queries and keep examples anonymized.
- Distinguish API behavior from direct SQL: API examples require the application's session and authorization checks; direct SQL bypasses those checks.
- Keep documented request/response examples grounded in the route implementation. Note whether a route accepts JSON, query parameters, or multipart form data.