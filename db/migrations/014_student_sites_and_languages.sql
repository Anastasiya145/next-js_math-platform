ALTER TABLE students
  ADD COLUMN IF NOT EXISTS site_type TEXT NOT NULL DEFAULT 'math'
    CHECK (site_type IN ('math', 'languages')),
  ADD COLUMN IF NOT EXISTS base_language TEXT
    CHECK (base_language IS NULL OR base_language IN ('fr', 'ru')),
  ADD COLUMN IF NOT EXISTS target_language TEXT
    CHECK (target_language IS NULL OR target_language IN ('fr', 'ru')),
  ADD COLUMN IF NOT EXISTS ui_language TEXT NOT NULL DEFAULT 'uk'
    CHECK (ui_language IN ('uk', 'fr', 'ru'));

UPDATE students AS s
SET site_type = 'languages',
    base_language = 'fr',
    target_language = 'ru',
    ui_language = 'fr'
FROM student_accounts AS a
WHERE a.student_id = s.id
  AND lower(a.email) = 'martin.loizel@gmail.com';