"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { errorMessages } from "@/lib/error-messages";
import { ArrowDown, CalendarDays, ChartNoAxesColumnIncreasing } from "lucide-react";
import { router } from "../router";
import { HomeworkAssignmentCard } from "./HomeworkAssignmentCard";
import { StudentTextbookList } from "./StudentTextbookList";
import { ProgressChart } from "../students/[studentId]/ProgressChart";
import { ChangePasswordModal } from "./ChangePasswordModal";
import type { StudentDashboardData } from "./types";

async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  const response = await fetch(router.api.studentDashboard);
  const result = (await response.json()) as {
    data?: StudentDashboardData;
    error?: string;
  };
  if (!response.ok || !result.data) {
    throw new Error(result.error ?? errorMessages.studentDashboard.loadFailed);
  }
  return result.data;
}

function formatLessonDate(value: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export default function StudentPage() {
  const { data: session } = useSession();
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchStudentDashboard();
        if (!cancelled) setDashboard(result);
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
  }, []);

  const refresh = async () => {
    setError(null);
    try {
      setDashboard(await fetchStudentDashboard());
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
  const nextLesson = activeHomeworks
    .filter((homework) => homework.nextLessonAt)
    .sort((first, second) =>
      (first.nextLessonAt ?? "").localeCompare(second.nextLessonAt ?? ""),
    )[0];

  return (
    <main className="student-portal" id="student-portal">
      <header className="student-portal-header">
        <div className="student-portal-header-inner">
          <div className="student-portal-brand">
            <span className="student-portal-brand-mark" aria-hidden="true">
              ∑
            </span>
            <span>
              Математика
              <b>з Анастасією</b>
            </span>
          </div>
          <div className="student-account-actions">
            <span className="student-account-avatar" aria-hidden="true">
              {session?.user?.name?.charAt(0).toUpperCase() ?? "У"}
            </span>
            <span>{session?.user?.name}</span>
            <button
              className="text-button"
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              title="Змінити пароль"
            >
              Змінити пароль
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => signOut({ redirectTo: router.login.href })}
            >
              Вийти
            </button>
          </div>
        </div>
      </header>
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
      <section className="student-portal-content">
        {error && (
          <p className="materials-error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className="materials-empty" role="status">
            Завантажуємо твій навчальний простір…
          </p>
        ) : (
          <>
            <header className="student-dashboard-intro">
              <div>
                <p className="eyebrow">{dashboard?.student.grade} КЛАС · КАБІНЕТ УЧНЯ</p>
                <h1>Навчальний простір</h1>
                <p className="student-dashboard-welcome">
                  Підручники, домашні завдання й твій прогрес в одному місці.
                </p>
              </div>
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
                  <small>
                    {activeHomeworks.length === 1 ? "домашня робота" : "домашніх робіт"}
                  </small>
                </div>
              </div>
            </header>

            {nextLesson && (
              <aside className="student-next-lesson" aria-label="Наступний урок">
                <span className="student-next-lesson-icon" aria-hidden="true">
                  <CalendarDays size={22} />
                </span>
                <div>
                  <p>Наступний урок · {formatLessonDate(nextLesson.nextLessonAt!)}</p>
                  <strong>{nextLesson.title}</strong>
                </div>
                <a href={`#homework-${nextLesson.id}`} aria-label="Перейти до завдання">
                  <ArrowDown aria-hidden="true" size={19} />
                </a>
              </aside>
            )}

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
            </section>

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

            <section className="student-dashboard-section" aria-labelledby="student-progress-title">
              <div className="student-section-heading">
                <div>
                  <p className="eyebrow">КРОК ЗА КРОКОМ</p>
                  <h2 id="student-progress-title">Мій прогрес</h2>
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
