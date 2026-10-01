import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { neon } from "@neondatabase/serverless";

const migrationVersion = "001_initial";
const sqlitePath = path.join(process.cwd(), "data", "app.db");
const schemaPath = path.join(
  process.cwd(),
  "db",
  "migrations",
  "001_initial.sql",
);
const connectionString = process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED is required to run the migration");
}
if (!existsSync(sqlitePath)) {
  throw new Error(`Local SQLite database was not found at ${sqlitePath}`);
}

const sql = neon(connectionString);
const knownTables = [
  "students",
  "student_accounts",
  "student_drive_folders",
  "homeworks",
  "homework_students",
  "homework_submissions",
];
const existingTables = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
`;
const applied = existingTables.some(
  (table) => table.table_name === "schema_migrations",
)
  ? await sql`SELECT 1 FROM schema_migrations WHERE version = ${migrationVersion}`
  : [];

if (applied.length > 0) {
  console.log("Migration 001_initial is already applied.");
  process.exit(0);
}

for (const tableName of knownTables) {
  if (!existingTables.some((table) => table.table_name === tableName)) continue;
  const [row] = await sql.query(
    `SELECT COUNT(*)::int AS count FROM ${tableName}`,
  );
  if (row.count > 0) {
    throw new Error(
      `Neon table ${tableName} already contains data; refusing to import SQLite over it.`,
    );
  }
}

const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
try {
  const students = sqlite
    .prepare("SELECT id, name, grade, created_at FROM students ORDER BY id")
    .all();
  const accounts = sqlite
    .prepare(
      `SELECT student_id, email, password_salt, password_hash, created_at
       FROM student_accounts ORDER BY student_id`,
    )
    .all();
  const driveFolders = sqlite
    .prepare(
      `SELECT student_id, drive_folder_id, created_at
       FROM student_drive_folders ORDER BY student_id`,
    )
    .all();
  const homeworks = sqlite
    .prepare(
      `SELECT id, title, instructions, resource_url, due_at, created_by, created_at
       FROM homeworks ORDER BY id`,
    )
    .all();
  const assignments = sqlite
    .prepare(
      "SELECT homework_id, student_id FROM homework_students ORDER BY homework_id, student_id",
    )
    .all();
  const submissions = sqlite
    .prepare(
      `SELECT homework_id, student_id, status, drive_file_id, file_name,
              score, feedback, submitted_at, graded_at
       FROM homework_submissions ORDER BY homework_id, student_id`,
    )
    .all();

  const schema = readFileSync(schemaPath, "utf8");
  const schemaStatements = schema
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of schemaStatements) {
    await sql.query(statement);
  }

  const migration = [];
  for (const student of students) {
    migration.push(sql`
      INSERT INTO students (id, name, grade, created_at)
      VALUES (${student.id}, ${student.name}, ${student.grade}, ${student.created_at})
    `);
  }
  for (const account of accounts) {
    migration.push(sql`
      INSERT INTO student_accounts
        (student_id, email, password_salt, password_hash, created_at)
      VALUES
        (${account.student_id}, ${account.email.trim().toLowerCase()},
         ${account.password_salt}, ${account.password_hash}, ${account.created_at})
    `);
  }
  for (const folder of driveFolders) {
    migration.push(sql`
      INSERT INTO student_drive_folders (student_id, drive_folder_id, created_at)
      VALUES (${folder.student_id}, ${folder.drive_folder_id}, ${folder.created_at})
    `);
  }
  for (const homework of homeworks) {
    migration.push(sql`
      INSERT INTO homeworks
        (id, title, instructions, resource_url, due_at, created_by, created_at)
      VALUES
        (${homework.id}, ${homework.title}, ${homework.instructions},
         ${homework.resource_url}, ${homework.due_at}, ${homework.created_by},
         ${homework.created_at})
    `);
  }
  for (const assignment of assignments) {
    migration.push(sql`
      INSERT INTO homework_students (homework_id, student_id)
      VALUES (${assignment.homework_id}, ${assignment.student_id})
    `);
  }
  for (const submission of submissions) {
    migration.push(sql`
      INSERT INTO homework_submissions
        (homework_id, student_id, status, drive_file_id, file_name, score,
         feedback, submitted_at, graded_at)
      VALUES
        (${submission.homework_id}, ${submission.student_id}, ${submission.status},
         ${submission.drive_file_id}, ${submission.file_name}, ${submission.score},
         ${submission.feedback}, ${submission.submitted_at}, ${submission.graded_at})
    `);
  }

  migration.push(sql`
    SELECT setval(
      pg_get_serial_sequence('students', 'id'),
      COALESCE(MAX(id), 1),
      COUNT(*) > 0
    ) FROM students
  `);
  migration.push(sql`
    SELECT setval(
      pg_get_serial_sequence('homeworks', 'id'),
      COALESCE(MAX(id), 1),
      COUNT(*) > 0
    ) FROM homeworks
  `);
  migration.push(sql`
    INSERT INTO schema_migrations (version) VALUES (${migrationVersion})
  `);

  await sql.transaction(migration);
  console.log(
    JSON.stringify({
      migration: migrationVersion,
      students: students.length,
      accounts: accounts.length,
      driveFolders: driveFolders.length,
      homeworks: homeworks.length,
      assignments: assignments.length,
      submissions: submissions.length,
    }),
  );
} finally {
  sqlite.close();
}
