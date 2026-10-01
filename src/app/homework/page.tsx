"use client";

import { useEffect, useState } from "react";
import { errorMessages } from "@/lib/error-messages";
import { Sidebar } from "../components/Sidebar";
import { router } from "../router";
import { HomeworkForm } from "./HomeworkForm";
import { HomeworkList } from "./HomeworkList";
import type { HomeworkStudentOption, TeacherHomework } from "./types";

export default function HomeworkPage() {
  const [students, setStudents] = useState<HomeworkStudentOption[]>([]);
  const [homeworks, setHomeworks] = useState<TeacherHomework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    const [studentsResponse, homeworkResponse] = await Promise.all([
      fetch(router.api.students),
      fetch(router.api.assignments),
    ]);
    const [studentsResult, homeworkResult] = (await Promise.all([
      studentsResponse.json(),
      homeworkResponse.json(),
    ])) as [
      { data?: HomeworkStudentOption[]; error?: string },
      { data?: TeacherHomework[]; error?: string },
    ];
    if (!studentsResponse.ok || !homeworkResponse.ok) {
      throw new Error(
        studentsResult.error ??
          homeworkResult.error ??
          errorMessages.homework.dataLoadFailed,
      );
    }
    setStudents(studentsResult.data ?? []);
    setHomeworks(homeworkResult.data ?? []);
  };

  useEffect(() => {
    let cancelled = false;
    async function loadInitialData() {
      try {
        await loadData();
      } catch {
        if (!cancelled) setError(errorMessages.homework.loadFailed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async (input: {
    title: string;
    instructions: string;
    resourceUrl: string;
    dueAt: string | null;
    nextLessonAt: string | null;
    studentIds: number[];
  }) => {
    setError(null);
    try {
      const response = await fetch(router.api.assignments, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? errorMessages.homework.createFailed);
        return false;
      }
      await loadData();
      return true;
    } catch {
      setError(errorMessages.homework.createFailed);
      return false;
    }
  };

  const refresh = async () => {
    try {
      await loadData();
    } catch {
      setError(errorMessages.homework.refreshFailed);
    }
  };

  return (
    <main className="shell">
      <Sidebar />
      <section className="content" id="homework">
        <header className="topbar">
          <div>
            <p className="eyebrow">ПЕРЕВІРКА РОБІТ</p>
            <h1>Домашні завдання</h1>
          </div>
        </header>
        {error && (
          <p className="materials-error" role="alert">
            {error}
          </p>
        )}
        <HomeworkForm students={students} onCreate={handleCreate} />
        <section className="homework-results-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ПРИЗНАЧЕНО</span>
              <h2>Роботи учнів</h2>
            </div>
          </div>
          {loading ? (
            <p className="materials-empty" role="status">
              Завантаження…
            </p>
          ) : (
            <HomeworkList homeworks={homeworks} onRefresh={refresh} />
          )}
        </section>
      </section>
    </main>
  );
}
