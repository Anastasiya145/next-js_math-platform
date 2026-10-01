"use client";

import type { HomeworkStudentTarget, TeacherHomework } from "./types";
import { HomeworkStudentRow } from "./HomeworkStudentRow";

type HomeworkCardProps = {
  homework: TeacherHomework;
  onRefresh: () => Promise<void>;
};

export function HomeworkCard({ homework, onRefresh }: HomeworkCardProps) {
  const dueLabel = homework.dueAt
    ? new Intl.DateTimeFormat("uk-UA", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(homework.dueAt))
    : "Без терміну";
  const nextLessonLabel = homework.nextLessonAt
    ? new Intl.DateTimeFormat("uk-UA", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(`${homework.nextLessonAt}T00:00:00.000Z`))
    : null;

  return (
    <article className="panel homework-card">
      <div className="panel-header">
        <div>
          <span className="eyebrow">ТЕРМІН: {dueLabel}</span>
          <h2>{homework.title}</h2>
          {nextLessonLabel && (
            <p className="homework-next-lesson-label">
              Наступний урок: {nextLessonLabel}
            </p>
          )}
        </div>
        <span className="homework-recipient-count">
          {homework.students.length} учн.
        </span>
      </div>
      {homework.instructions && (
        <p className="homework-instructions">{homework.instructions}</p>
      )}
      {homework.resourceUrl && (
        <a
          className="text-button homework-resource-link"
          href={homework.resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Відкрити матеріал
        </a>
      )}
      <ul className="homework-student-list">
        {homework.students.map((student: HomeworkStudentTarget) => (
          <HomeworkStudentRow
            key={student.id}
            homeworkId={homework.id}
            student={student}
            onGraded={onRefresh}
          />
        ))}
      </ul>
    </article>
  );
}
