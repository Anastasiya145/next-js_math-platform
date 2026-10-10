import "server-only";
import { neon } from "@neondatabase/serverless";
import { errorMessages } from "@/lib/error-messages";
import { kyivLocalToIso } from "@/lib/format";
import { NUSH_SPLIT_GRADE, type NushSubject } from "@/lib/nush";
import type { PaymentsData } from "@/lib/payments";
import {
  buildLessons,
  findSlotFor,
  type LessonRow,
  type LessonSlot,
  type LessonStatus,
  type ScheduleData,
  type ScheduleStudent,
} from "@/lib/schedule";

type DatabaseRow = Record<string, unknown>;
type NeonClient = ReturnType<typeof neon>;

let client: NeonClient | null = null;

function getDb(): NeonClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error(errorMessages.database.urlMissing);
  client ??= neon(connectionString);
  return client;
}

function toTimestamp(value: unknown): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function toJsonList(value: unknown): DatabaseRow[] {
  const list: unknown = typeof value === "string" ? JSON.parse(value) : value;
  return Array.isArray(list) ? (list as DatabaseRow[]) : [];
}

function toSubmissionFiles(value: unknown): SubmissionFile[] {
  return toJsonList(value).map((file) => ({ id: Number(file.id), name: String(file.name) }));
}

function toDate(value: unknown): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function mapStudent(row: DatabaseRow): Student {
  return {
    id: Number(row.id),
    name: String(row.name),
    grade: Number(row.grade),
    created_at: toTimestamp(row.created_at) ?? "",
  };
}

function mapStudentWithEmail(row: DatabaseRow): StudentWithEmail {
  return {
    ...mapStudent(row),
    email: typeof row.email === "string" ? row.email : null,
    hasDriveFolder: row.has_drive_folder === true,
  };
}

export type Student = {
  id: number;
  name: string;
  grade: number;
  created_at: string;
};

export type StudentAccount = Student & {
  email: string;
  password_salt: string;
  password_hash: string;
};

export type StudentWithEmail = Student & { email: string | null; hasDriveFolder?: boolean };

export type SubmissionFile = { id: number; name: string };

export type HomeworkSubmission = {
  status: "submitted" | "no_homework" | null;
  files: SubmissionFile[];
  score: number | null;
  feedback: string;
  submittedAt: string | null;
  gradedAt: string | null;
};

export type HomeworkDriveFile = {
  driveFileId: string;
  fileName: string;
};

export type StudentHomework = {
  id: number;
  title: string;
  instructions: string;
  resourceUrl: string;
  dueAt: string | null;
  nextLessonAt: string | null;
  createdAt: string;
  isDemo: boolean;
  submission: HomeworkSubmission;
};

export type StudentTextbook = {
  id: number;
  grade: number;
  subject: string;
  title: string;
  author: string;
  url: string;
  resourceType: "textbook" | "practice";
  isDemo: boolean;
};

export type HomeworkForTeacher = Omit<StudentHomework, "submission"> & {
  students: Array<{
    id: number;
    name: string;
    grade: number;
    status: HomeworkSubmission["status"];
    files: SubmissionFile[];
    score: number | null;
    feedback: string;
    submittedAt: string | null;
    gradedAt: string | null;
  }>;
};

export type StudentProgressPoint = {
  homeworkId: number;
  title: string;
  submittedAt: string;
  status: "submitted" | "no_homework";
  score: number | null;
  gradedAt: string | null;
};

export async function listTextbooksForGrade(grade: number): Promise<StudentTextbook[]> {
  const rows = (await getDb()`
    SELECT id, grade, subject, title, author, url,
           resource_type AS "resourceType", is_demo AS "isDemo"
    FROM textbooks
    WHERE grade = ${grade}
    ORDER BY sort_order ASC, subject ASC, id ASC
  `) as DatabaseRow[];
  return rows.map((row) => ({
    id: Number(row.id),
    grade: Number(row.grade),
    subject: String(row.subject),
    title: String(row.title),
    author: String(row.author ?? ""),
    url: String(row.url),
    resourceType: row.resourceType as StudentTextbook["resourceType"],
    isDemo: Boolean(row.isDemo),
  }));
}

export async function listAllTextbooks(): Promise<StudentTextbook[]> {
  const rows = (await getDb()`
    SELECT id, grade, subject, title, author, url,
           resource_type AS "resourceType", is_demo AS "isDemo"
    FROM textbooks
    ORDER BY grade ASC, subject ASC, sort_order ASC, id ASC
  `) as DatabaseRow[];
  return rows.map((row) => ({
    id: Number(row.id),
    grade: Number(row.grade),
    subject: String(row.subject),
    title: String(row.title),
    author: String(row.author ?? ""),
    url: String(row.url),
    resourceType: row.resourceType as StudentTextbook["resourceType"],
    isDemo: Boolean(row.isDemo),
  }));
}

export async function createTextbook(input: {
  grade: number;
  subject: string;
  title: string;
  author: string;
  url: string;
  resourceType: StudentTextbook["resourceType"];
}): Promise<void> {
  await getDb()`
    INSERT INTO textbooks (grade, subject, title, author, url, resource_type)
    VALUES (
      ${input.grade}, ${input.subject}, ${input.title}, ${input.author},
      ${input.url}, ${input.resourceType}
    )
  `;
}

export async function deleteTextbook(textbookId: number): Promise<boolean> {
  const rows = (await getDb()`
    DELETE FROM textbooks WHERE id = ${textbookId} RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function updateTextbook(
  textbookId: number,
  input: Parameters<typeof createTextbook>[0],
): Promise<boolean> {
  const rows = (await getDb()`
    UPDATE textbooks
    SET grade = ${input.grade}, subject = ${input.subject}, title = ${input.title},
        author = ${input.author}, url = ${input.url}, resource_type = ${input.resourceType}
    WHERE id = ${textbookId}
    RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function listStudents(): Promise<Student[]> {
  const rows = (await getDb()`
    SELECT id, name, grade, created_at FROM students ORDER BY grade ASC, id ASC
  `) as DatabaseRow[];
  return rows.map(mapStudent);
}

export async function createStudentAccount(input: {
  name: string;
  grade: number;
  email: string;
  passwordSalt: string;
  passwordHash: string;
}): Promise<StudentWithEmail> {
  const sql = getDb();
  const rows = (await sql`
    WITH new_student AS (
      INSERT INTO students (name, grade)
      VALUES (${input.name}, ${input.grade})
      RETURNING id, name, grade, created_at
    ), new_account AS (
      INSERT INTO student_accounts (student_id, email, password_salt, password_hash)
      SELECT id, ${input.email.trim().toLowerCase()}, ${input.passwordSalt}, ${input.passwordHash}
      FROM new_student
      RETURNING student_id, email
    )
    SELECT s.id, s.name, s.grade, s.created_at, a.email
    FROM new_student s JOIN new_account a ON a.student_id = s.id
  `) as DatabaseRow[];
  if (!rows[0]) throw new Error(errorMessages.database.studentCreateFailed);
  return mapStudentWithEmail(rows[0]);
}

export async function findStudentAccount(email: string): Promise<StudentAccount | null> {
  const rows = (await getDb()`
    SELECT s.id, s.name, s.grade, s.created_at, a.email,
           a.password_salt, a.password_hash
    FROM student_accounts a JOIN students s ON s.id = a.student_id
    WHERE lower(a.email) = ${email.trim().toLowerCase()}
  `) as DatabaseRow[];
  const row = rows[0];
  if (!row) return null;
  return {
    ...mapStudent(row),
    email: String(row.email),
    password_salt: String(row.password_salt),
    password_hash: String(row.password_hash),
  };
}

export async function listStudentsWithEmail(): Promise<StudentWithEmail[]> {
  const rows = (await getDb()`
    SELECT s.id, s.name, s.grade, s.created_at, a.email,
           f.drive_folder_id IS NOT NULL AS has_drive_folder
    FROM students s
    LEFT JOIN student_accounts a ON a.student_id = s.id
    LEFT JOIN student_drive_folders f ON f.student_id = s.id
    ORDER BY s.grade ASC, s.id ASC
  `) as DatabaseRow[];
  return rows.map(mapStudentWithEmail);
}

export async function updateStudent(input: {
  studentId: number;
  name: string;
  grade: number;
  email: string;
  passwordSalt?: string;
  passwordHash?: string;
}): Promise<StudentWithEmail | null> {
  const sql = getDb();
  const existingRows = (await sql`
    SELECT email, password_salt, password_hash
    FROM student_accounts WHERE student_id = ${input.studentId}
  `) as DatabaseRow[];
  const existingAccount = existingRows[0];
  const email = input.email.trim().toLowerCase();
  if (!existingAccount && email && (!input.passwordSalt || !input.passwordHash)) {
    throw new Error(errorMessages.database.temporaryPasswordRequired);
  }

  const passwordSalt =
    input.passwordSalt ??
    (typeof existingAccount?.password_salt === "string" ? existingAccount.password_salt : null);
  const passwordHash =
    input.passwordHash ??
    (typeof existingAccount?.password_hash === "string" ? existingAccount.password_hash : null);
  const rows = (await sql`
    WITH updated_student AS (
      UPDATE students SET name = ${input.name}, grade = ${input.grade}
      WHERE id = ${input.studentId}
      RETURNING id, name, grade, created_at
    ), account_write AS (
      INSERT INTO student_accounts (student_id, email, password_salt, password_hash)
      SELECT id, ${email || existingAccount?.email || null},
             ${passwordSalt}, ${passwordHash}
      FROM updated_student
      WHERE ${Boolean(existingAccount) || Boolean(email)}
      ON CONFLICT (student_id) DO UPDATE SET
        email = EXCLUDED.email,
        password_salt = EXCLUDED.password_salt,
        password_hash = EXCLUDED.password_hash
      RETURNING student_id, email
    )
    SELECT s.id, s.name, s.grade, s.created_at, a.email
    FROM updated_student s
    LEFT JOIN account_write a ON a.student_id = s.id
  `) as DatabaseRow[];
  return rows[0] ? mapStudentWithEmail(rows[0]) : null;
}

export async function updateStudentPassword(
  studentId: number,
  passwordSalt: string,
  passwordHash: string,
): Promise<void> {
  await getDb()`
    UPDATE student_accounts
    SET password_salt = ${passwordSalt}, password_hash = ${passwordHash}
    WHERE student_id = ${studentId}
  `;
}

export async function getStudentById(studentId: number): Promise<Student | null> {
  const rows = (await getDb()`
    SELECT id, name, grade, created_at FROM students WHERE id = ${studentId}
  `) as DatabaseRow[];
  return rows[0] ? mapStudent(rows[0]) : null;
}

export async function getStudentDriveFolderId(studentId: number): Promise<string | null> {
  const rows = (await getDb()`
    SELECT drive_folder_id FROM student_drive_folders WHERE student_id = ${studentId}
  `) as DatabaseRow[];
  return typeof rows[0]?.drive_folder_id === "string" ? rows[0].drive_folder_id : null;
}

export async function setStudentDriveFolderId(
  studentId: number,
  driveFolderId: string,
): Promise<string> {
  const sql = getDb();
  await sql`
    INSERT INTO student_drive_folders (student_id, drive_folder_id)
    VALUES (${studentId}, ${driveFolderId})
    ON CONFLICT (student_id) DO NOTHING
  `;
  const existing = await getStudentDriveFolderId(studentId);
  if (!existing) throw new Error(errorMessages.database.driveFolderSaveFailed);
  return existing;
}

// Returns false when the folder is already linked to another student (UNIQUE constraint).
export async function replaceStudentDriveFolderId(
  studentId: number,
  driveFolderId: string,
): Promise<boolean> {
  const sql = getDb();
  const taken = (await sql`
    SELECT 1 FROM student_drive_folders
    WHERE drive_folder_id = ${driveFolderId} AND student_id <> ${studentId}
  `) as DatabaseRow[];
  if (taken.length > 0) return false;

  await sql`
    INSERT INTO student_drive_folders (student_id, drive_folder_id)
    VALUES (${studentId}, ${driveFolderId})
    ON CONFLICT (student_id) DO UPDATE SET drive_folder_id = EXCLUDED.drive_folder_id
  `;
  return true;
}

export async function isHomeworkAssignedToStudent(
  homeworkId: number,
  studentId: number,
): Promise<boolean> {
  const rows = (await getDb()`
    SELECT 1 FROM homework_students
    WHERE homework_id = ${homeworkId} AND student_id = ${studentId}
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function getHomeworkSubmissionFile(
  homeworkId: number,
  studentId: number,
  fileId: number,
): Promise<HomeworkDriveFile | null> {
  const rows = (await getDb()`
    SELECT drive_file_id AS "driveFileId", file_name AS "fileName"
    FROM homework_submission_files
    WHERE id = ${fileId} AND homework_id = ${homeworkId} AND student_id = ${studentId}
  `) as DatabaseRow[];
  const row = rows[0];
  return row
    ? {
        driveFileId: String(row.driveFileId),
        fileName: String(row.fileName),
      }
    : null;
}

export async function createHomework(input: {
  title: string;
  instructions: string;
  resourceUrl: string;
  dueAt: string | null;
  nextLessonAt: string | null;
  createdBy: string;
  studentIds: number[];
}): Promise<number> {
  const studentIds = [...new Set(input.studentIds)];
  if (studentIds.length === 0) throw new Error(errorMessages.database.homeworkStudentRequired);

  const studentPlaceholders = studentIds.map((_, index) => `$${index + 7}`).join(", ");
  const query = `
    WITH valid_students AS (
      SELECT id FROM students WHERE id IN (${studentPlaceholders})
    ), new_homework AS (
      INSERT INTO homeworks
        (title, instructions, resource_url, due_at, next_lesson_at, created_by)
      SELECT $1, $2, $3, $4, $5::timestamptz, $6
      WHERE (SELECT COUNT(*) FROM valid_students) = ${studentIds.length}
      RETURNING id
    ), assignments AS (
      INSERT INTO homework_students (homework_id, student_id)
      SELECT new_homework.id, valid_students.id
      FROM new_homework CROSS JOIN valid_students
    )
    SELECT id FROM new_homework
  `;
  const rows = (await getDb().query(query, [
    input.title,
    input.instructions,
    input.resourceUrl,
    input.dueAt,
    input.nextLessonAt,
    input.createdBy,
    ...studentIds,
  ])) as DatabaseRow[];
  if (!rows[0]) throw new Error(errorMessages.database.homeworkStudentsMissing);
  return Number(rows[0].id);
}

export async function listHomeworkForTeacher(): Promise<HomeworkForTeacher[]> {
  const rows = (await getDb()`
        SELECT h.id, h.title, h.instructions, h.resource_url AS "resourceUrl",
          h.due_at AS "dueAt", h.next_lesson_at AS "nextLessonAt",
              h.created_at AS "createdAt", h.is_demo AS "isDemo",
           s.id AS "studentId", s.name AS "studentName", s.grade AS "studentGrade",
           sub.status, sub.score, sub.feedback,
           COALESCE((
             SELECT json_agg(json_build_object('id', f.id, 'name', f.file_name) ORDER BY f.id)
             FROM homework_submission_files f
             WHERE f.homework_id = h.id AND f.student_id = s.id
           ), '[]'::json) AS files,
           sub.submitted_at AS "submittedAt", sub.graded_at AS "gradedAt"
    FROM homeworks h
    JOIN homework_students hs ON hs.homework_id = h.id
    JOIN students s ON s.id = hs.student_id
    LEFT JOIN homework_submissions sub
      ON sub.homework_id = h.id AND sub.student_id = s.id
    WHERE h.is_demo = FALSE
    ORDER BY h.created_at DESC, s.grade ASC, s.name ASC
  `) as DatabaseRow[];

  const homeworks = new Map<number, HomeworkForTeacher>();
  for (const row of rows) {
    const id = Number(row.id);
    let homework = homeworks.get(id);
    if (!homework) {
      homework = {
        id,
        title: String(row.title),
        instructions: String(row.instructions ?? ""),
        resourceUrl: String(row.resourceUrl ?? ""),
        dueAt: row.dueAt ? String(row.dueAt) : null,
        nextLessonAt: toTimestamp(row.nextLessonAt),
        createdAt: toTimestamp(row.createdAt) ?? "",
        isDemo: Boolean(row.isDemo),
        students: [],
      };
      homeworks.set(id, homework);
    }
    homework.students.push({
      id: Number(row.studentId),
      name: String(row.studentName),
      grade: Number(row.studentGrade),
      status: row.status as HomeworkSubmission["status"],
      files: toSubmissionFiles(row.files),
      score: row.score === null ? null : Number(row.score),
      feedback: String(row.feedback ?? ""),
      submittedAt: toTimestamp(row.submittedAt),
      gradedAt: toTimestamp(row.gradedAt),
    });
  }
  return [...homeworks.values()];
}

export async function listHomeworkForStudent(studentId: number): Promise<StudentHomework[]> {
  const rows = (await getDb()`
        SELECT h.id, h.title, h.instructions, h.resource_url AS "resourceUrl",
          h.due_at AS "dueAt", h.next_lesson_at AS "nextLessonAt",
          h.created_at AS "createdAt", h.is_demo AS "isDemo",
           sub.status, sub.score, sub.feedback,
           COALESCE((
             SELECT json_agg(json_build_object('id', f.id, 'name', f.file_name) ORDER BY f.id)
             FROM homework_submission_files f
             WHERE f.homework_id = h.id AND f.student_id = hs.student_id
           ), '[]'::json) AS files,
           sub.submitted_at AS "submittedAt", sub.graded_at AS "gradedAt"
    FROM homework_students hs
    JOIN homeworks h ON h.id = hs.homework_id
    LEFT JOIN homework_submissions sub
      ON sub.homework_id = h.id AND sub.student_id = hs.student_id
    WHERE hs.student_id = ${studentId}
    ORDER BY h.due_at IS NULL, h.due_at ASC, h.created_at DESC
  `) as DatabaseRow[];

  return rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title),
    instructions: String(row.instructions ?? ""),
    resourceUrl: String(row.resourceUrl ?? ""),
    dueAt: toTimestamp(row.dueAt),
    nextLessonAt: toTimestamp(row.nextLessonAt),
    createdAt: toTimestamp(row.createdAt) ?? "",
    isDemo: Boolean(row.isDemo),
    submission: {
      status: row.status as HomeworkSubmission["status"],
      files: toSubmissionFiles(row.files),
      score: row.score === null ? null : Number(row.score),
      feedback: String(row.feedback ?? ""),
      submittedAt: toTimestamp(row.submittedAt),
      gradedAt: toTimestamp(row.gradedAt),
    },
  }));
}

export async function saveHomeworkSubmission(input: {
  homeworkId: number;
  studentId: number;
  status: "submitted" | "no_homework";
  files?: HomeworkDriveFile[];
}): Promise<boolean> {
  const files = input.files ?? [];
  const score = input.status === "no_homework" ? 0 : null;
  const fileValues = files
    .map((_, index) => `($${index * 2 + 5}::text, $${index * 2 + 6}::text)`)
    .join(", ");
  const addFiles = files.length
    ? `, added AS (
      INSERT INTO homework_submission_files (homework_id, student_id, drive_file_id, file_name)
      SELECT saved.homework_id, saved.student_id, v.drive_file_id, v.file_name
      FROM saved CROSS JOIN (VALUES ${fileValues}) AS v(drive_file_id, file_name)
    )`
    : "";
  const query = `
    WITH saved AS (
      INSERT INTO homework_submissions (homework_id, student_id, status, score, submitted_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (homework_id, student_id) DO UPDATE SET
        status = EXCLUDED.status,
        drive_file_id = NULL,
        file_name = NULL,
        score = EXCLUDED.score,
        feedback = '',
        submitted_at = NOW(),
        graded_at = NULL
      WHERE homework_submissions.graded_at IS NULL
      RETURNING homework_id, student_id
    ), cleared AS (
      DELETE FROM homework_submission_files f USING saved
      WHERE f.homework_id = saved.homework_id AND f.student_id = saved.student_id
    )${addFiles}
    SELECT homework_id FROM saved
  `;
  const rows = (await getDb().query(query, [
    input.homeworkId,
    input.studentId,
    input.status,
    score,
    ...files.flatMap((file) => [file.driveFileId, file.fileName]),
  ])) as DatabaseRow[];
  return rows.length > 0;
}

export async function listScheduleStudents(studentIds?: number[]): Promise<ScheduleStudent[]> {
  const rows = (await getDb()`
    SELECT s.id, s.name, s.grade, s.hourly_rate AS "hourlyRate",
      COALESCE((
        SELECT json_agg(json_build_object(
          'weekday', l.weekday,
          'startTime', to_char(l.start_time, 'HH24:MI'),
          'durationMinutes', l.duration_minutes,
          'startsOn', l.starts_on::text,
          'endsOn', l.ends_on::text
        ) ORDER BY l.weekday, l.start_time)
        FROM student_lesson_slots l
        WHERE l.student_id = s.id
      ), '[]'::json) AS slots
    FROM students s
    ORDER BY s.grade ASC, s.name ASC, s.id ASC
  `) as DatabaseRow[];
  const wanted = studentIds ? new Set(studentIds) : null;
  return rows
    .filter((row) => !wanted || wanted.has(Number(row.id)))
    .map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      grade: Number(row.grade),
      hourlyRate: Number(row.hourlyRate),
      slots: toJsonList(row.slots).map(
        (slot): LessonSlot => ({
          weekday: Number(slot.weekday),
          startTime: String(slot.startTime),
          durationMinutes: Number(slot.durationMinutes),
          startsOn: String(slot.startsOn),
          endsOn: slot.endsOn ? String(slot.endsOn) : null,
        }),
      ),
    }));
}

// `from` and `to` are Kyiv dates (YYYY-MM-DD), `to` exclusive.
export async function listLessons(range: {
  from: string;
  to: string;
  studentIds?: number[];
}): Promise<ScheduleData> {
  const rangeStart = kyivLocalToIso(`${range.from}T00:00`);
  const rangeEnd = kyivLocalToIso(`${range.to}T00:00`);
  const [students, rows] = await Promise.all([
    listScheduleStudents(range.studentIds),
    getDb()`
      SELECT student_id AS "studentId", scheduled_at AS "scheduledAt", starts_at AS "startsAt",
             duration_minutes AS "durationMinutes", status, is_extra AS "isExtra",
             hourly_rate AS "hourlyRate"
      FROM lessons
      WHERE (starts_at >= ${rangeStart} AND starts_at < ${rangeEnd})
         OR (scheduled_at >= ${rangeStart} AND scheduled_at < ${rangeEnd})
    ` as Promise<DatabaseRow[]>,
  ]);
  const lessonRows: LessonRow[] = rows.map((row) => ({
    studentId: Number(row.studentId),
    scheduledAt: toTimestamp(row.scheduledAt) ?? "",
    startsAt: toTimestamp(row.startsAt) ?? "",
    durationMinutes: Number(row.durationMinutes),
    status: row.status as LessonStatus,
    isExtra: Boolean(row.isExtra),
    hourlyRate: Number(row.hourlyRate),
  }));
  return {
    students,
    lessons: buildLessons({ students, rows: lessonRows, from: range.from, to: range.to }),
  };
}

// Saves the rate and, when the weekly slots changed, closes the old ones and starts the new ones on `startsOn`.
export async function setStudentSchedule(input: {
  studentId: number;
  hourlyRate: number;
  startsOn: string;
  slots: Array<{ weekday: number; startTime: string; durationMinutes: number }>;
}): Promise<boolean> {
  const [student] = await listScheduleStudents([input.studentId]);
  if (!student) return false;

  const signature = (slot: { weekday: number; startTime: string; durationMinutes: number }) =>
    `${slot.weekday}|${slot.startTime}|${slot.durationMinutes}`;
  const active = new Set(student.slots.filter((slot) => slot.endsOn === null).map(signature));
  const next = new Set(input.slots.map(signature));
  const changed = active.size !== next.size || [...next].some((item) => !active.has(item));
  const newSlots = changed ? input.slots : [];

  const values = newSlots
    .map(
      (_, index) =>
        `($${index * 3 + 5}::smallint, $${index * 3 + 6}::time, $${index * 3 + 7}::integer)`,
    )
    .join(", ");
  const addSlots = newSlots.length
    ? `, added AS (
      INSERT INTO student_lesson_slots (student_id, weekday, start_time, duration_minutes, starts_on)
      SELECT updated.id, v.weekday, v.start_time, v.duration_minutes, $3::date
      FROM updated CROSS JOIN (VALUES ${values}) AS v(weekday, start_time, duration_minutes)
    )`
    : "";
  const query = `
    WITH updated AS (
      UPDATE students SET hourly_rate = $2 WHERE id = $1 RETURNING id
    ), closed AS (
      UPDATE student_lesson_slots SET ends_on = $3::date - 1
      WHERE student_id = $1 AND ends_on IS NULL AND starts_on < $3::date AND $4::boolean
    ), removed AS (
      DELETE FROM student_lesson_slots
      WHERE student_id = $1 AND ends_on IS NULL AND starts_on >= $3::date AND $4::boolean
    )${addSlots}
    SELECT id FROM updated
  `;
  const rows = (await getDb().query(query, [
    input.studentId,
    input.hourlyRate,
    input.startsOn,
    changed,
    ...newSlots.flatMap((slot) => [slot.weekday, slot.startTime, slot.durationMinutes]),
  ])) as DatabaseRow[];
  return rows.length > 0;
}

// Marks a lesson, moves it (`startsAt`) or puts it back to planned. Returns false when no such lesson exists.
export async function updateLesson(input: {
  studentId: number;
  scheduledAt: string;
  status?: LessonStatus;
  startsAt?: string;
}): Promise<boolean> {
  const sql = getDb();
  const rows = (await sql`
    SELECT starts_at AS "startsAt", duration_minutes AS "durationMinutes", status,
           is_extra AS "isExtra"
    FROM lessons
    WHERE student_id = ${input.studentId} AND scheduled_at = ${input.scheduledAt}
  `) as DatabaseRow[];
  const existing = rows[0];

  let durationMinutes: number;
  if (existing) {
    durationMinutes = Number(existing.durationMinutes);
  } else {
    const [student] = await listScheduleStudents([input.studentId]);
    const slot = student ? findSlotFor(student.slots, input.scheduledAt) : null;
    if (!slot) return false;
    durationMinutes = slot.durationMinutes;
  }

  const startsAt =
    input.startsAt ??
    (existing ? (toTimestamp(existing.startsAt) ?? input.scheduledAt) : input.scheduledAt);
  const status: LessonStatus =
    input.status ?? (input.startsAt || !existing ? "planned" : (existing.status as LessonStatus));

  // A planned lesson at its original time is just the schedule again, so it needs no row.
  if (!existing?.isExtra && status === "planned" && startsAt === input.scheduledAt) {
    await sql`
      DELETE FROM lessons
      WHERE student_id = ${input.studentId} AND scheduled_at = ${input.scheduledAt}
    `;
    return true;
  }

  await sql`
    INSERT INTO lessons (student_id, scheduled_at, starts_at, duration_minutes, status, hourly_rate)
    SELECT ${input.studentId}::integer, ${input.scheduledAt}::timestamptz,
           ${startsAt}::timestamptz, ${durationMinutes}::integer, ${status}::text, s.hourly_rate
    FROM students s WHERE s.id = ${input.studentId}
    ON CONFLICT (student_id, scheduled_at) DO UPDATE SET
      starts_at = EXCLUDED.starts_at,
      status = EXCLUDED.status,
      hourly_rate = CASE
        WHEN lessons.status = 'held' AND EXCLUDED.status = 'held' THEN lessons.hourly_rate
        ELSE EXCLUDED.hourly_rate
      END
  `;
  return true;
}

export async function createExtraLesson(input: {
  studentId: number;
  startsAt: string;
  durationMinutes: number;
}): Promise<"created" | "duplicate" | "missing"> {
  const [student] = await listScheduleStudents([input.studentId]);
  if (!student) return "missing";
  if (findSlotFor(student.slots, input.startsAt)) return "duplicate";

  const rows = (await getDb()`
    INSERT INTO lessons
      (student_id, scheduled_at, starts_at, duration_minutes, status, is_extra, hourly_rate)
    VALUES
      (${input.studentId}, ${input.startsAt}, ${input.startsAt}, ${input.durationMinutes},
       'planned', TRUE, ${student.hourlyRate})
    ON CONFLICT (student_id, scheduled_at) DO NOTHING
    RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0 ? "created" : "duplicate";
}

// Removes an added lesson or drops the mark of a scheduled one, so it becomes planned again.
export async function deleteLesson(studentId: number, scheduledAt: string): Promise<boolean> {
  const rows = (await getDb()`
    DELETE FROM lessons
    WHERE student_id = ${studentId} AND scheduled_at = ${scheduledAt}
    RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

// `from` and `to` are dates (YYYY-MM-DD), `to` exclusive. Balances cover all time.
export async function listPayments(range: { from: string; to: string }): Promise<PaymentsData> {
  const sql = getDb();
  const [balances, payments] = (await Promise.all([
    sql`
      SELECT s.id, s.name,
        COALESCE((
          SELECT SUM(ROUND(l.hourly_rate * l.duration_minutes / 60.0))
          FROM lessons l WHERE l.student_id = s.id AND l.status = 'held'
        ), 0)::int AS earned,
        COALESCE((
          SELECT SUM(p.amount) FROM student_payments p WHERE p.student_id = s.id
        ), 0)::int AS paid
      FROM students s
      ORDER BY s.name ASC, s.id ASC
    `,
    sql`
      SELECT p.id, p.student_id AS "studentId", s.name AS "studentName",
             p.paid_on::text AS "paidOn", p.amount, p.note
      FROM student_payments p
      JOIN students s ON s.id = p.student_id
      WHERE p.paid_on >= ${range.from}::date AND p.paid_on < ${range.to}::date
      ORDER BY p.paid_on DESC, p.id DESC
    `,
  ])) as [DatabaseRow[], DatabaseRow[]];
  return {
    balances: balances.map((row) => ({
      studentId: Number(row.id),
      name: String(row.name),
      earned: Number(row.earned),
      paid: Number(row.paid),
      balance: Number(row.earned) - Number(row.paid),
    })),
    payments: payments.map((row) => ({
      id: Number(row.id),
      studentId: Number(row.studentId),
      studentName: String(row.studentName),
      paidOn: String(row.paidOn),
      amount: Number(row.amount),
      note: String(row.note),
    })),
  };
}

export async function createPayment(input: {
  studentId: number;
  paidOn: string;
  amount: number;
  note: string;
}): Promise<boolean> {
  const rows = (await getDb()`
    INSERT INTO student_payments (student_id, paid_on, amount, note)
    SELECT s.id, ${input.paidOn}::date, ${input.amount}, ${input.note}
    FROM students s WHERE s.id = ${input.studentId}
    RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function updatePayment(input: {
  id: number;
  paidOn: string;
  amount: number;
  note: string;
}): Promise<boolean> {
  const rows = (await getDb()`
    UPDATE student_payments
    SET paid_on = ${input.paidOn}::date, amount = ${input.amount}, note = ${input.note}
    WHERE id = ${input.id}
    RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function deletePayment(id: number): Promise<boolean> {
  const rows = (await getDb()`
    DELETE FROM student_payments WHERE id = ${id} RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function gradeHomework(input: {
  homeworkId: number;
  studentId: number;
  score: number;
  feedback: string;
}): Promise<boolean> {
  const rows = (await getDb()`
    UPDATE homework_submissions
    SET score = ${input.score}, feedback = ${input.feedback}, graded_at = NOW()
    WHERE homework_id = ${input.homeworkId} AND student_id = ${input.studentId}
    RETURNING homework_id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function getStudentProgress(studentId: number): Promise<StudentProgressPoint[]> {
  const rows = (await getDb()`
        SELECT h.id AS "homeworkId", h.title,
          sub.submitted_at AS "submittedAt", sub.status, sub.score,
          sub.graded_at AS "gradedAt"
    FROM homework_submissions sub
    JOIN homeworks h ON h.id = sub.homework_id
    WHERE sub.student_id = ${studentId}
    ORDER BY sub.submitted_at ASC, h.id ASC
  `) as DatabaseRow[];
  return rows.map((row) => ({
    homeworkId: Number(row.homeworkId),
    title: String(row.title),
    submittedAt: toTimestamp(row.submittedAt) ?? "",
    status: row.status as StudentProgressPoint["status"],
    score: row.score == null ? null : Number(row.score),
    gradedAt: toTimestamp(row.gradedAt),
  }));
}

export async function deleteStudent(id: number): Promise<void> {
  await getDb()`DELETE FROM students WHERE id = ${id}`;
}

// Removes the assignment together with its student links and submissions (FK cascade).
export async function deleteHomework(homeworkId: number): Promise<boolean> {
  const rows = (await getDb()`
    DELETE FROM homeworks WHERE id = ${homeworkId} RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export type HomeworkUpdateResult = "updated" | "notFound" | "studentsMissing" | "studentLocked";

// Updates the assignment and its student list. Students with a submission cannot be removed.
export async function updateHomework(input: {
  homeworkId: number;
  title: string;
  instructions: string;
  resourceUrl: string;
  nextLessonAt: string | null;
  studentIds: number[];
}): Promise<HomeworkUpdateResult> {
  const studentIds = [...new Set(input.studentIds)];
  if (studentIds.length === 0) throw new Error(errorMessages.database.homeworkStudentRequired);

  const sql = getDb();
  const idList = (offset: number) => studentIds.map((_, index) => `$${index + offset}`).join(", ");
  const [homeworks, students, locked] = (await Promise.all([
    sql`SELECT id FROM homeworks WHERE id = ${input.homeworkId}`,
    sql.query(`SELECT id FROM students WHERE id IN (${idList(1)})`, studentIds),
    sql.query(
      `SELECT 1 FROM homework_submissions
       WHERE homework_id = $1 AND student_id NOT IN (${idList(2)}) LIMIT 1`,
      [input.homeworkId, ...studentIds],
    ),
  ])) as DatabaseRow[][];
  if (homeworks.length === 0) return "notFound";
  if (students.length !== studentIds.length) return "studentsMissing";
  if (locked.length > 0) return "studentLocked";

  await sql.query(
    `WITH updated AS (
       UPDATE homeworks
       SET title = $2, instructions = $3, resource_url = $4, next_lesson_at = $5::timestamptz
       WHERE id = $1
       RETURNING id
     ), removed AS (
       DELETE FROM homework_students
       WHERE homework_id = $1 AND student_id NOT IN (${idList(6)})
     ), added AS (
       INSERT INTO homework_students (homework_id, student_id)
       SELECT $1, id FROM students WHERE id IN (${idList(6)})
       ON CONFLICT DO NOTHING
     )
     SELECT id FROM updated`,
    [
      input.homeworkId,
      input.title,
      input.instructions,
      input.resourceUrl,
      input.nextLessonAt,
      ...studentIds,
    ],
  );
  return "updated";
}

// NUS Topics

export type NushTopic = {
  id: number;
  grade: number;
  subject: NushSubject;
  title: string;
  description: string;
};

export type NushTopicMaterial = {
  id: number;
  topicId: number;
  name: string;
  url: string;
  materialType: "google_drive" | "naurok" | "pdf" | "doc" | "link" | "other";
};

const toNushTopic = (row: DatabaseRow): NushTopic => ({
  id: Number(row.id),
  grade: Number(row.grade),
  subject: row.subject as NushSubject,
  title: String(row.title),
  description: String(row.description ?? ""),
});

export async function listNushTopicsForGrade(grade: number): Promise<NushTopic[]> {
  const rows = (await getDb()`
    SELECT id, grade, subject, title, description
    FROM nush_topics
    WHERE grade = ${grade}
    ORDER BY id ASC
  `) as DatabaseRow[];
  return rows.map(toNushTopic);
}

export async function createNushTopic(input: {
  grade: number;
  subject: NushSubject;
  title: string;
  description?: string;
  createdBy: string;
}): Promise<NushTopic> {
  const rows = (await getDb()`
    INSERT INTO nush_topics (grade, subject, title, description, created_by)
    VALUES (${input.grade}, ${input.subject}, ${input.title}, ${input.description ?? ""}, ${input.createdBy})
    RETURNING id, grade, subject, title, description
  `) as DatabaseRow[];
  const row = rows[0];
  if (!row) throw new Error("Failed to create NUSH topic");
  return toNushTopic(row);
}

export async function getNushTopicMaterials(topicId: number): Promise<NushTopicMaterial[]> {
  const rows = (await getDb()`
    SELECT id, topic_id, name, url, material_type
    FROM nush_topic_materials
    WHERE topic_id = ${topicId}
    ORDER BY created_at DESC
  `) as DatabaseRow[];
  return rows.map((row) => ({
    id: Number(row.id),
    topicId: Number(row.topic_id),
    name: String(row.name),
    url: String(row.url),
    materialType: row.material_type as NushTopicMaterial["materialType"],
  }));
}

export async function addNushTopicMaterial(input: {
  topicId: number;
  name: string;
  url: string;
  materialType: NushTopicMaterial["materialType"];
}): Promise<NushTopicMaterial> {
  const rows = (await getDb()`
    INSERT INTO nush_topic_materials (topic_id, name, url, material_type)
    VALUES (${input.topicId}, ${input.name}, ${input.url}, ${input.materialType})
    RETURNING id, topic_id, name, url, material_type
  `) as DatabaseRow[];
  const row = rows[0];
  if (!row) throw new Error("Failed to add NUSH topic material");
  return {
    id: Number(row.id),
    topicId: Number(row.topic_id),
    name: String(row.name),
    url: String(row.url),
    materialType: row.material_type as NushTopicMaterial["materialType"],
  };
}

export async function deleteNushTopicMaterial(materialId: number): Promise<void> {
  await getDb()`DELETE FROM nush_topic_materials WHERE id = ${materialId}`;
}

export async function deleteNushTopic(topicId: number): Promise<void> {
  await getDb()`DELETE FROM nush_topics WHERE id = ${topicId}`;
}

export async function updateNushTopic(input: {
  topicId: number;
  title: string;
  description: string;
  subject?: NushSubject;
}): Promise<boolean> {
  // The subject only changes for grades that are split into algebra and geometry.
  const rows = (await getDb()`
    UPDATE nush_topics SET title = ${input.title}, description = ${input.description},
      subject = CASE WHEN grade >= ${NUSH_SPLIT_GRADE}
        THEN COALESCE(${input.subject ?? null}::text, subject) ELSE subject END
    WHERE id = ${input.topicId}
    RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function updateNushTopicMaterial(input: {
  materialId: number;
  name: string;
  url: string;
  materialType: NushTopicMaterial["materialType"];
}): Promise<boolean> {
  const rows = (await getDb()`
    UPDATE nush_topic_materials
    SET name = ${input.name}, url = ${input.url}, material_type = ${input.materialType}
    WHERE id = ${input.materialId}
    RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

// Class materials (classes -> topics -> files)

export type MaterialFileType = "pdf" | "doc" | "image" | "link" | "other";

export type MaterialFile = {
  id: number;
  name: string;
  url: string;
  type: MaterialFileType;
  addedAt: string;
};

export type MaterialClass = {
  id: number;
  className: string;
  driveFolderUrl: string;
  topics: Array<{ id: number; title: string; files: MaterialFile[] }>;
};

export async function listMaterialClasses(): Promise<MaterialClass[]> {
  const sql = getDb();
  const [classes, topics, files] = (await Promise.all([
    sql`SELECT id, name, drive_folder_url FROM material_classes ORDER BY grade ASC, name ASC, id ASC`,
    sql`SELECT id, class_id, title FROM material_topics ORDER BY created_at ASC, id ASC`,
    sql`SELECT id, topic_id, name, url, file_type, created_at FROM material_files ORDER BY created_at ASC, id ASC`,
  ])) as DatabaseRow[][];

  const filesByTopic = Object.groupBy(files, (row) => Number(row.topic_id));
  const topicsByClass = Object.groupBy(topics, (row) => Number(row.class_id));
  return classes.map((row) => ({
    id: Number(row.id),
    className: String(row.name),
    driveFolderUrl: String(row.drive_folder_url ?? ""),
    topics: (topicsByClass[Number(row.id)] ?? []).map((topic) => ({
      id: Number(topic.id),
      title: String(topic.title),
      files: (filesByTopic[Number(topic.id)] ?? []).map((file) => ({
        id: Number(file.id),
        name: String(file.name),
        url: String(file.url),
        type: file.file_type as MaterialFileType,
        addedAt: toDate(file.created_at) ?? "",
      })),
    })),
  }));
}

export async function createMaterialClass(input: {
  name: string;
  grade: number;
  createdBy: string;
}): Promise<number> {
  const rows = (await getDb()`
    INSERT INTO material_classes (name, grade, created_by)
    VALUES (${input.name}, ${input.grade}, ${input.createdBy})
    RETURNING id
  `) as DatabaseRow[];
  return Number(rows[0]?.id);
}

export async function deleteMaterialClass(classId: number): Promise<boolean> {
  const rows = (await getDb()`
    DELETE FROM material_classes WHERE id = ${classId} RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function setMaterialClassDriveFolder(
  classId: number,
  driveFolderUrl: string,
): Promise<boolean> {
  const rows = (await getDb()`
    UPDATE material_classes SET drive_folder_url = ${driveFolderUrl}
    WHERE id = ${classId} RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function updateMaterialClass(input: {
  classId: number;
  name: string;
  grade: number;
}): Promise<boolean> {
  const rows = (await getDb()`
    UPDATE material_classes SET name = ${input.name}, grade = ${input.grade}
    WHERE id = ${input.classId} RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function createMaterialTopic(classId: number, title: string): Promise<boolean> {
  const rows = (await getDb()`
    INSERT INTO material_topics (class_id, title)
    SELECT id, ${title} FROM material_classes WHERE id = ${classId}
    RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function deleteMaterialTopic(classId: number, topicId: number): Promise<boolean> {
  const rows = (await getDb()`
    DELETE FROM material_topics WHERE id = ${topicId} AND class_id = ${classId} RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function updateMaterialTopic(input: {
  classId: number;
  topicId: number;
  title: string;
}): Promise<boolean> {
  const rows = (await getDb()`
    UPDATE material_topics SET title = ${input.title}
    WHERE id = ${input.topicId} AND class_id = ${input.classId} RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function addMaterialFile(input: {
  classId: number;
  topicId: number;
  name: string;
  url: string;
  type: MaterialFileType;
}): Promise<boolean> {
  const rows = (await getDb()`
    INSERT INTO material_files (topic_id, name, url, file_type)
    SELECT id, ${input.name}, ${input.url}, ${input.type}
    FROM material_topics WHERE id = ${input.topicId} AND class_id = ${input.classId}
    RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function deleteMaterialFile(input: {
  classId: number;
  topicId: number;
  fileId: number;
}): Promise<boolean> {
  const rows = (await getDb()`
    DELETE FROM material_files f
    USING material_topics t
    WHERE f.id = ${input.fileId} AND f.topic_id = t.id
      AND t.id = ${input.topicId} AND t.class_id = ${input.classId}
    RETURNING f.id
  `) as DatabaseRow[];
  return rows.length > 0;
}

export async function updateMaterialFile(input: {
  classId: number;
  topicId: number;
  fileId: number;
  name: string;
  url: string;
  type: MaterialFileType;
}): Promise<boolean> {
  const rows = (await getDb()`
    UPDATE material_files f
    SET name = ${input.name}, url = ${input.url}, file_type = ${input.type}
    FROM material_topics t
    WHERE f.id = ${input.fileId} AND f.topic_id = t.id
      AND t.id = ${input.topicId} AND t.class_id = ${input.classId}
    RETURNING f.id
  `) as DatabaseRow[];
  return rows.length > 0;
}

// Student Textbooks

export type PersonalStudentTextbook = {
  id: number;
  studentId: number;
  title: string;
  url: string;
  subject: string;
};

export async function getStudentTextbooks(studentId: number): Promise<PersonalStudentTextbook[]> {
  const rows = (await getDb()`
    SELECT id, student_id, title, url, subject
    FROM student_textbooks
    WHERE student_id = ${studentId}
    ORDER BY subject ASC, created_at DESC
  `) as DatabaseRow[];
  return rows.map((row) => ({
    id: Number(row.id),
    studentId: Number(row.student_id),
    title: String(row.title),
    url: String(row.url),
    subject: String(row.subject ?? ""),
  }));
}

export async function addStudentTextbook(input: {
  studentId: number;
  title: string;
  url: string;
  subject?: string;
}): Promise<PersonalStudentTextbook> {
  const rows = (await getDb()`
    INSERT INTO student_textbooks (student_id, title, url, subject)
    VALUES (${input.studentId}, ${input.title}, ${input.url}, ${input.subject ?? ""})
    RETURNING id, student_id, title, url, subject
  `) as DatabaseRow[];
  const row = rows[0];
  if (!row) throw new Error("Failed to add student textbook");
  return {
    id: Number(row.id),
    studentId: Number(row.student_id),
    title: String(row.title),
    url: String(row.url),
    subject: String(row.subject ?? ""),
  };
}

export async function deleteStudentTextbook(textbookId: number): Promise<void> {
  await getDb()`DELETE FROM student_textbooks WHERE id = ${textbookId}`;
}

export async function updateStudentTextbook(input: {
  studentId: number;
  textbookId: number;
  title: string;
  url: string;
  subject: string;
}): Promise<boolean> {
  const rows = (await getDb()`
    UPDATE student_textbooks
    SET title = ${input.title}, url = ${input.url}, subject = ${input.subject}
    WHERE id = ${input.textbookId} AND student_id = ${input.studentId}
    RETURNING id
  `) as DatabaseRow[];
  return rows.length > 0;
}

// Teacher Google Drive Tokens

export type TeacherGoogleToken = {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

export async function getTeacherGoogleToken(email: string): Promise<TeacherGoogleToken | null> {
  const rows = (await getDb()`
    SELECT email, access_token AS "accessToken", refresh_token AS "refreshToken",
           expires_at AS "expiresAt"
    FROM teacher_google_tokens
    WHERE lower(email) = ${email.trim().toLowerCase()}
  `) as DatabaseRow[];
  const row = rows[0];
  if (!row) return null;
  return {
    email: String(row.email),
    accessToken: String(row.accessToken),
    refreshToken: String(row.refreshToken),
    expiresAt: toTimestamp(row.expiresAt) ?? "",
  };
}

export async function saveTeacherGoogleToken(input: {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}): Promise<void> {
  const expiresAtDate = new Date(input.expiresAt);
  await getDb()`
    INSERT INTO teacher_google_tokens (email, access_token, refresh_token, expires_at)
    VALUES (
      ${input.email.trim().toLowerCase()},
      ${input.accessToken},
      ${input.refreshToken},
      ${expiresAtDate.toISOString()}
    )
    ON CONFLICT (email) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
  `;
}
