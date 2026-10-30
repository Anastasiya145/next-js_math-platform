---
name: push-deploy-both
description: "Use when the user asks to push, publish, or deploy this project (including Russian: запушить, выложить, задеплоить). Automatically push the current task to GitHub and deploy both Vercel production sites: math-with-anastasia and languages-with-anastasia."
---

# Push and Deploy Both Sites

Use this workflow for an explicit request to push or publish this repository. The user has authorized the routine GitHub push and production deployment to both Vercel sites; do not ask for confirmation at each step.

## Targets

- Git remote: `origin`; push the current branch unless the user specifies another.
- Mathematics production project: `math-with-anastasia`, `NEXT_PUBLIC_SITE_VARIANT=math`.
- Language-learning production project: `languages-with-anastasia`, `NEXT_PUBLIC_SITE_VARIANT=languages`.
- Deploy both projects from the repository root. Their root directory is `.`.

## Procedure

1. Inspect `git status --short --untracked-files=all`, the current branch, upstream, and staged diff. Do not use `git add -A`.
2. Identify files changed for the current task. Stage and commit only those files. Leave unrelated user changes, pre-staged changes, `.agents/skills/backend-database/`, `.env*`, `.vercel/`, and other secrets out of the commit. If there are no task changes, do not create an empty commit.
3. Run `npm run lint` and `npm run build`. This repository uses `next build --webpack` because Vercel's Turbopack build failed resolving `next/font/google`.
4. Push the current branch with a normal `git push origin <branch>`. Never force-push, reset, or discard changes. If the push is rejected or the branch has diverged, stop and report the specific blocker rather than rewriting history.
5. Before production deployment, verify Vercel CLI authentication and inspect both named projects. Confirm the production `NEXT_PUBLIC_SITE_VARIANT` values match their targets and that required environment variables exist. Never display or log environment-variable values, tokens, or `.env` contents. If checking values requires pulling env files, use a temporary file outside the repository and delete it immediately.
6. Push may trigger automatic Git-connected deployments. Check each project's latest production deployment and deploy only if the pushed commit is not already deployed and ready. For direct deployments, use the exact Vercel project name, project root `.`, and production target; never deploy through an unrelated local `.vercel` link.
7. Deploy and verify both production aliases:
   - `https://math-with-anastasia.vercel.app`
   - `https://languages-with-anastasia.vercel.app`
     Confirm each deployment reaches `READY`. If one fails, inspect its build logs and fix only a deployment blocker within this task, then validate, push, and retry both as needed.
8. On Windows, if Node reports a certificate error, retry Vercel CLI with `$env:NODE_OPTIONS='--use-system-ca'`. Use a current Vercel CLI (`npx --yes vercel@latest`); older installed CLI versions may not support the projects' Node 24 runtime.
9. Do not change project environment variables, domains, Git connections, or Deployment Protection as part of routine publishing. If Vercel Protection is enabled, leave it enabled and mention it in the completion report.
10. Report the pushed branch and commit, both deployment statuses and URLs, and any access gate or remaining blocker. Do not ask routine follow-up questions.

## Stop Conditions

Pause only when a missing credential/configuration, failed validation, unrelated staged change that cannot be isolated, branch divergence, or potentially destructive Vercel setting prevents safe completion. State the exact blocker and ask at most one focused question when user input is genuinely required.
