-- Topic taught at a held lesson. The title and subject are copied so reports keep them if the NUSH topic is renamed or deleted.
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS topic_id INTEGER REFERENCES nush_topics(id) ON DELETE SET NULL;

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS topic_title TEXT CHECK (length(topic_title) <= 160);

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS topic_subject TEXT CHECK (topic_subject IN ('math', 'algebra', 'geometry'));
