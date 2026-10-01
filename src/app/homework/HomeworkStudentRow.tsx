"use client";

import { useState, type FormEvent } from "react";
import { errorMessages } from "@/lib/error-messages";
import { router } from "../router";
import type { HomeworkStudentTarget } from "./types";

type HomeworkStudentRowProps = {
  homeworkId: number;
  student: HomeworkStudentTarget;
  onGraded: () => Promise<void>;
};

export function HomeworkStudentRow({
  homeworkId,
  student,
  onGraded,
}: HomeworkStudentRowProps) {
  const [score, setScore] = useState(
    String(student.score ?? (student.status === "no_homework" ? 0 : "")),
  );
  const [feedback, setFeedback] = useState(student.feedback);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGrade = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(router.api.homeworkGrade(homeworkId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          score: Number(score),
          feedback,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? errorMessages.homework.gradeSaveFailed);
        return;
      }
      await onGraded();
    } catch {
      setError(errorMessages.homework.gradeSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="homework-student-row">
      <div className="homework-student-heading">
        <b>{student.name}</b>
        <span>{student.grade} клас</span>
      </div>
      {student.status === "submitted" ? (
        <div className="homework-submission-status">
          <span>Роботу надіслано</span>
          {student.fileName && (
            <a
              className="text-button"
              href={`${router.api.homeworkSubmission(homeworkId)}?studentId=${student.id}`}
            >
              Завантажити файл
            </a>
          )}
        </div>
      ) : student.status === "no_homework" ? (
        <p className="homework-no-work">
          Учень повідомив, що домашнього завдання немає · 0 балів
        </p>
      ) : (
        <p className="materials-empty">Ще не виконано</p>
      )}
      {student.status && (
        <form className="homework-grade-form" onSubmit={handleGrade}>
          <div className="materials-form-field">
            <label htmlFor={`score-${homeworkId}-${student.id}`}>
              Оцінка (0–12)
            </label>
            <input
              id={`score-${homeworkId}-${student.id}`}
              type="number"
              min={0}
              max={12}
              step={1}
              value={score}
              onChange={(event) => setScore(event.target.value)}
              required
            />
          </div>
          <div className="materials-form-field">
            <label htmlFor={`feedback-${homeworkId}-${student.id}`}>
              Коментар учню
            </label>
            <input
              id={`feedback-${homeworkId}-${student.id}`}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              maxLength={2000}
            />
          </div>
          <button className="text-button" type="submit" disabled={saving}>
            {saving ? "Збереження…" : "Зберегти оцінку"}
          </button>
          {error && (
            <p className="materials-error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </li>
  );
}
