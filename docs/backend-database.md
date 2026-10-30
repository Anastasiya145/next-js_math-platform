# Backend and Database Reference

This reference describes the implemented Next.js REST API and Neon Postgres schema. The application does not expose a GraphQL endpoint; use the HTTP examples below for application workflows and SQL examples for trusted database diagnostics.

For an interactive API reference, sign in as a teacher and open `/api-docs`. Its OpenAPI source is [`public/openapi.json`](../public/openapi.json).

## Runtime and conventions

- API routes live under `src/app/api/**/route.ts`; the database layer is `src/lib/db.ts`.
- `DATABASE_URL` is read only on the server. `db.ts` uses `@neondatabase/serverless` and parameterized tagged-template queries.
- Most JSON endpoints return `{ "data": ... }`. Errors return `{ "error": "..." }` and an HTTP status.
- Routes use the existing NextAuth session. Teacher-only endpoints require a teacher session; student endpoints require a student session assigned to the current site. A `403` means the session is missing or has the wrong role.
- Use an authenticated browser session for HTTP examples. Do not put credentials, session cookies, password hashes, or Google tokens in docs, logs, or query output.
- Migrations in `db/migrations/` are the source of truth for schema changes. Do not apply ad hoc schema changes to the live database.

## API index

| Route                                       | Methods                  | Access / purpose                                                           |
| ------------------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| `/api/students`                             | GET, POST, PATCH, DELETE | Teacher: manage student profiles and accounts. PATCH/DELETE use `?id=...`. |
| `/api/assignments`                          | GET, POST                | Teacher: list/create assignments. Student: GET their own assignments.      |
| `/api/assignments/[homeworkId]`             | PATCH, DELETE            | Teacher: update/delete an assignment.                                      |
| `/api/assignments/[homeworkId]/grade`       | PATCH                    | Teacher: grade a submission.                                               |
| `/api/assignments/[homeworkId]/no-homework` | POST                     | Student: mark an assignment as not done.                                   |
| `/api/assignments/[homeworkId]/submission`  | GET, POST                | Teacher: download a submitted file. Student: upload submission files.      |
| `/api/schedule`                             | GET, POST, PATCH, DELETE | Teacher: query and manage lessons.                                         |
| `/api/students/[studentId]/schedule`        | PUT                      | Teacher: replace a student's recurring lesson slots and hourly rate.       |
| `/api/payments`                             | GET, POST, PATCH, DELETE | Teacher: query and manage student payments.                                |
| `/api/student/dashboard`                    | GET                      | Student: own dashboard. Teacher: pass `?studentId=...` to view a student.  |
| `/api/student/change-password`              | POST                     | Student: change own password.                                              |
| `/api/student/language`                     | PATCH                    | Student: update own language preferences.                                  |
| `/api/student/telegram`                     | GET, POST, DELETE        | Student: Telegram status, create a one-time bot link, unlink.              |
| `/api/telegram/webhook`                     | POST                     | Telegram Bot API only; requires the webhook secret header.                 |
| `/api/materials`                            | GET, POST                | Teacher: manage class materials. POST uses an `action` field.              |
| `/api/nush`                                 | GET, POST                | Teacher: manage NUSH topics and materials. POST uses an `action` field.    |
| `/api/textbooks`                            | GET, POST                | Teacher: list/create textbooks.                                            |
| `/api/textbooks/[textbookId]`               | PATCH, DELETE            | Teacher: update/delete a textbook.                                         |
| `/api/students/[studentId]/report`          | GET                      | Teacher: download a student report.                                        |
| `/api/students/[studentId]/drive-folder`    | PUT                      | Teacher: set a student's Drive folder.                                     |
| `/api/teacher/drive-status`                 | GET                      | Teacher: inspect Drive connection status.                                  |
| `/api/teacher/drive-picker`                 | GET                      | Teacher: get Drive picker configuration.                                   |
| `/api/auth/[...nextauth]`                   | NextAuth handlers        | Sign-in/session endpoints; see `src/auth.ts` for configuration.            |

Route validation is authoritative. See the matching `route.ts` before depending on an optional field, accepted value, limit, or exact response shape.

## HTTP examples

Set `BASE_URL` to the running app, and make authenticated requests through the browser session or an authorized test client. These examples show route contracts, not an authentication bypass.

### List students

```http
GET /api/students
```

Teacher only. The response is `{ "data": [...] }`; student objects contain profile/account-facing fields, never password hashes.

```json
{
  "data": [
    {
      "id": 42,
      "name": "Example Student",
      "grade": 8,
      "siteType": "math",
      "baseLanguage": null,
      "targetLanguage": null,
      "uiLanguage": "uk"
    }
  ]
}
```

### Create a student

```http
POST /api/students
Content-Type: application/json
```

The example omits the required `temporaryPassword` field intentionally; do not store passwords in shared documentation.

```json
{
  "name": "Example Student",
  "grade": 8,
  "email": "student@example.test",
  "siteType": "math"
}
```

The `temporaryPassword` field is required when creating an account. Supply it directly in the authenticated request; do not include real passwords in shared examples.

For `siteType: "languages"`, also provide distinct `baseLanguage` and `targetLanguage` values from `fr` or `ru`. A successful create returns `201` and `{ "data": student }`; invalid fields return `400`, and a duplicate email returns `409`.

### Create an assignment

```http
POST /api/assignments
Content-Type: application/json
```

```json
{
  "title": "Fractions practice",
  "instructions": "Complete exercises 1-5.",
  "resourceUrl": "https://example.test/work",
  "dueAt": "2026-10-28T15:00:00.000Z",
  "nextLessonAt": "2026-10-29T14:00:00.000Z",
  "studentIds": [42]
}
```

Teacher only. `title` is required, `studentIds` must contain at least one positive student ID, and resource URLs must use HTTP or HTTPS. Success returns `201` with `{ "data": { "id": 123 } }`.

### Read the student dashboard

```http
GET /api/student/dashboard
```

A student receives their own dashboard. A teacher can request a specific student with `GET /api/student/dashboard?studentId=42`. The result contains `student`, `textbooks`, `homeworks`, `progress`, `averageScore`, and `gradedCount` inside `data`.

### Query and create lessons

```http
GET /api/schedule?from=2026-10-01&to=2026-11-01&studentIds=42
```

```http
POST /api/schedule
Content-Type: application/json
```

```json
{
  "studentId": 42,
  "startsAt": "2026-10-29T14:00:00.000Z",
  "durationMinutes": 60
}
```

Schedule queries require a valid, increasing date range within the route's configured maximum. A one-off lesson is created with `201`; duplicate slots return `409`.

### Replace a student's weekly schedule

```http
PUT /api/students/42/schedule
Content-Type: application/json
```

Teacher only. This replaces the student's hourly rate and complete set of recurring weekly slots. `weekday` uses values 1-7, and `startTime` is a local time in `HH:mm` format.

```json
{
  "hourlyRate": 1500,
  "startsOn": "2026-10-26",
  "slots": [
    { "weekday": 1, "startTime": "16:00", "durationMinutes": 60 },
    { "weekday": 4, "startTime": "17:30", "durationMinutes": 45 }
  ]
}
```

Success returns `{ "data": { "saved": true } }`. Invalid schedules return `400`; an unknown student returns `404`.

### Query and record payments

```http
GET /api/payments?from=2026-10-01&to=2026-11-01
```

```http
POST /api/payments
Content-Type: application/json
```

```json
{
  "studentId": 42,
  "paidOn": "2026-10-21",
  "amount": 1500,
  "note": "October"
}
```

Payment and schedule range endpoints accept ISO calendar dates and enforce a configured maximum range. Amounts are integer UAH.

### Upload assignment files

`POST /api/assignments/[homeworkId]/submission` accepts `multipart/form-data` with one or more `file` fields. It is student-only and uploads to the configured Google Drive integration. The matching GET route is teacher-only and requires `studentId` and `fileId` query parameters to download an assigned student's file. Check `src/lib/homework-files.ts` for current size/type limits.

## Database schema

The schema is maintained by ordered SQL migrations. Key tables and relationships:

| Tables                                                                                | Purpose and key relationships                                                                                                                                                                   |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `students`, `student_accounts`, `teacher_accounts`                                    | Student profiles and teacher/student login records. `student_accounts.student_id` references `students.id`. Password salt/hash columns in both account tables are secret.                       |
| `student_drive_folders`, `teacher_google_tokens`                                      | Drive folder mapping and OAuth token records. Treat all token fields as secret.                                                                                                                 |
| `homeworks`, `homework_students`, `homework_submissions`, `homework_submission_files` | Assignments, student assignments, submission/grade state, and submitted Drive file metadata. Assignment/student relationships cascade on deletion.                                              |
| `textbooks`, `student_textbooks`                                                      | Shared grade-based textbook catalog and student-specific textbook links.                                                                                                                        |
| `nush_topics`, `nush_topic_materials`                                                 | Curriculum topics and their resources. From grade 7, subjects are `algebra` or `geometry`; earlier grades use `math`.                                                                           |
| `material_classes`, `material_topics`, `material_files`                               | Teacher-managed class materials; child topics/files cascade on parent deletion.                                                                                                                 |
| `student_lesson_slots`, `lessons`                                                     | Recurring weekly slots and dated lesson instances. Lesson status is `planned`, `held`, or `cancelled`. Times are stored as timestamps; recurring slots use Kyiv-local weekday/time conventions. |
| `student_payments`                                                                    | Payments received for a student; amounts are integer UAH.                                                                                                                                       |
| `student_telegram`                                                                    | Linked Telegram chat per student and a hashed one-time link token (15 minutes). Used for new-homework and grade notifications.                                                                  |
| `schema_migrations`                                                                   | Applied migration versions.                                                                                                                                                                     |

For complete columns, constraints, indexes, and migration history, read [`db/migrations/`](../db/migrations/). Notable constraints include grades 1-11, unique case-insensitive student email, unique `(student_id, scheduled_at)` lesson instances, and score range 0-12.

## SQL examples

Run read-only examples against a development branch/database. Replace IDs and dates with test values. Never select credential or password columns for routine inspection.

### Find assignments for a student

```sql
SELECT h.id, h.title, h.due_at, hs.student_id,
       sub.status, sub.score, sub.submitted_at
FROM homework_students AS hs
JOIN homeworks AS h ON h.id = hs.homework_id
LEFT JOIN homework_submissions AS sub
  ON sub.homework_id = hs.homework_id
 AND sub.student_id = hs.student_id
WHERE hs.student_id = 42
ORDER BY h.created_at DESC;
```

### Review a student's lessons in a date range

```sql
SELECT id, scheduled_at, starts_at, duration_minutes, status,
       hourly_rate, topic_title, topic_subject
FROM lessons
WHERE student_id = 42
  AND starts_at >= TIMESTAMPTZ '2026-10-01 00:00:00+00'
  AND starts_at < TIMESTAMPTZ '2026-11-01 00:00:00+00'
ORDER BY starts_at;
```

### Inspect a student's recurring lesson slots

```sql
SELECT weekday, start_time, duration_minutes, starts_on, ends_on
FROM student_lesson_slots
WHERE student_id = 42
ORDER BY weekday, start_time;
```

### Summarize recorded payments

```sql
SELECT student_id, COUNT(*) AS payment_count,
       SUM(amount) AS total_paid_uah
FROM student_payments
WHERE student_id = 42
  AND paid_on >= DATE '2026-10-01'
  AND paid_on < DATE '2026-11-01'
GROUP BY student_id;
```

### List class materials

```sql
SELECT mc.name AS class_name, mc.grade, mt.title AS topic_title,
       mf.name AS file_name, mf.file_type, mf.url
FROM material_classes AS mc
JOIN material_topics AS mt ON mt.class_id = mc.id
LEFT JOIN material_files AS mf ON mf.topic_id = mt.id
WHERE mc.grade = 8
ORDER BY mc.name, mt.created_at, mf.created_at;
```

In application code, keep values parameterized using the established Neon pattern:

```ts
const rows = await sql`
  SELECT id, name, grade
  FROM students
  WHERE id = ${studentId}
`;
```

Do not interpolate user-controlled values into raw SQL strings. Add schema changes as a new migration, then update this reference when table/API behavior changes.
