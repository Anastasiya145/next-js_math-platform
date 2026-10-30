---
name: project-compliance
description: "Use when asked to check whether code follows this project's requirements, architecture, security, UX, or documentation rules; supports changed-file, path-scoped, and explicitly requested full-repository audits."
---

# Project Compliance Audit

Audit only. Do not edit, stage, commit, or deploy files unless the user separately asks for fixes.

## 1. Define the audit scope

- Use the paths or change set named by the user. If none are named, inspect the current working-tree changes and their related implementation. Audit the entire repository only when explicitly requested.
- Inspect `git status --short` before interpreting a diff. Treat unrelated and pre-existing user changes as out of scope.
- Read the applicable always-on instructions, `PRODUCT.md`, and `DESIGN.md`; then load file-scoped instructions and relevant skills for the files and behaviors being audited.
- Before evaluating Next.js code, read the relevant guide under `node_modules/next/dist/docs/` as required by the repository instructions.

## 2. Build the checklist from project sources

Evaluate only rules relevant to the audited scope. At minimum, consider:

- **Requirements and product behavior:** intended users, supported site variant/language, expected workflow, and whether a feature works beyond its navigation entry or static presentation.
- **Architecture:** Next.js 16 App Router conventions, React/TypeScript patterns, client/server boundaries, shared component reuse, MUI theme tokens, and established module ownership.
- **Security and data flow:** authorization and input validation at API boundaries, server-only database access, safe handling of credentials and personal data, and no exposure of raw internal errors.
- **Forms and feedback:** shared validators, field-level errors, catalogued application messages in `src/lib/error-messages.ts`, visible loading/empty/success/error states, labels, and keyboard focus.
- **Consistency and accessibility:** relevant requirements from `DESIGN.md`, established UI conventions, responsive behavior, and accessible interaction semantics.
- **Documentation and validation:** applicable instructions are followed, affected documentation is current, and claimed checks actually cover the change.

The repository instructions, product requirements, design rules, and applicable file-scoped instructions are authoritative. Do not import conventions from another project or treat a stylistic preference as a violation.

## 3. Inspect implementation and verify

- Trace changed behavior through its callers, route/API boundary, authorization, data access, and user-visible states as applicable. Confirm findings in code rather than inferring from names or navigation.
- Separate confirmed violations from risks, ambiguous requirements, and issues outside the requested scope. If project sources conflict or lack a necessary rule, report the conflict or gap instead of inventing a requirement.
- Run the narrowest available check. Use `npm run lint` for code-quality checks and `npm run build` when routes, shared behavior, server/client boundaries, or production compilation are relevant.
- This repository currently has no test script. Do not claim tests or comprehensive requirements validation ran when they did not. Automated checks complement, but do not replace, the rule-by-rule audit.
- Do not access production data or secrets, run migrations, alter environment settings, or trigger external side effects as part of an audit.

## 4. Report the result

Start with concrete findings, ordered by severity. For each finding include:

- Severity and a precise file reference.
- The project rule or requirement that applies.
- Evidence in the implementation and the likely user, security, or maintenance impact.
- A concise correction direction, without applying it.

Then provide a compact checklist with **Compliant**, **Violation**, or **Not checked** for the applicable rule groups, the commands run and their results, and residual risks. If no violations are found, say that explicitly and state the audit scope; never imply an unrequested full-repository audit.
