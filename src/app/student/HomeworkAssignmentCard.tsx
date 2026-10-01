"use client";

import { useState, type FormEvent } from "react";
import { errorMessages } from "@/lib/error-messages";
import { router } from "../router";
import type { StudentHomeworkItem } from "./types";

type HomeworkAssignmentCardProps = {
  homework: StudentHomeworkItem;
  onChanged: () => Promise<void>;
};

export function HomeworkAssignmentCard({
  homework,
  onChanged,
}: HomeworkAssignmentCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { submission } = homework;
  const canChangeSubmission = !submission.gradedAt;
  const dueLabel = homework.dueAt
    ? new Intl.DateTimeFormat("uk-UA", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(homework.dueAt))
    : "Без терміну";

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(router.api.homeworkSubmission(homework.id), {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? errorMessages.homework.uploadFailed);
        return;
      }
      setFile(null);
      setNotice("Роботу надіслано вчителю.");
      await onChanged();
    } catch {
      setError(errorMessages.homework.uploadFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleNoHomework = async () => {
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const response = await fetch(router.api.homeworkNoHomework(homework.id), {
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? errorMessages.homework.noHomeworkSaveFailed);
        return;
      }
      setNotice("Відсутність домашнього завдання зафіксовано: 0 балів.");
      await onChanged();
    } catch {
      setError(errorMessages.homework.noHomeworkSaveFailed);
    } finally {
      setBusy(false);
    }
  };

  const lessonLabel = homework.nextLessonAt
    ? new Intl.DateTimeFormat("uk-UA", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(`${homework.nextLessonAt}T00:00:00.000Z`))
    : null;

  return (
    <article
      className="panel student-homework-card"
      id={`homework-${homework.id}`}
    >
      <div className="panel-header">
        <div>
          <div className="student-homework-meta">
            <span className="eyebrow">
              {submission.gradedAt ? "ПЕРЕВІРЕНО" : `ЗДАТИ ДО: ${dueLabel}`}
            </span>
            {homework.isDemo && <span className="demo-label">Приклад</span>}
          </div>
          <h2>{homework.title}</h2>
        </div>
        {submission.score !== null && (
          <strong className="student-homework-score">
            {submission.score}/12
          </strong>
        )}
      </div>
      {lessonLabel && (
        <p className="student-homework-next-lesson">
          {submission.gradedAt ? "Урок був:" : "Наступний урок:"}{" "}
          <strong>{lessonLabel}</strong>
        </p>
      )}
      {homework.instructions && <p>{homework.instructions}</p>}
      {homework.resourceUrl && (
        <a
          className="text-button"
          href={homework.resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Відкрити матеріал
        </a>
      )}
      {submission.status === "submitted" && (
        <p className="homework-submission-status">
          {submission.fileName
            ? `Надіслано: ${submission.fileName}`
            : "Роботу перевірено"}
        </p>
      )}
      {submission.status === "no_homework" && (
        <p className="homework-no-work">Позначено «Немає ДЗ» · 0 балів</p>
      )}
      {submission.gradedAt && submission.feedback && (
        <p className="student-teacher-feedback">
          Коментар вчителя: {submission.feedback}
        </p>
      )}
      {canChangeSubmission && (
        <div className="student-homework-actions">
          <form className="student-upload-form" onSubmit={handleUpload}>
            <label htmlFor={`homework-file-${homework.id}`}>
              Файл роботи (до 10 МБ)
            </label>
            <input
              id={`homework-file-${homework.id}`}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <button
              className="primary-button"
              type="submit"
              disabled={!file || busy}
            >
              {busy ? "Надсилання…" : "Надіслати роботу"}
            </button>
          </form>
          <button
            className="text-button no-homework-button"
            type="button"
            disabled={busy}
            onClick={handleNoHomework}
          >
            Немає ДЗ · 0 балів
          </button>
        </div>
      )}
      {notice && (
        <p className="homework-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="materials-error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
