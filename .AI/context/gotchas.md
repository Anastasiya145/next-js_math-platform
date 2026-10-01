# Recurring Gotchas

Record only verified, recurring implementation pitfalls for this repository. For each one, note the symptom, root cause, solution, and how the solution was verified. Remove entries when the underlying constraint no longer applies.

## Google OAuth TLS fetch fails on Windows

- Symptom: Auth.js reports `TypeError: fetch failed` with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` while requesting Google's OIDC metadata.
- Root cause: Windows/.NET trusts the certificate chain, but this Node runtime does not use that system CA store by default.
- Solution: run `npm.cmd run dev:system-ca`, which starts Next.js with Node's `--use-system-ca` flag. Do not disable TLS verification.
- Verification: Windows/.NET and Node with `--use-system-ca` both received HTTP 200 from Google's OIDC discovery endpoint; the Google sign-in flow reached Google's account page.
