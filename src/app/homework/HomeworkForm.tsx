"use client";

import { useState, type FormEvent } from "react";
import type { HomeworkStudentOption } from "./types";

type HomeworkFormProps = {
  students: HomeworkStudentOption[];
  onCreate: (homework: {
    title: string;
    instructions: string;
    resourceUrl: string;
    dueAt: string | null;
    nextLessonAt: string | null;
    studentIds: number[];
  }) => Promise<boolean>;
};

export function HomeworkForm({ students, onCreate }: HomeworkFormProps) {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [nextLessonAt, setNextLessonAt] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleStudent = (studentId: number) => {
    setSelectedIds((currentIds) =>
      currentIds.includes(studentId)
        ? currentIds.filter((currentId) => currentId !== studentId)
        : [...currentIds, studentId],
    );
  };

  const selectedLabel = students
    .filter((student) => selectedIds.includes(student.id))
    .map((student) => `${student.name} · ${student.grade} клас`)
    .join(", ");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || selectedIds.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      const created = await onCreate({
        title: title.trim(),
        instructions: instructions.trim(),
        resourceUrl: resourceUrl.trim(),
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        nextLessonAt: nextLessonAt || null,
        studentIds: selectedIds,
      });
      if (created) {
        setTitle("");
        setInstructions("");
        setResourceUrl("");
        setDueAt("");
        setNextLessonAt("");
        setSelectedIds([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel homework-create-panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">НОВЕ ЗАВДАННЯ</span>
          <h2>Призначити домашню роботу</h2>
        </div>
      </div>
      {students.length === 0 ? (
        <p className="materials-empty">
          Спочатку створіть учнівські облікові записи.
        </p>
      ) : (
        <form className="homework-form" onSubmit={handleSubmit}>
          <div className="homework-form-fields">
            <div className="materials-form-field">
              <label htmlFor="homework-title">Тема</label>
              <input
                id="homework-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={160}
                required
              />
            </div>
            <div className="materials-form-field">
              <label htmlFor="homework-due">Термін здачі</label>
              <input
                id="homework-due"
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </div>
            <div className="materials-form-field">
              <label htmlFor="homework-next-lesson">Наступний урок</label>
              <input
                id="homework-next-lesson"
                type="date"
                value={nextLessonAt}
                onChange={(event) => setNextLessonAt(event.target.value)}
              />
            </div>
            <div className="materials-form-field homework-resource-field">
              <label htmlFor="homework-resource">
                Посилання на матеріал (необов&apos;язково)
              </label>
              <input
                id="homework-resource"
                type="url"
                value={resourceUrl}
                onChange={(event) => setResourceUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="materials-form-field homework-instructions-field">
              <label htmlFor="homework-instructions">Інструкція учню</label>
              <textarea
                id="homework-instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                maxLength={4000}
                rows={3}
              />
            </div>
          </div>
          <fieldset className="homework-student-picker">
            <legend>Кому призначити</legend>
            <details className="homework-student-dropdown">
              <summary title={selectedLabel || "Оберіть учнів"}>
                <span className="homework-student-selection">
                  {selectedLabel || "Оберіть учнів"}
                </span>
                <span className="homework-dropdown-chevron" aria-hidden="true">
                  ⌄
                </span>
              </summary>
              <div className="homework-student-options">
                {students.map((student) => (
                  <label className="homework-student-option" key={student.id}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                    />
                    <span>
                      {student.name} · {student.grade} клас
                    </span>
                  </label>
                ))}
              </div>
            </details>
          </fieldset>
          <button
            className="primary-button"
            type="submit"
            disabled={submitting || selectedIds.length === 0}
          >
            {submitting ? "Призначення…" : "Призначити домашню роботу"}
          </button>
        </form>
      )}
    </section>
  );
}
