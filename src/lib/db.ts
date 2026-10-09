import "server-only";
import { neon } from "@neondatabase/serverless";
import { errorMessages } from "@/lib/error-messages";

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

export type StudentWithEmail = Student & { email: string | null };

export type HomeworkSubmission = {
  status: "submitted" | "no_homework" | null;
  fileName: string | null;
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
    fileName: string | null;
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
    SELECT s.id, s.name, s.grade, s.created_at, a.email
    FROM students s LEFT JOIN student_accounts a ON a.student_id = s.id
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
): Promise<HomeworkDriveFile | null> {
  const rows = (await getDb()`
    SELECT drive_file_id AS "driveFileId", file_name AS "fileName"
    FROM homework_submissions
    WHERE homework_id = ${homeworkId} AND student_id = ${studentId}
      AND status = 'submitted'
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
      SELECT $1, $2, $3, $4, $5, $6
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
           sub.status, sub.file_name AS "fileName", sub.score, sub.feedback,
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
        nextLessonAt: toDate(row.nextLessonAt),
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
      fileName: row.fileName ? String(row.fileName) : null,
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
           sub.status, sub.file_name AS "fileName", sub.score, sub.feedback,
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
    nextLessonAt: toDate(row.nextLessonAt),
    createdAt: toTimestamp(row.createdAt) ?? "",
    isDemo: Boolean(row.isDemo),
    submission: {
      status: row.status as HomeworkSubmission["status"],
      fileName: row.fileName ? String(row.fileName) : null,
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
  driveFileId?: string | null;
  fileName?: string | null;
}): Promise<boolean> {
  const score = input.status === "no_homework" ? 0 : null;
  const rows = (await getDb()`
    INSERT INTO homework_submissions
      (homework_id, student_id, status, drive_file_id, file_name, score, submitted_at)
    VALUES
      (${input.homeworkId}, ${input.studentId}, ${input.status},
       ${input.driveFileId ?? null}, ${input.fileName ?? null}, ${score}, NOW())
    ON CONFLICT (homework_id, student_id) DO UPDATE SET
      status = EXCLUDED.status,
      drive_file_id = EXCLUDED.drive_file_id,
      file_name = EXCLUDED.file_name,
      score = EXCLUDED.score,
      feedback = '',
      submitted_at = NOW(),
      graded_at = NULL
    WHERE homework_submissions.graded_at IS NULL
    RETURNING homework_id
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

// NUS Topics

export type NushTopic = {
  id: number;
  grade: number;
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

export async function listNushTopicsForGrade(grade: number): Promise<NushTopic[]> {
  const rows = (await getDb()`
    SELECT id, grade, title, description
    FROM nush_topics
    WHERE grade = ${grade}
    ORDER BY title ASC
  `) as DatabaseRow[];
  return rows.map((row) => ({
    id: Number(row.id),
    grade: Number(row.grade),
    title: String(row.title),
    description: String(row.description ?? ""),
  }));
}

export async function createNushTopic(input: {
  grade: number;
  title: string;
  description?: string;
  createdBy: string;
}): Promise<NushTopic> {
  const rows = (await getDb()`
    INSERT INTO nush_topics (grade, title, description, created_by)
    VALUES (${input.grade}, ${input.title}, ${input.description ?? ""}, ${input.createdBy})
    RETURNING id, grade, title, description
  `) as DatabaseRow[];
  const row = rows[0];
  if (!row) throw new Error("Failed to create NUSH topic");
  return {
    id: Number(row.id),
    grade: Number(row.grade),
    title: String(row.title),
    description: String(row.description ?? ""),
  };
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
