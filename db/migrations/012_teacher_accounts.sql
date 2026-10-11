-- Password login for the teacher, separate from student accounts
CREATE TABLE IF NOT EXISTS teacher_accounts (
  email TEXT PRIMARY KEY CHECK (length(email) <= 254 AND email = lower(email)),
  name TEXT NOT NULL CHECK (length(name) <= 120),
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
