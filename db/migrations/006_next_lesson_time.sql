-- Next lesson now has a time of day. Existing dates become midnight in Kyiv time.
ALTER TABLE homeworks
  ALTER COLUMN next_lesson_at TYPE TIMESTAMPTZ
  USING (next_lesson_at::timestamp AT TIME ZONE 'Europe/Kyiv');
