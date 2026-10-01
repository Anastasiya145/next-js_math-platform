import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./components/Sidebar";
import { router } from "./router";
import { listStudents } from "@/lib/db";

const today = new Intl.DateTimeFormat("uk-UA", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());
const todayLabel = today.charAt(0).toUpperCase() + today.slice(1);

const CLASS_COLORS = ["blue", "coral", "green"];

export default async function Home() {
  const session = await auth();
  if (session?.user.role === "student") redirect(router.student.href);

  const students = await listStudents();
  const grades = Array.from(new Set(students.map((s) => s.grade))).sort(
    (a, b) => a - b,
  );
  const classes = grades.map((grade) => ({
    grade,
    count: students.filter((s) => s.grade === grade).length,
  }));

  return (
    <main className="shell">
      <Sidebar />
      <section className="content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">{todayLabel}</p>
            <h1>
              Добрий день, Анастасія <span>✦</span>
            </h1>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Сповіщення">
              ♧<i />
            </button>
            <button className="primary-button">+ Нове завдання</button>
          </div>
        </header>
        <div className="welcome-banner">
          <div>
            <span className="banner-label">ФОКУС ТИЖНЯ</span>
            <h2>Дроби і відсотки</h2>
            <p>
              {classes.length}{" "}
              {classes.length === 1 ? "клас вивчає" : "класи вивчають"} тему.
              Гарний момент для спільної підбірки.
            </p>
          </div>
          <button className="banner-action">
            Відкрити підбірку <span>→</span>
          </button>
        </div>
        <div className="section-heading">
          <div>
            <span className="eyebrow">ШВИДКИЙ ОГЛЯД</span>
            <h2>Як ідуть справи</h2>
          </div>
          <button className="text-button">
            Цей тиждень <span>⌄</span>
          </button>
        </div>
        <div className="stats-grid">
          <article className="stat-card">
            <span className="stat-icon mint">↗</span>
            <div>
              <p>Завдань перевірено</p>
              <strong>24</strong>
              <small className="positive">
                +18% <span>до минулого тижня</span>
              </small>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon peach">◎</span>
            <div>
              <p>Середній результат</p>
              <strong>
                78<span className="unit">%</span>
              </strong>
              <small className="positive">
                +4% <span>до минулого тижня</span>
              </small>
            </div>
          </article>
          <article className="stat-card">
            <span className="stat-icon lilac">♧</span>
            <div>
              <p>Потрібно перевірити</p>
              <strong>12</strong>
              <small className="warning">
                3 термінові <span>до завтра</span>
              </small>
            </div>
          </article>
          <article className="stat-card accent">
            <div>
              <span className="sparkline">∿</span>
              <p>Активність учнів</p>
              <strong>
                86<span className="unit">%</span>
              </strong>
              <small>з {students.length} учнів</small>
            </div>
          </article>
        </div>
        <div className="dashboard-grid">
          <section className="panel" id="assignments">
            <div className="panel-header">
              <div>
                <span className="eyebrow">РОБОЧИЙ РИТМ</span>
                <h2>Найближчі завдання</h2>
              </div>
              <button className="text-button">
                Усі завдання <span>→</span>
              </button>
            </div>
            <div className="assignment-list">
              <div className="assignment">
                <span className="subject algebra">A</span>
                <div>
                  <b>Лінійні рівняння</b>
                  <small>7 клас · 1 учень</small>
                </div>
                <span className="due today">Сьогодні</span>
                <span className="arrow">→</span>
              </div>
              <div className="assignment">
                <span className="subject geometry">△</span>
                <div>
                  <b>Вступний тест</b>
                  <small>4 клас · 1 учень</small>
                </div>
                <span className="due tomorrow">Завтра</span>
                <span className="arrow">→</span>
              </div>
              <div className="assignment">
                <span className="subject fractions">⅔</span>
                <div>
                  <b>Дроби: базовий рівень</b>
                  <small>9 клас · 1 учень</small>
                </div>
                <span className="due later">18 вер</span>
                <span className="arrow">→</span>
              </div>
            </div>
          </section>
          <section className="panel" id="classes">
            <div className="panel-header">
              <div>
                <span className="eyebrow">ГРУПИ</span>
                <h2>Мої класи</h2>
              </div>
              <button className="round-button" aria-label="Додати клас">
                +
              </button>
            </div>
            <div className="class-list">
              {classes.map((c, i) => (
                <div className="class-row" key={c.grade}>
                  <span
                    className={`class-color ${CLASS_COLORS[i % CLASS_COLORS.length]}`}
                  />
                  <div>
                    <b>{c.grade} клас · Математика</b>
                    <small>
                      {c.count} {c.count === 1 ? "учень" : "учнів"}
                    </small>
                  </div>
                </div>
              ))}
              {classes.length === 0 && (
                <p className="materials-empty">Поки немає учнів</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
