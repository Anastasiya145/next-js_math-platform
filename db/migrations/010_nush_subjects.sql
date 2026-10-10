-- NUS topics are split into algebra and geometry from grade 7, earlier grades use a single math subject

ALTER TABLE nush_topics ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT 'math';

UPDATE nush_topics SET subject = 'algebra' WHERE grade >= 7 AND subject = 'math';

UPDATE nush_topics SET subject = 'geometry'
WHERE grade >= 7 AND created_by = 'system' AND title IN (
  'Початкові геометричні відомості',
  'Паралельні прямі',
  'Трикутники',
  'Коло і круг. Геометричні побудови',
  'Чотирикутники',
  'Вписані та описані кола',
  'Подібність трикутників',
  'Теорема Піфагора',
  'Площі многокутників',
  'Розв''язування трикутників',
  'Правильні многокутники',
  'Декартові координати',
  'Вектори',
  'Геометричні перетворення',
  'Початки стереометрії',
  'Паралельність у просторі',
  'Перпендикулярність у просторі',
  'Координати і вектори в просторі',
  'Многогранники',
  'Тіла обертання',
  'Об''єми та площі поверхонь'
);

ALTER TABLE nush_topics DROP CONSTRAINT IF EXISTS nush_topics_subject_check;

ALTER TABLE nush_topics ADD CONSTRAINT nush_topics_subject_check CHECK (
  (grade < 7 AND subject = 'math') OR (grade >= 7 AND subject IN ('algebra', 'geometry'))
);
