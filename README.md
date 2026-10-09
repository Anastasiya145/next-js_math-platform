# Math Tutor Platform

Web workspace for a mathematics tutor: students, classes, homework, grades, and teaching materials. The teacher and students have separate cabinets. The interface is in Ukrainian.

See [PRODUCT.md](PRODUCT.md) for scope and [DESIGN.md](DESIGN.md) for visual direction.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Material UI v9; the theme is in `src/components/Providers.tsx`
- Auth.js (NextAuth v5): Google for the teacher, email/password for students
- Neon Postgres via `@neondatabase/serverless`; homework files are stored in the teacher's Google Drive

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command                       | Purpose                                                               |
| ----------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                 | Development server                                                    |
| `npm run dev:system-ca`       | Development server that trusts the system certificate store (Windows) |
| `npm run build` / `npm start` | Production build and server                                           |
| `npm run lint`                | ESLint                                                                |
| `npm run db:migrate:neon`     | Apply pending SQL files from `db/migrations/`                         |

There is no test script.

## Environment

Keep secrets in the git-ignored `.env` or `.env.local`; never commit them or share their values.

| Variable                               | Purpose                                                      |
| -------------------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`                         | Pooled Neon connection used by the app                       |
| `DATABASE_URL_UNPOOLED`                | Direct Neon connection used by `db:migrate:neon`             |
| `AUTH_SECRET`                          | Random string of at least 32 characters                      |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth client                                          |
| `ADMIN_EMAIL`                          | Teacher email; enables the Google sign-in button on `/login` |
| `GOOGLE_PICKER_API_KEY`                | Browser API key for Google Picker (optional, folder linking) |
| `GOOGLE_PROJECT_NUMBER`                | Google Cloud project number used as the Picker app ID        |

The teacher email allowed to sign in is also set in `src/auth.ts`. If both `.env` and `.env.local` exist, remove blank values from `.env.local`, because it has higher priority. Restart the dev server after changing variables.

## Database

Schema changes are versioned SQL files in `db/migrations/`. Run `npm run db:migrate:neon` to apply pending ones. Student accounts are created by the teacher with an email and a temporary password; leaving the password blank when editing keeps the current one.

## Google login and Drive

1. Create an OAuth 2.0 Web client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add `http://localhost:3000` as an authorized JavaScript origin and `http://localhost:3000/api/auth/callback/google` as a redirect URI. Add the production domain and callback before deployment.
3. Enable the Google Drive API and add the `https://www.googleapis.com/auth/drive.file` scope under Google Auth Platform **Data Access**.
4. Set the variables above and restart the server.
5. Sign in with Google once to grant Drive access and issue a refresh token. After a scope change, sign out and sign in again.

On the first submission the app creates a folder for the student in the teacher's Drive and stores uploads there.

### Linking an existing Drive folder

With the `drive.file` scope the app only sees files it created or that the teacher picked through Google Picker. To reuse an existing folder (for example `4 клас / Ліза`):

1. Enable the **Google Picker API** (and the Drive API) in the same Cloud project.
2. Create an API key under **Credentials**, restrict it to the Google Picker API and to the HTTP referrers `http://localhost:3000/*` and the production domain, and set it as `GOOGLE_PICKER_API_KEY`.
3. Set `GOOGLE_PROJECT_NUMBER` to the project number from the Cloud console dashboard.
4. Restart the server, open `/students`, click the folder icon on a student, and choose the folder. Later submissions from that student go into it.

On Windows, if Auth.js logs `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, use `npm run dev:system-ca` instead of disabling TLS verification.

## Deployment

The app can be deployed on Vercel. Add the environment variables above and the production OAuth redirect URI.
