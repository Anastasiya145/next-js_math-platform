# Product Context

## What it is

A mathematics tutoring workspace with separate teacher and student experiences. The teacher dashboard organizes learners, classes, teaching materials, individually assigned homework, submissions, grades, and student progress. Students see only work assigned to their account.

## Roles and access

- The teacher signs in through the configured Google account or an email/password account supported by Auth.js.
- The teacher creates student accounts with an email and temporary password; student passwords are stored as scrypt hashes.
- A student session is scoped by its database student ID. Homework reads and submissions are checked against that student's assignments in the API, not merely hidden in the UI.
- Existing roster entries without an email account remain teacher-managed records and cannot sign in until the teacher provisions credentials.

## Homework and progress

- Teachers assign a homework item to one or more selected students.
- Students can submit an allowed file through the server to the teacher's Google Drive, or report "Немає ДЗ"; that report creates a score of 0.
- The teacher reviews each submission, sets a score from 0 to 12, and can leave feedback. The student can see the result for their own assigned work.
- Progress is shown in chronological order with an average and a table alternative. Unchecked submissions are not treated as grades.
- The teacher's Drive receives a separate folder per student on the student's first upload. Drive access requires the Google Drive API, the `drive.file` scope, and a new Google consent after the scope is added.
- The student portal shows textbooks and practice links matching the student's class, active and graded homework, the next lesson date, average score, and an accessible progress chart. Teachers manage class-specific textbook links from Materials.

## Product principles

- Make routine teaching administration clear and quick.
- Keep learner information grouped by class and protect student-specific data at every API boundary.
- Make due work, missing homework, submissions, and grades understandable without relying on color alone.
- Use supportive, plain Ukrainian in end-user workflows.
- Do not present static sample dashboard numbers as live analytics.

## Storage and scope notes

Neon Postgres stores application data and the teacher's Google Drive stores homework files. Auth.js remains the identity provider; Neon stores student account hashes and application records. Class folders and topics under Materials are kept in memory by `/api/materials` and are not persisted yet. Verify routes and API handlers before treating navigation labels or static dashboard figures as implemented product behavior.
