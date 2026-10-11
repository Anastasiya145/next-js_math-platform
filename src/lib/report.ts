import type { StudentProgressPoint } from "@/lib/db";
import { isoToKyivLocal } from "@/lib/format";
import {
  isMoved,
  lessonPhase,
  type Lesson,
  type LessonPhase,
  type LessonTopic,
} from "@/lib/schedule";

export const MAX_REPORT_DAYS = 366;

export type ReportLesson = {
  startsAt: string;
  durationMinutes: number;
  phase: LessonPhase;
  isExtra: boolean;
  // The originally scheduled time when the lesson was moved.
  movedFrom: string | null;
  topic: LessonTopic | null;
};

// A topic taught in the period with the start times of the held lessons that covered it.
export type ReportTopic = { topic: LessonTopic; dates: string[] };

export type ReportGrade = { date: string; title: string; score: number };

export type StudentReport = {
  student: { name: string; grade: number };
  // Inclusive Kyiv dates (YYYY-MM-DD).
  from: string;
  to: string;
  generatedAt: string;
  summary: {
    total: number;
    held: number;
    heldMinutes: number;
    cancelled: number;
    moved: number;
    extra: number;
    upcoming: number;
    unmarked: number;
  };
  lessons: ReportLesson[];
  topics: ReportTopic[];
  grades: ReportGrade[];
  averageScore: number | null;
};

const topicKey = (topic: LessonTopic) => `${topic.subject}|${topic.title}`;

// Pure summary of a period: `lessons` and `progress` are already limited to one student.
export function buildStudentReport(input: {
  student: { name: string; grade: number };
  from: string;
  to: string;
  lessons: Lesson[];
  progress: StudentProgressPoint[];
  now: number;
}): StudentReport {
  const lessons: ReportLesson[] = input.lessons.map((lesson) => ({
    startsAt: lesson.startsAt,
    durationMinutes: lesson.durationMinutes,
    phase: lessonPhase(lesson, input.now),
    isExtra: lesson.isExtra,
    movedFrom: isMoved(lesson) ? lesson.scheduledAt : null,
    topic: lesson.topic,
  }));

  const held = lessons.filter((lesson) => lesson.phase === "held");
  const topics = new Map<string, ReportTopic>();
  for (const lesson of held) {
    if (!lesson.topic) continue;
    const entry = topics.get(topicKey(lesson.topic)) ?? { topic: lesson.topic, dates: [] };
    entry.dates.push(lesson.startsAt);
    topics.set(topicKey(lesson.topic), entry);
  }

  const grades: ReportGrade[] = input.progress
    .filter((point) => point.gradedAt !== null && point.score !== null)
    .filter((point) => {
      const day = isoToKyivLocal(point.lessonAt).slice(0, 10);
      return day >= input.from && day <= input.to;
    })
    .map((point) => ({ date: point.lessonAt, title: point.title, score: point.score ?? 0 }));

  const count = (phase: LessonPhase) => lessons.filter((lesson) => lesson.phase === phase).length;
  return {
    student: input.student,
    from: input.from,
    to: input.to,
    generatedAt: new Date(input.now).toISOString(),
    summary: {
      total: lessons.length,
      held: held.length,
      heldMinutes: held.reduce((sum, lesson) => sum + lesson.durationMinutes, 0),
      cancelled: count("cancelled"),
      moved: lessons.filter((lesson) => lesson.movedFrom !== null).length,
      extra: lessons.filter((lesson) => lesson.isExtra).length,
      upcoming: count("upcoming"),
      unmarked: count("unmarked"),
    },
    lessons,
    topics: [...topics.values()],
    grades,
    averageScore: grades.length
      ? grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length
      : null,
  };
}
