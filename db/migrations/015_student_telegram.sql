CREATE TABLE IF NOT EXISTS student_telegram (
  student_id INTEGER PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  chat_id BIGINT,
  linked_at TIMESTAMPTZ,
  link_token_hash TEXT UNIQUE,
  link_token_expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS student_telegram_chat_id_idx
  ON student_telegram (chat_id);
