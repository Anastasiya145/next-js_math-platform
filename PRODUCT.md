# Product Context

## What it is

A tutoring workspace with two student-facing products and a shared teacher dashboard:

- Mathematics remains Ukrainian and organizes learners, classes, teaching materials, assigned homework, submissions, grades, and progress.
- Language learning has a French/Russian interface. Student profiles store their product, base language, learning language, and preferred interface language.

Student accounts default to the mathematics product in Ukrainian. The current language-learning profile is configured for French as the base language and Russian as the learning language. The language site currently reuses the existing student portal and assignment/resource data model; it does not yet provide a separate language-course authoring workflow.

## Roles and access

- The teacher signs in through the configured Google account or an email/password account supported by Auth.js.
- The teacher creates student accounts with an email and temporary password; student passwords are stored as scrypt hashes.
- A student session is scoped by its database student ID. Homework reads and submissions are checked against that student's assignments in the API, not merely hidden in the UI.
- Existing roster entries without an email account remain teacher-managed records and cannot sign in until the teacher provisions credentials.

## Homework and progress

- Teachers assign a homework item to one or more selected students.
- Students can submit an allowed file through the server to the teacher's Google Drive, or report "Немає ДЗ"; that report creates a score of 0.
- Until the teacher grades a submission, the student can replace the sent files from the completed list (the new files replace the old ones); grading locks it.
- The teacher reviews each submission, sets a score from 0 to 12, and can leave feedback. The student can see the result for their own assigned work.
- Progress is shown in chronological order by the date of the lesson the homework was for (not by when it was submitted or graded), with an average and a table alternative. Unchecked submissions are not treated as grades.
- The teacher's Drive receives a separate folder per student on the student's first upload. Drive access requires the Google Drive API, the `drive.file` scope, and a new Google consent after the scope is added.
- The student portal shows textbooks and practice links matching the student's class, active and graded homework, the next lesson date, average score, and an accessible progress chart. Teachers manage class-specific textbook links from Materials.

## Lessons and reports

- The teacher keeps a weekly lesson schedule per student and marks each lesson as held or cancelled. Lessons can be moved or added as extra ones.
- Marking a lesson as held asks for its topic, chosen from the NUSH topics of the student's class. From grade 7 the topics are split into algebra and geometry. The topic can be changed later, and its title is copied to the lesson so reports survive later edits of the topic list.
- From a student's cabinet the teacher can download a PDF report for any period of up to 366 days (inclusive dates, Kyiv time). It shows the number and hours of held lessons, cancelled and moved lessons, the lesson list with statuses and topics, topics learned, and the homework score chart with the average, dated by lesson. Moved lessons are counted by the actual date of the lesson.

## Product principles

- Make routine teaching administration clear and quick.
- Keep learner information grouped by class and protect student-specific data at every API boundary.
- Make due work, missing homework, submissions, and grades understandable without relying on color alone.
- Use supportive, plain Ukrainian in mathematics workflows and French or Russian in language-learning student workflows.
- Do not present static sample dashboard numbers as live analytics.

## Storage and scope notes

Neon Postgres stores application data and the teacher's Google Drive stores homework files. Auth.js remains the identity provider; Neon stores student and teacher account hashes and application records, including textbook links, NUSH topics, the lesson schedule, and payments. Verify routes and API handlers before treating navigation labels or static dashboard figures as implemented product behavior.
