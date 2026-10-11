import { homeworkTime } from "@/lib/format";
import type { TeacherHomework } from "./types";

export type HomeworkSort = "date" | "student";

const studentKey = (homework: TeacherHomework) =>
  homework.students
    .map((student) => student.name)
    .sort((first, second) => first.localeCompare(second, "uk"))
    .join(", ");

// By date, or by student name first and then by date; `newestFirst` flips the date order.
export function sortHomework(items: TeacherHomework[], sort: HomeworkSort, newestFirst: boolean) {
  const direction = newestFirst ? -1 : 1;
  return [...items].sort((first, second) => {
    if (sort === "student") {
      const byStudent = studentKey(first).localeCompare(studentKey(second), "uk");
      if (byStudent) return byStudent;
    }
    return (homeworkTime(first) - homeworkTime(second)) * direction || first.id - second.id;
  });
}
