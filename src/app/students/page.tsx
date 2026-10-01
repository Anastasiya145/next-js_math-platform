"use client";

import { useEffect, useState } from "react";
import { errorMessages } from "@/lib/error-messages";
import { Sidebar } from "../components/Sidebar";
import { router } from "../router";
import { StudentForm } from "./StudentForm";
import { StudentGroups } from "./StudentGroups";
import type { Student } from "./types";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      try {
        const response = await fetch(router.api.students);
        const result = (await response.json()) as {
          data?: Student[];
          error?: string;
        };
        if (!response.ok)
          throw new Error(result.error ?? errorMessages.students.loadFailed);
        if (!cancelled) setStudents(result.data ?? []);
      } catch {
        if (!cancelled) setError(errorMessages.students.loadFailed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadStudents();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshStudents = async () => {
    const response = await fetch(router.api.students);
    const result = (await response.json()) as {
      data?: Student[];
      error?: string;
    };
    if (!response.ok)
      throw new Error(result.error ?? errorMessages.students.loadFailed);
    setStudents(result.data ?? []);
  };

  const handleAdd = async (
    name: string,
    grade: number,
    email: string,
    temporaryPassword: string,
  ) => {
    setError(null);
    try {
      const response = await fetch(router.api.students, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, grade, email, temporaryPassword }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? errorMessages.students.addFailed);
        return false;
      }
      await refreshStudents();
      return true;
    } catch {
      setError(errorMessages.students.addFailed);
      return false;
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      const response = await fetch(`${router.api.students}?id=${id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? errorMessages.students.deleteFailed);
        return;
      }
      await refreshStudents();
    } catch {
      setError(errorMessages.students.deleteFailed);
    }
  };

  const handleEdit = async (
    id: number,
    name: string,
    grade: number,
    email: string,
    temporaryPassword: string,
  ) => {
    setError(null);
    try {
      const response = await fetch(router.api.student(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, grade, email, temporaryPassword }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? errorMessages.students.saveFailed);
        return false;
      }
      await refreshStudents();
      return true;
    } catch {
      setError(errorMessages.students.saveFailed);
      return false;
    }
  };

  const classCount = new Set(students.map((student) => student.grade)).size;
  const accountCount = students.filter((student) => student.email).length;

  return (
    <main className="shell">
      <Sidebar />
      <section className="content" id="students">
        <header className="student-roster-header">
          <div className="student-roster-title">
            <p className="eyebrow">КАБІНЕТ ВЧИТЕЛЯ</p>
            <h1>Учні</h1>
            <p>Навчальні групи та доступ до особистих кабінетів</p>
          </div>
          <dl className="student-roster-metrics" aria-label="Огляд учнів">
            <div>
              <dt>Учнів</dt>
              <dd>{loading ? "—" : students.length}</dd>
            </div>
            <div>
              <dt>Класів</dt>
              <dd>{loading ? "—" : classCount}</dd>
            </div>
            <div>
              <dt>Кабінетів</dt>
              <dd>{loading ? "—" : accountCount}</dd>
            </div>
          </dl>
        </header>

        {error && (
          <p className="materials-error" role="alert">
            {error}
          </p>
        )}
        <StudentForm onAdd={handleAdd} />
        <StudentGroups
          students={students}
          loading={loading}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </section>
    </main>
  );
}
