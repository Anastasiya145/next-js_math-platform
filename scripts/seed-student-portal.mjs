import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED is required to seed Neon data");
}

const sql = neon(connectionString);
const seedVersion = "002_student_portal_demo_data";
const seedAlreadyApplied = await sql`
  SELECT 1 FROM schema_migrations WHERE version = ${seedVersion}
`;
if (seedAlreadyApplied.length > 0) {
  console.log("Student portal demo data is already seeded.");
  process.exit(0);
}

const textbooks = [
  {
    demoKey: "demo-grade-6-math-practice",
    grade: 6,
    subject: "Математика",
    title: "Математика: тренажер і повторення",
    author: "Khan Academy",
    url: "https://www.khanacademy.org/math",
    resourceType: "practice",
    sortOrder: 1,
    isDemo: true,
  },
  {
    demoKey: "demo-grade-7-algebra-catalog",
    grade: 7,
    subject: "Алгебра",
    title: "Підручники з алгебри для 7 класу",
    author: "Каталог підручників",
    url: "https://pidruchnik.com/",
    resourceType: "textbook",
    sortOrder: 1,
    isDemo: true,
  },
  {
    demoKey: "demo-grade-7-geometry-practice",
    grade: 7,
    subject: "Геометрія",
    title: "Геометрія: інтерактивні побудови",
    author: "GeoGebra",
    url: "https://www.geogebra.org/geometry",
    resourceType: "practice",
    sortOrder: 2,
    isDemo: true,
  },
  {
    demoKey: "dima-merzlyak-algebra-9",
    grade: 9,
    subject: "Алгебра",
    title: "Збірник задач з алгебри, 9 клас",
    author: "А. Мерзляк",
    url: "https://pidruchnik.com/1482-algebra-zbrnik-zadach-merzlyak-9-klas.html",
    resourceType: "textbook",
    sortOrder: 1,
    isDemo: false,
  },
];

for (const textbook of textbooks) {
  await sql`
    INSERT INTO textbooks
      (grade, subject, title, author, url, resource_type, sort_order, is_demo, demo_key)
    VALUES
      (${textbook.grade}, ${textbook.subject}, ${textbook.title}, ${textbook.author},
       ${textbook.url}, ${textbook.resourceType}, ${textbook.sortOrder},
       ${textbook.isDemo}, ${textbook.demoKey})
    ON CONFLICT (demo_key) WHERE demo_key IS NOT NULL DO UPDATE SET
      grade = EXCLUDED.grade,
      subject = EXCLUDED.subject,
      title = EXCLUDED.title,
      author = EXCLUDED.author,
      url = EXCLUDED.url,
      resource_type = EXCLUDED.resource_type,
      sort_order = EXCLUDED.sort_order,
      is_demo = EXCLUDED.is_demo
  `;
}

const students = await sql`
  SELECT s.id
  FROM students s
  WHERE s.grade = 6
    AND EXISTS (SELECT 1 FROM student_accounts a WHERE a.student_id = s.id)
  ORDER BY s.id
  LIMIT 1
`;
if (!students[0]) {
  throw new Error("No grade 6 student account exists for the portal demo data");
}
const studentId = Number(students[0].id);

function dayOffset(offset) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

const homeworkSeeds = [
  {
    demoKey: "demo-maria-fractions-1",
    title: "Дроби та відсотки",
    instructions: "Повтори основні дії з дробами. Розв’яжи вправи 4–8.",
    lessonOffset: -21,
    score: 8,
    feedback: "Добрий початок. Перевір уважніше скорочення дробів.",
  },
  {
    demoKey: "demo-maria-ratios-2",
    title: "Відношення і пропорції",
    instructions: "Склади пропорцію та перевір відповідь оберненою дією.",
    lessonOffset: -14,
    score: 10,
    feedback: "Чудова робота з пропорціями.",
  },
  {
    demoKey: "demo-maria-expressions-3",
    title: "Числові вирази",
    instructions: "Дотримуйся порядку виконання дій.",
    lessonOffset: -7,
    score: 11,
    feedback: "Дуже уважно й майже без помилок.",
  },
];

for (const homework of homeworkSeeds) {
  const lessonDate = dayOffset(homework.lessonOffset);
  const [created] = await sql`
    INSERT INTO homeworks
      (title, instructions, resource_url, due_at, next_lesson_at,
       created_by, is_demo, demo_key)
    VALUES
      (${homework.title}, ${homework.instructions}, '',
       ${`${lessonDate}T09:00:00.000Z`}, ${lessonDate},
       'demo-seed', TRUE, ${homework.demoKey})
    ON CONFLICT (demo_key) WHERE demo_key IS NOT NULL DO UPDATE SET
      title = EXCLUDED.title,
      instructions = EXCLUDED.instructions,
      due_at = EXCLUDED.due_at,
      next_lesson_at = EXCLUDED.next_lesson_at,
      is_demo = TRUE
    RETURNING id
  `;
  const homeworkId = Number(created.id);

  await sql`
    INSERT INTO homework_students (homework_id, student_id)
    VALUES (${homeworkId}, ${studentId})
    ON CONFLICT (homework_id, student_id) DO NOTHING
  `;

  const submittedAt = `${lessonDate}T08:00:00.000Z`;
  const gradedAt = `${lessonDate}T12:00:00.000Z`;
  await sql`
    INSERT INTO homework_submissions
      (homework_id, student_id, status, score, feedback, submitted_at, graded_at)
    VALUES
      (${homeworkId}, ${studentId}, 'submitted', ${homework.score},
       ${homework.feedback}, ${submittedAt}, ${gradedAt})
    ON CONFLICT (homework_id, student_id) DO UPDATE SET
      status = EXCLUDED.status,
      score = EXCLUDED.score,
      feedback = EXCLUDED.feedback,
      submitted_at = EXCLUDED.submitted_at,
      graded_at = EXCLUDED.graded_at
    WHERE homework_submissions.drive_file_id IS NULL
  `;
}

const nextLesson = dayOffset(6);
const [active] = await sql`
  INSERT INTO homeworks
    (title, instructions, resource_url, due_at, next_lesson_at,
     created_by, is_demo, demo_key)
  VALUES
    ('Підготовка до уроку: десяткові дроби',
     'Повтори множення десяткових дробів і підготуй запитання до уроку.',
     '', ${`${nextLesson}T09:00:00.000Z`}, ${nextLesson},
     'demo-seed', TRUE, 'demo-maria-next-lesson')
  ON CONFLICT (demo_key) WHERE demo_key IS NOT NULL DO UPDATE SET
    title = EXCLUDED.title,
    instructions = EXCLUDED.instructions,
    due_at = EXCLUDED.due_at,
    next_lesson_at = EXCLUDED.next_lesson_at,
    is_demo = TRUE
  RETURNING id
`;
await sql`
  INSERT INTO homework_students (homework_id, student_id)
  VALUES (${Number(active.id)}, ${studentId})
  ON CONFLICT (homework_id, student_id) DO NOTHING
`;

const summary = await sql`
  SELECT
    (SELECT COUNT(*)::int FROM textbooks WHERE is_demo) AS demo_textbooks,
    (SELECT COUNT(*)::int FROM textbooks WHERE grade = 9 AND url = ${textbooks[3].url}) AS dima_book,
    (SELECT COUNT(*)::int FROM homework_students hs JOIN homeworks h ON h.id = hs.homework_id WHERE hs.student_id = ${studentId} AND h.is_demo) AS demo_homeworks,
    (SELECT COUNT(*)::int FROM homework_submissions sub JOIN homework_students hs USING (homework_id, student_id) JOIN homeworks h ON h.id = sub.homework_id WHERE sub.student_id = ${studentId} AND h.is_demo AND sub.graded_at IS NOT NULL) AS graded_demo_homeworks
`;
await sql`
  INSERT INTO schema_migrations (version)
  VALUES (${seedVersion})
  ON CONFLICT (version) DO NOTHING
`;
console.log(JSON.stringify(summary[0]));
