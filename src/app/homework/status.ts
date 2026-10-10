import type { Tone } from "@/components/tones";

type StudentProgress = { status: string | null; gradedAt: string | null };

// Works the student sent (or marked "no homework") that the teacher has not graded yet.
export const pendingReviewCount = (homework: { students: StudentProgress[] }) =>
  homework.students.filter((student) => student.status && !student.gradedAt).length;

// One status for the whole assignment: the teacher's next step wins over waiting on students.
export function homeworkStatus(homework: { students: StudentProgress[] }): {
  label: string;
  tone: Tone;
} {
  const review = pendingReviewCount(homework);
  if (review) return { label: `На перевірку: ${review}`, tone: "warning" };

  const waiting = homework.students.filter((student) => !student.status).length;
  if (waiting) {
    const many = homework.students.length > 1;
    return { label: many ? `Очікує виконання: ${waiting}` : "Очікує виконання", tone: "info" };
  }
  return { label: "Перевірено", tone: "success" };
}
