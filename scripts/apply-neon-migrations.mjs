import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED is required to run migrations");
}

const migrationDirectory = path.join(process.cwd(), "db", "migrations");
const files = readdirSync(migrationDirectory)
  .filter((file) => /^\d+_.+\.sql$/.test(file))
  .sort();
const sql = neon(connectionString);
const appliedRows = await sql`SELECT version FROM schema_migrations`;
const applied = new Set(appliedRows.map((row) => row.version));

for (const file of files) {
  const version = file.replace(/\.sql$/, "");
  if (applied.has(version)) continue;

  const statements = readFileSync(path.join(migrationDirectory, file), "utf8")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.query(statement);
  }
  await sql`
    INSERT INTO schema_migrations (version)
    VALUES (${version})
    ON CONFLICT (version) DO NOTHING
  `;
  console.log(`Applied ${version}`);
}
