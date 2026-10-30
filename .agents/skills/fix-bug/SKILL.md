---
name: fix-bug
description: "Use when fixing a bug, regression, error, broken screen, or unexpected behavior in the math tutor platform. Reproduces the behavior, traces the owning code path, applies a focused root-cause fix, and validates the affected workflow."
---

# Fix a Bug

## 1. Establish the behavior

1. Inspect `git status --short` and leave unrelated user changes untouched.
2. State the observed behavior, expected behavior, and a concrete reproduction or check.
3. Read the owning code, nearby call sites, and relevant project instructions. Before changing Next.js code, read the matching guide in `node_modules/next/dist/docs/` as required by the repository instructions.
4. Check `src/lib/error-messages.ts` and `src/lib/validation.ts` before adding error copy or validation.

## 2. Find the cause

- Trace the behavior to the code that decides it; do not patch a downstream symptom when the owning logic is available.
- Check the closest existing test or reproducible behavior first. This repository currently has no test script, so do not claim a test suite ran.
- Separate frontend defects from API, database, configuration, or environment problems. Do not invent API behavior or expose raw provider/database errors to users.
- Keep the change to the smallest correct fix. Avoid unrelated cleanup and preserve existing APIs and UI conventions.

## 3. Validate and document

- Run the narrowest available check that exercises the change. For UI or route behavior, verify the relevant loading, success, empty, and error states where applicable.
- Run `npm run lint`; run `npm run build` when the change affects routing, server/client boundaries, shared behavior, or otherwise warrants a production build.
- Update relevant documentation when behavior, setup, or an established project convention changes.
- Report the root cause, change, checks run, and any behavior that could not be verified. Do not imply unrun tests passed.
