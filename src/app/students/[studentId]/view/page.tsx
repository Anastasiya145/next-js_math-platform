"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { errorMessages } from "@/lib/error-messages";
import { router } from "@/app/router";
import { Sidebar } from "@/app/components/Sidebar";
import { HomeworkAssignmentCard } from "@/app/student/HomeworkAssignmentCard";
import { StudentTextbookList } from "@/app/student/StudentTextbookList";
import { StudentTextbooksEditor } from "@/app/students/StudentTextbooksEditor";
import { ProgressChart } from "@/app/students/[studentId]/ProgressChart";
import { ArrowLeft, ChartNoAxesColumnIncreasing } from "lucide-react";
import Link from "next/link";
import type { StudentDashboardData } from "@/app/student/types";

export default function StudentViewPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/student/dashboard?studentId=${studentId}`);
        const result = (await response.json()) as {
          data?: StudentDashboardData;
          error?: string;
        };
        if (!response.ok || !result.data) {
          throw new Error(result.error ?? errorMessages.studentDashboard.loadFailed);
        }
        if (!cancelled) setDashboard(result.data);
      } catch {
        if (!cancelled) setError(errorMessages.studentDashboard.loadFailed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const refresh = async () => {
    setError(null);
    try {
      const response = await fetch(`/api/student/dashboard?studentId=${studentId}`);
      const result = (await response.json()) as {
        data?: StudentDashboardData;
        error?: string;
      };
      if (!response.ok || !result.data) {
        throw new Error(result.error ?? errorMessages.studentDashboard.loadFailed);
      }
      setDashboard(result.data);
    } catch {
      setError(errorMessages.studentDashboard.refreshFailed);
    }
  };

  const homeworks = dashboard?.homeworks ?? [];
  const activeHomeworks = homeworks.filter((homework) => !homework.submission.gradedAt);
  const completedHomeworks = homeworks
    .filter((homework) => Boolean(homework.submission.gradedAt))
    .sort((first, second) =>
      (second.submission.gradedAt ?? "").localeCompare(first.submission.gradedAt ?? ""),
    );

  function formatLessonDate(value: string): string {
    return new Intl.DateTimeFormat("uk-UA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(`${value}T00:00:00.000Z`));
  }

  return (
    <main className="shell">
      <Sidebar />
      <section className="content" id="student-view">
        <header className="topbar">
          <div>
            <Link
              href={router.students.href}
              className="text-button"
              style={{ marginBottom: "12px", display: "inline-flex", gap: "6px" }}
            >
              <ArrowLeft size={18} /> Назад до списку
            </Link>
            <p className="eyebrow">{dashboard?.student.grade} КЛАС · ПЕРЕГЛЯД УЧНЯ</p>
            <h1>{dashboard?.student.name ?? "Учень"}</h1>
            <p className="materials-empty" style={{ marginTop: "8px" }}>
              Ви бачите те, що бачить учень. Ви можете редагувати матеріали та оцінювати роботи.
            </p>
          </div>
        </header>

        {error && (
          <p className="materials-error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="materials-empty" role="status">
            Завантажуємо дані учня…
          </p>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="student-dashboard-summary">
              <div>
                <span>Середній бал</span>
                <strong>
                  {dashboard?.averageScore == null ? "—" : dashboard?.averageScore.toFixed(1)}
                  <small>/12</small>
                </strong>
                <small>
                  {dashboard?.gradedCount
                    ? `${dashboard.gradedCount} оцінених робіт`
                    : "Ще немає оцінених робіт"}
                </small>
              </div>
              <div className="student-summary-divider" />
              <div>
                <span>Потрібно виконати</span>
                <strong>{activeHomeworks.length}</strong>
                <small>{activeHomeworks.length === 1 ? "домашня робота" : "домашніх робіт"}</small>
              </div>
            </div>

            {/* Textbooks Section */}
            <section
              className="student-dashboard-section"
              aria-labelledby="student-textbooks-title"
            >
              <div className="student-section-heading">
                <div>
                  <p className="eyebrow">ДЛЯ {dashboard?.student.grade} КЛАСУ</p>
                  <h2 id="student-textbooks-title">Доступні підручники</h2>
                </div>
                <span>{dashboard?.textbooks.length ?? 0} матеріалів</span>
              </div>
              <StudentTextbookList
                textbooks={dashboard?.textbooks ?? []}
                grade={dashboard?.student.grade ?? 1}
              />

              {/* Personal Student Textbooks Editor */}
              <div style={{ marginTop: "24px" }}>
                <StudentTextbooksEditor studentId={Number(studentId)} onChanged={refresh} />
              </div>
            </section>

            {/* Active Homework Section */}
            <section className="student-dashboard-section" aria-labelledby="student-active-title">
              <div className="student-section-heading">
                <div>
                  <p className="eyebrow">НА ВИКОНАННЯ</p>
                  <h2 id="student-active-title">Актуальна домашня робота</h2>
                </div>
                <span>{activeHomeworks.length}</span>
              </div>
              {activeHomeworks.length ? (
                <div className="student-homework-list">
                  {activeHomeworks.map((homework) => (
                    <HomeworkAssignmentCard
                      key={homework.id}
                      homework={homework}
                      onChanged={refresh}
                    />
                  ))}
                </div>
              ) : (
                <div className="student-section-empty">
                  <h3>Усе виконано</h3>
                  <p>Коли з&apos;явиться нова домашня робота, вона буде тут.</p>
                </div>
              )}
            </section>

            {/* Completed Homework Section */}
            <section className="student-dashboard-section" aria-labelledby="student-history-title">
              <div className="student-section-heading">
                <div>
                  <p className="eyebrow">ТВОЇ РЕЗУЛЬТАТИ</p>
                  <h2 id="student-history-title">Завершені роботи</h2>
                </div>
                <span>{completedHomeworks.length}</span>
              </div>
              {completedHomeworks.length ? (
                <div className="student-homework-list">
                  {completedHomeworks.map((homework) => (
                    <HomeworkAssignmentCard
                      key={homework.id}
                      homework={homework}
                      onChanged={refresh}
                    />
                  ))}
                </div>
              ) : (
                <div className="student-section-empty student-history-empty">
                  <p>Після перевірки домашні роботи з&apos;являться тут.</p>
                </div>
              )}
            </section>

            {/* Progress Section */}
            <section className="student-dashboard-section" aria-labelledby="student-progress-title">
              <div className="student-section-heading">
                <div>
                  <p className="eyebrow">КРОК ЗА КРОКОМ</p>
                  <h2 id="student-progress-title">Прогрес учня</h2>
                </div>
                <ChartNoAxesColumnIncreasing aria-hidden="true" size={21} />
              </div>
              <ProgressChart
                studentId={dashboard?.student.id ?? 0}
                studentName={dashboard?.student.name ?? "Учень"}
                points={dashboard?.progress ?? []}
              />
            </section>
          </>
        )}
      </section>
    </main>
  );
}
