import type { LanguageLevel, StudentCourseTopic } from "@/lib/language-course";

export type StudentHomeworkItem = {
  id: number;
  title: string;
  instructions: string;
  resourceUrl: string;
  dueAt: string | null;
  nextLessonAt: string | null;
  createdAt: string;
  isDemo: boolean;
  topic: { id: number; title: string } | null;
  submission: {
    status: "submitted" | "no_homework" | null;
    files: Array<{ id: number; name: string }>;
    score: number | null;
    feedback: string;
    submittedAt: string | null;
    gradedAt: string | null;
  };
};

export type StudentDashboardData = {
  student: {
    id: number;
    name: string;
    grade: number;
    languageLevel: LanguageLevel | null;
  };
  // Language students only; null for mathematics.
  course: StudentCourseTopic[] | null;
  textbooks: Array<{
    id: number;
    grade: number;
    subject: string;
    title: string;
    author: string;
    url: string;
    resourceType: "textbook" | "practice";
    isDemo: boolean;
  }>;
  homeworks: StudentHomeworkItem[];
  progress: Array<{
    homeworkId: number;
    title: string;
    lessonAt: string;
    status: "submitted" | "no_homework";
    score: number | null;
    gradedAt: string | null;
  }>;
  averageScore: number | null;
  gradedCount: number;
};
