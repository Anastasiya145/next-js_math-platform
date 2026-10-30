---
name: pre-merge-review
description: "Use when asked to review a diff, branch, or change before merging. Prioritizes bugs, regressions, security and data-flow risks, and missing validation; reports findings without editing code."
---

# Pre-Merge Review

Review the requested change, not the entire repository. Do not modify files unless the user also asks for fixes.

## 1. Scope the change

- Inspect `git status --short` and the relevant staged or working-tree diff. Do not assume unrelated changes belong to the review.
- Read changed code with its nearby callers, tests, API route, and applicable instructions.
- For Next.js behavior, consult the relevant local guide under `node_modules/next/dist/docs/` when needed.

## 2. Check for defects

Prioritize concrete findings that can cause incorrect behavior, regressions, data exposure, authorization gaps, unsafe database access, or broken builds. Check relevant boundaries, including:

- API input validation, authorization, and server-only database access.
- Client/server component boundaries and Next.js 16 conventions.
- Loading, empty, success, and error behavior for changed user workflows.
- Field-level form validation and error messages from `src/lib/error-messages.ts`.
- Consistency with nearby MUI components, theme tokens, and the established product/design rules.
- Regression coverage and whether the stated validation actually covers the changed behavior.

Do not report speculative style preferences as defects. Do not expand the scope to unrelated existing issues.

## 3. Validate and report

- Run a focused available check when useful; run `npm run lint` or `npm run build` only when relevant to the review scope.
- Findings come first, ordered by severity, each with a file reference and a concise explanation of impact.
- If there are no findings, say so and mention meaningful test gaps or residual risks. Summarize the change only after findings.
- Do not stage, commit, push, deploy, or alter the reviewed change.
