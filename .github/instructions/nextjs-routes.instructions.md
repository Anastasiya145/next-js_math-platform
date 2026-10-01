---
description: "Use when creating or changing App Router pages, layouts, loading/error boundaries, metadata, or route handlers."
applyTo: "src/app/**"
---

# Next.js App Router

- This repository uses Next.js 16. Before changing routing, rendering, caching, or route-handler behavior, read the matching guide under `node_modules/next/dist/docs/`.
- Keep route files aligned with the App Router: `page.tsx` renders a page, `layout.tsx` composes a segment, and `route.ts` handles an HTTP endpoint.
- Keep server-only code and database access on the server. Never import `src/lib/db.ts` into a Client Component.
- Validate route-handler input and return intentional HTTP status codes with a consistent JSON response shape.
- Preserve the existing authentication boundary. Check `src/auth.ts`, `src/proxy.ts`, and nearby route behavior before changing access control.
- Do not add caching or revalidation assumptions without checking the installed Next.js 16 documentation and the data's freshness needs.
