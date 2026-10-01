import { ArrowUpRight, BookOpen, Dumbbell } from "lucide-react";
import type { StudentDashboardData } from "./types";

type StudentTextbookListProps = {
  textbooks: StudentDashboardData["textbooks"];
  grade: number;
};

export function StudentTextbookList({
  textbooks,
  grade,
}: StudentTextbookListProps) {
  if (textbooks.length === 0) {
    return (
      <p className="student-section-empty">
        Підручники для {grade} класу ще не додані.
      </p>
    );
  }

  return (
    <ul className="student-textbook-list">
      {textbooks.map((textbook, index) => {
        const Icon = textbook.resourceType === "practice" ? Dumbbell : BookOpen;
        return (
          <li key={textbook.id}>
            <article className="student-textbook-item">
              <div
                className={`student-textbook-mark subject-tone-${index % 3}`}
              >
                <Icon aria-hidden="true" size={21} />
              </div>
              <div className="student-textbook-copy">
                <div className="student-textbook-meta">
                  <span>{textbook.subject}</span>
                  <span>
                    {textbook.resourceType === "practice"
                      ? "Тренажер"
                      : "Підручник"}
                  </span>
                  {textbook.isDemo && <span className="demo-label">Демо</span>}
                </div>
                <h3>{textbook.title}</h3>
                {textbook.author && <p>{textbook.author}</p>}
              </div>
              <a
                className="student-textbook-link"
                href={textbook.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Відкрити: ${textbook.title}`}
              >
                <ArrowUpRight aria-hidden="true" size={19} />
              </a>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
