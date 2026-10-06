"use client";

import { useEffect, useState } from "react";
import { errorMessages } from "@/lib/error-messages";
import { Sidebar } from "../components/Sidebar";
import { router } from "../router";
import { DriveFolderForm } from "./DriveFolderForm";
import { TextbookManager } from "./TextbookManager";
import { NushTopicsManager } from "./NushTopicsManager";
import type { NushTopic } from "@/lib/db";

type FileType = "pdf" | "doc" | "image" | "link" | "other";

type MaterialFile = {
  id: string;
  name: string;
  url: string;
  type: FileType;
  addedAt: string;
};

type Topic = {
  id: string;
  title: string;
  files: MaterialFile[];
};

type ClassFolder = {
  id: string;
  className: string;
  driveFolderUrl?: string;
  topics: Topic[];
};

const FILE_ICON: Record<FileType, string> = {
  pdf: "▤",
  doc: "▥",
  image: "▧",
  link: "⛓",
  other: "▢",
};

export default function MaterialsPage() {
  const [classes, setClasses] = useState<ClassFolder[]>([]);
  const [nushTopics, setNushTopics] = useState<NushTopic[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const [newClassName, setNewClassName] = useState("");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [newFileType, setNewFileType] = useState<FileType>("pdf");
  const [error, setError] = useState<string | null>(null);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const response = await fetch(router.api.materials);
      const result = (await response.json()) as {
        data?: ClassFolder[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error ?? errorMessages.materials.loadFailed);
      }
      const data = result.data ?? [];
      setClasses(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const loadNushTopics = async (grade: number) => {
    try {
      const response = await fetch(`/api/nush?grade=${grade}`);
      const result = (await response.json()) as {
        data?: NushTopic[];
        error?: string;
      };
      if (response.ok && result.data) {
        setNushTopics(result.data);
      }
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadInitialClasses() {
      try {
        const response = await fetch(router.api.materials);
        const result = (await response.json()) as {
          data?: ClassFolder[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error ?? errorMessages.materials.loadFailed);
        }
        if (cancelled) return;

        const data = result.data ?? [];
        setClasses(data);
        setSelectedClassId(data[0]?.id ?? null);
        setSelectedTopicId(data[0]?.topics[0]?.id ?? null);

        // Load NUSH topics for first available grade
        const firstClass = data[0];
        if (firstClass) {
          const gradeMatch = firstClass.className.match(/\d+/);
          if (gradeMatch) {
            const grade = parseInt(gradeMatch[0], 10);
            setSelectedGrade(grade);
            await loadNushTopics(grade);
          }
        }
      } catch {
        if (!cancelled) setError(errorMessages.materials.loadFailed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitialClasses();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;
  const selectedTopic =
    selectedClass?.topics.find((t) => t.id === selectedTopicId) ?? selectedClass?.topics[0] ?? null;

  const post = async (body: Record<string, unknown>) => {
    setError(null);
    const res = await fetch(router.api.materials, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? errorMessages.materials.actionFailed);
      return false;
    }
    await loadClasses();
    return true;
  };

  const handleAddClass = async () => {
    const name = newClassName.trim();
    if (!name) return;
    const ok = await post({ action: "add-class", className: name });
    if (ok) setNewClassName("");
  };

  const handleAddTopic = async () => {
    const title = newTopicTitle.trim();
    if (!title || !selectedClassId) return;
    const ok = await post({
      action: "add-topic",
      classId: selectedClassId,
      topicTitle: title,
    });
    if (ok) setNewTopicTitle("");
  };

  const handleAddFile = async () => {
    if (!selectedClassId || !selectedTopicId) return;
    if (!newFileName.trim() || !newFileUrl.trim()) return;
    const ok = await post({
      action: "add-file",
      classId: selectedClassId,
      topicId: selectedTopicId,
      file: {
        name: newFileName.trim(),
        url: newFileUrl.trim(),
        type: newFileType,
      },
    });
    if (ok) {
      setNewFileName("");
      setNewFileUrl("");
      setNewFileType("pdf");
    }
  };

  const handleSaveDriveFolder = async (driveFolderUrl: string) => {
    if (!selectedClassId) return false;
    return post({
      action: "set-drive-folder",
      classId: selectedClassId,
      driveFolderUrl,
    });
  };

  return (
    <main className="shell">
      <Sidebar />
      <section className="content" id="materials">
        <header className="topbar">
          <div>
            <p className="eyebrow">СХОВИЩЕ МАТЕРІАЛІВ</p>
            <h1>
              Матеріали за класами <span>✦</span>
            </h1>
          </div>
        </header>

        {error && <p className="materials-error">{error}</p>}

        {loading ? (
          <p>Завантаження…</p>
        ) : (
          <div className="materials-grid">
            <section className="panel materials-column">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">ПАПКИ</span>
                  <h2>Класи</h2>
                </div>
              </div>
              <ul className="materials-list">
                {classes.map((c) => (
                  <li key={c.id}>
                    <button
                      className={`materials-list-item${c.id === selectedClassId ? " active" : ""}`}
                      onClick={() => {
                        setSelectedClassId(c.id);
                        // Load NUSH topics for this class grade
                        const gradeMatch = c.className.match(/\d+/);
                        if (gradeMatch) {
                          const grade = parseInt(gradeMatch[0], 10);
                          setSelectedGrade(grade);
                          void loadNushTopics(grade);
                        }
                      }}
                    >
                      <span>▦</span> {c.className}
                      <em>{c.topics.length}</em>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="materials-add-row">
                <input
                  placeholder="Новий клас, напр. 8 клас"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
                <button className="text-button" onClick={handleAddClass}>
                  + Додати
                </button>
              </div>
            </section>

            <section className="panel materials-column">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">ТЕМИ</span>
                  <h2>{selectedClass?.className ?? "Оберіть клас"}</h2>
                </div>
              </div>
              <ul className="materials-list">
                {selectedClass?.topics.map((t) => (
                  <li key={t.id}>
                    <button
                      className={`materials-list-item${
                        t.id === selectedTopic?.id ? " active" : ""
                      }`}
                      onClick={() => setSelectedTopicId(t.id)}
                    >
                      <span>◇</span> {t.title}
                      <em>{t.files.length}</em>
                    </button>
                  </li>
                ))}
                {selectedClass && selectedClass.topics.length === 0 && (
                  <li className="materials-empty">Поки немає тем</li>
                )}
              </ul>
              {selectedClass && (
                <div className="materials-add-row">
                  <input
                    placeholder="Нова тема, напр. Відсотки"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                  />
                  <button className="text-button" onClick={handleAddTopic}>
                    + Додати
                  </button>
                </div>
              )}

              {selectedClass && (
                <DriveFolderForm
                  key={selectedClass.id}
                  initialUrl={selectedClass.driveFolderUrl ?? ""}
                  onSave={handleSaveDriveFolder}
                />
              )}
            </section>

            <section className="panel materials-column materials-files">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">ФАЙЛИ</span>
                  <h2>{selectedTopic?.title ?? "Оберіть тему"}</h2>
                </div>
              </div>
              <ul className="materials-file-list">
                {selectedTopic?.files.map((f) => (
                  <li key={f.id} className="materials-file">
                    <span className="materials-file-icon">{FILE_ICON[f.type]}</span>
                    <div>
                      <b>{f.name}</b>
                      <small>Додано {f.addedAt}</small>
                    </div>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-button"
                    >
                      Відкрити <span>→</span>
                    </a>
                  </li>
                ))}
                {selectedTopic && selectedTopic.files.length === 0 && (
                  <li className="materials-empty">Поки немає файлів у цій темі</li>
                )}
              </ul>
              {selectedTopic && (
                <div className="materials-file-form">
                  <input
                    placeholder="Назва файлу"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                  />
                  <input
                    placeholder="Посилання (Google Диск тощо)"
                    value={newFileUrl}
                    onChange={(e) => setNewFileUrl(e.target.value)}
                  />
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value as FileType)}
                  >
                    <option value="pdf">PDF</option>
                    <option value="doc">Документ</option>
                    <option value="image">Зображення</option>
                    <option value="link">Посилання</option>
                    <option value="other">Інше</option>
                  </select>
                  <button className="primary-button" onClick={handleAddFile}>
                    + Додати файл
                  </button>
                </div>
              )}
              {!loading && <TextbookManager />}
            </section>

            {selectedGrade && (
              <NushTopicsManager
                grade={selectedGrade}
                topics={nushTopics}
                onTopicsChanged={() => void loadNushTopics(selectedGrade)}
              />
            )}
          </div>
        )}
        {!loading && <TextbookManager />}
      </section>
    </main>
  );
}
