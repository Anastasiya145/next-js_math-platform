---
description: "Use when writing or changing TypeScript, React components, or client-side state in this Next.js application."
applyTo: "src/**/*.{ts,tsx}"
---

# TypeScript and React

- Keep components focused and split substantial UI into named subcomponents with clear responsibilities. Prefer a separate file when a subcomponent has its own state or behavior, is reused, or makes the parent difficult to scan; keep tiny, tightly coupled helpers local.
- Avoid both monolithic components and one-line wrapper components. Extract meaningful units such as a form section, list row, toolbar, or state view; do not extract markup merely to reduce line count.
- Keep files concise. Treat roughly 200 lines as a prompt to consider extraction, not a hard limit; preserve cohesion and readability over hitting a number.
- When a feature grows beyond a single page component, keep its subcomponents near the route or feature that owns them and keep the route entrypoint focused on composition.
- Follow the existing file and export style in the neighboring code unless the task requires a deliberate change.
- Next.js App Router components are Server Components by default. Add `"use client"` only for browser APIs, event handlers, or client-owned state.
- Keep server-only modules such as `src/lib/db.ts` out of client component import graphs.
- Preserve explicit types at API and database boundaries. Validate untrusted request data before using it.
- Keep UI state local to the component or feature unless a real cross-route requirement calls for shared state.
- Use semantic HTML, associated form labels, accessible names for icon-only buttons, and visible keyboard focus.
- Before changing Next.js APIs or conventions, read the relevant documentation installed in `node_modules/next/dist/docs/` as required by the root `AGENTS.md`.
