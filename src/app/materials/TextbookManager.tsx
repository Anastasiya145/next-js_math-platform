"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, BookOpen, Dumbbell, Trash2 } from "lucide-react";
import { router } from "../router";
import { errorMessages } from "@/lib/error-messages";
import type { StudentDashboardData } from "../student/types";

type Textbook = StudentDashboardData["textbooks"][number];

export function TextbookManager() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [grade, setGrade] = useState("9");
  const [subject, setSubject] = useState("Алгебра");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [url, setUrl] = useState("");
  const [resourceType, setResourceType] = useState<"textbook" | "practice">(
    "textbook",
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(router.api.textbooks);
        const result = (await response.json()) as {
          data?: Textbook[];
          error?: string;
        };
        if (!response.ok)
          throw new Error(result.error ?? errorMessages.textbooks.loadFailed);
        if (!cancelled) setTextbooks(result.data ?? []);
      } catch {
        if (!cancelled) setError(errorMessages.textbooks.loadFailed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(router.api.textbooks, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: Number(grade),
          subject: subject.trim(),
          title: title.trim(),
          author: author.trim(),
          url: url.trim(),
          resourceType,
        }),
      });
      const result = (await response.json()) as {
        data?: Textbook[];
        error?: string;
      };
      if (!response.ok) {
        setError(result.error ?? errorMessages.textbooks.addFailed);
        return;
      }
      setTextbooks(result.data ?? []);
      setTitle("");
      setAuthor("");
      setUrl("");
    } catch {
      setError(errorMessages.textbooks.addFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (textbookId: number) => {
    setError(null);
    try {
      const response = await fetch(router.api.textbook(textbookId), {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? errorMessages.textbooks.deleteFailed);
        return;
      }
      setTextbooks((current) =>
        current.filter((item) => item.id !== textbookId),
      );
    } catch {
      setError(errorMessages.textbooks.deleteFailed);
    }
  };

  const booksByGrade = textbooks.reduce<Record<number, Textbook[]>>(
    (groups, textbook) => {
      (groups[textbook.grade] ??= []).push(textbook);
      return groups;
    },
    {},
  );

  return (
    <section
      className="textbook-manager"
      aria-labelledby="textbook-manager-title"
    >
      <header className="textbook-manager-heading">
        <div>
          <p className="eyebrow">ПОСИЛАННЯ ДЛЯ УЧНІВ</p>
          <h2 id="textbook-manager-title">Підручники й тренажери</h2>
          <p>
            Матеріали автоматично з&apos;являться в учнів відповідного класу.
          </p>
        </div>
        <BookOpen aria-hidden="true" size={25} />
      </header>

      {error && (
        <p className="materials-error" role="alert">
          {error}
        </p>
      )}

      <div className="textbook-manager-layout">
        <form className="textbook-form" onSubmit={handleAdd}>
          <div className="materials-form-field">
            <label htmlFor="textbook-title">Назва</label>
            <input
              id="textbook-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={180}
              required
            />
          </div>
          <div className="textbook-form-row">
            <div className="materials-form-field">
              <label htmlFor="textbook-grade">Клас</label>
              <select
                id="textbook-grade"
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
              >
                {Array.from({ length: 11 }, (_, index) => index + 1).map(
                  (value) => (
                    <option key={value} value={value}>
                      {value} клас
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="materials-form-field">
              <label htmlFor="textbook-subject">Предмет</label>
              <input
                id="textbook-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={80}
                required
              />
            </div>
          </div>
          <div className="textbook-form-row">
            <div className="materials-form-field">
              <label htmlFor="textbook-author">Автор або джерело</label>
              <input
                id="textbook-author"
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                maxLength={160}
              />
            </div>
            <div className="materials-form-field">
              <label htmlFor="textbook-type">Тип матеріалу</label>
              <select
                id="textbook-type"
                value={resourceType}
                onChange={(event) =>
                  setResourceType(event.target.value as "textbook" | "practice")
                }
              >
                <option value="textbook">Підручник</option>
                <option value="practice">Тренажер</option>
              </select>
            </div>
          </div>
          <div className="materials-form-field">
            <label htmlFor="textbook-url">Посилання</label>
            <input
              id="textbook-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
              required
            />
          </div>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Збереження…" : "Додати матеріал"}
          </button>
        </form>

        <div className="textbook-manager-list" aria-live="polite">
          {loading ? (
            <p className="materials-empty" role="status">
              Завантаження…
            </p>
          ) : Object.keys(booksByGrade).length === 0 ? (
            <p className="materials-empty">
              Додайте перше посилання на підручник.
            </p>
          ) : (
            Object.entries(booksByGrade)
              .sort(([first], [second]) => Number(first) - Number(second))
              .map(([classGrade, items]) => (
                <section className="textbook-grade-group" key={classGrade}>
                  <h3>{classGrade} клас</h3>
                  <ul>
                    {items.map((item) => {
                      const Icon =
                        item.resourceType === "practice" ? Dumbbell : BookOpen;
                      return (
                        <li className="textbook-manager-item" key={item.id}>
                          <span
                            className="textbook-manager-icon"
                            aria-hidden="true"
                          >
                            <Icon size={19} />
                          </span>
                          <div>
                            <small>
                              {item.subject}
                              {item.isDemo ? " · демо" : ""}
                            </small>
                            <strong>{item.title}</strong>
                            {item.author && <span>{item.author}</span>}
                          </div>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Відкрити ${item.title}`}
                          >
                            <ArrowUpRight aria-hidden="true" size={19} />
                          </a>
                          <button
                            type="button"
                            aria-label={`Видалити ${item.title}`}
                            title="Видалити матеріал"
                            onClick={() => void handleDelete(item.id)}
                          >
                            <Trash2 aria-hidden="true" size={17} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
          )}
        </div>
      </div>
    </section>
  );
}
