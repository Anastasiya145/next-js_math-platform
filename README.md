This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Neon Database

Application data is stored in Neon Postgres through `@neondatabase/serverless` over HTTPS. Student accounts, assignments, submissions, grades, and Drive file references live in Postgres; uploaded homework files remain in the teacher's Google Drive. Auth.js remains the identity provider.

The Neon project is linked to this directory through the git-ignored `.neon` file. Keep `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in the ignored `.env` file and never commit or share their values. The app uses the pooled `DATABASE_URL`; the one-time SQLite migration uses the direct `DATABASE_URL_UNPOOLED`.

The initial schema and student dashboard additions are versioned in `db/migrations/`. Apply pending schema changes with:

```bash
npm run db:migrate:neon
```

To import the local `data/app.db` into a Neon branch that has no application data, run:

```bash
npm run db:migrate:sqlite
```

The migration refuses to import over existing table data and records its version so it cannot be applied twice. Keep the local SQLite file as a backup until the Neon-backed application has been verified.

The student dashboard uses a one-time, clearly marked preview dataset. It includes grade-9 Merzlyak algebra for Dima, sample grade-7 algebra and geometry resources, and sample graded assignments for the grade-6 student account. Seed it once with `npm run db:seed:student-portal`; the version marker prevents deleted demo items or edited grades from being recreated on a later run. Add real textbook links from **Матеріали → Підручники й тренажери**.

## Google Login and Drive Setup

Google sign-in is restricted to the platform owner's email address.

1. Create an OAuth 2.0 Web client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add `http://localhost:3000` as an authorized JavaScript origin and `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. Add the production domain and callback URI before deployment.
3. Enable the Google Drive API in the same Google Cloud project and add the `https://www.googleapis.com/auth/drive.file` scope under Google Auth Platform **Data Access**. On first submission, the app creates a folder for that student in the teacher's Drive and stores each upload there. It retains Drive file IDs and serves each submission only through its assigned homework.
4. Set the Google client ID, client secret, a random `AUTH_SECRET` of at least 32 characters, and the exact Google account email allowed to access the teacher cabinet in `.env.local`. If you use `.env` instead, remove conflicting blank values from `.env.local`, because it has higher priority.
5. Restart the development server after changing environment variables. After adding the Drive scope, sign out and sign in with Google again to grant Drive access and issue a refresh token.

Student accounts are created by the teacher with an email and temporary password. Editing an existing account leaves its password unchanged when the temporary-password field is blank.

Never commit `.env.local` or send OAuth credentials through chat. The example file contains placeholders only.

On Windows, if Auth.js logs `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` while Windows itself can reach Google, start the app with `npm.cmd run dev:system-ca`. This lets Node trust the system certificate store without disabling TLS verification.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
