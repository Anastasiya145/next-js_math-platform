"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import type { PersonalStudentTextbook } from "@/lib/db";

type StudentTextbooksEditorProps = {
  studentId: number;
  onChanged?: () => void;
};

export function StudentTextbooksEditor({ studentId, onChanged }: StudentTextbooksEditorProps) {
  const [textbooks, setTextbooks] = useState<PersonalStudentTextbook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newSubject, setNewSubject] = useState("");

  useEffect(() => {
    const loadTextbooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/students/${studentId}/textbooks`);
        const result = (await res.json()) as {
          data?: PersonalStudentTextbook[];
          error?: string;
        };
        if (res.ok && result.data) {
          setTextbooks(result.data);
        } else {
          setError(result.error ?? "Failed to load textbooks");
        }
      } catch {
        setError("Failed to load textbooks");
      } finally {
        setLoading(false);
      }
    };

    void loadTextbooks();
  }, [studentId]);

  const handleAdd = async () => {
    const title = newTitle.trim();
    const url = newUrl.trim();
    if (!title || !url) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/students/${studentId}/textbooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          url,
          subject: newSubject.trim(),
        }),
      });

      const result = (await res.json()) as {
        data?: PersonalStudentTextbook;
        error?: string;
      };

      if (res.ok && result.data) {
        setTextbooks([...textbooks, result.data]);
        setNewTitle("");
        setNewUrl("");
        setNewSubject("");
        onChanged?.();
      } else {
        setError(result.error ?? "Failed to add textbook");
      }
    } catch {
      setError("Failed to add textbook");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (textbookId: number) => {
    setError(null);
    const oldTextbooks = textbooks;
    setTextbooks((prev) => prev.filter((t) => t.id !== textbookId));

    try {
      const res = await fetch(`/api/students/${studentId}/textbooks?textbookId=${textbookId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setTextbooks(oldTextbooks);
        const result = (await res.json()) as { error?: string };
        setError(result.error ?? "Failed to delete textbook");
      } else {
        onChanged?.();
      }
    } catch {
      setTextbooks(oldTextbooks);
      setError("Failed to delete textbook");
    }
  };

  return (
    <div className="student-textbooks-editor">
      <style>{`
        .student-textbooks-editor {
          padding: 16px;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          background: #fafafa;
        }

        .student-textbooks-editor h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        .textbooks-list {
          list-style: none;
          padding: 0;
          margin: 0 0 16px 0;
        }

        .textbooks-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-light);
        }

        .textbooks-list li:last-child {
          border-bottom: none;
        }

        .textbooks-list-icon {
          font-size: 16px;
          opacity: 0.6;
        }

        .textbooks-list-content {
          flex: 1;
          min-width: 0;
        }

        .textbooks-list-title {
          font-size: 14px;
          font-weight: 500;
          margin: 0;
          word-break: break-word;
        }

        .textbooks-list-subject {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 2px 0 0 0;
        }

        .textbooks-list-link {
          color: var(--green);
          text-decoration: none;
          font-size: 12px;
          display: inline-block;
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .textbooks-list-link:hover {
          text-decoration: underline;
        }

        .textbooks-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--border-light);
        }

        .textbooks-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .textbooks-form-row.full {
          grid-template-columns: 1fr;
        }

        .textbooks-form input {
          padding: 8px 12px;
          border: 1px solid var(--border-light);
          border-radius: 4px;
          font-size: 13px;
          font-family: inherit;
        }

        .textbooks-form input:focus {
          outline: none;
          border-color: var(--green);
          box-shadow: 0 0 0 2px rgba(34, 139, 34, 0.1);
        }

        .textbooks-form button {
          align-self: flex-start;
          padding: 8px 16px;
          background: var(--green);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .textbooks-form button:hover {
          background: var(--green-dark);
        }

        .textbooks-form button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .textbooks-error {
          padding: 8px 12px;
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 4px;
          font-size: 13px;
          color: #c33;
          margin-bottom: 8px;
        }

        .textbooks-empty {
          font-size: 13px;
          color: var(--text-secondary);
          font-style: italic;
          padding: 8px 0;
        }
      `}</style>

      <h3>📚 Підручники учня</h3>

      {error && <div className="textbooks-error">{error}</div>}

      {loading && textbooks.length === 0 ? (
        <p className="textbooks-empty">Завантаження…</p>
      ) : textbooks.length > 0 ? (
        <ul className="textbooks-list">
          {textbooks.map((textbook) => (
            <li key={textbook.id}>
              <span className="textbooks-list-icon">📖</span>
              <div className="textbooks-list-content">
                <p className="textbooks-list-title">{textbook.title}</p>
                {textbook.subject && <p className="textbooks-list-subject">{textbook.subject}</p>}
                <a
                  href={textbook.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="textbooks-list-link"
                  title={textbook.url}
                >
                  {textbook.url}
                </a>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(textbook.id)}
                aria-label="Delete textbook"
                style={{
                  padding: "4px 8px",
                  background: "none",
                  color: "#c33",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="textbooks-empty">Поки немає підручників</p>
      )}

      <div className="textbooks-form">
        <div className="textbooks-form-row">
          <input
            placeholder="Назва підручника"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={loading}
          />
          <input
            placeholder="Предмет (опціонально)"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="textbooks-form-row full">
          <input
            placeholder="URL посилання (напр. https://...)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            disabled={loading}
          />
        </div>
        <button onClick={handleAdd} disabled={loading || !newTitle || !newUrl}>
          <Plus size={14} /> Додати підручник
        </button>
      </div>
    </div>
  );
}
