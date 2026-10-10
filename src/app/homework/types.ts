export type HomeworkStudentTarget = {
  id: number;
  name: string;
  grade: number;
  status: "submitted" | "no_homework" | null;
  files: Array<{ id: number; name: string }>;
  score: number | null;
  feedback: string;
  submittedAt: string | null;
  gradedAt: string | null;
};

export type TeacherHomework = {
  id: number;
  title: string;
  instructions: string;
  resourceUrl: string;
  dueAt: string | null;
  nextLessonAt: string | null;
  createdAt: string;
  students: HomeworkStudentTarget[];
};

export type HomeworkStudentOption = {
  id: number;
  name: string;
  grade: number;
  email: string | null;
};
