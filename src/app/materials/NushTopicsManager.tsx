"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import type { NushTopic, NushTopicMaterial } from "@/lib/db";

type NushTopicsManagerProps = {
  grade: number;
  topics: NushTopic[];
  onTopicsChanged: () => void;
};

type MaterialWithForm = NushTopicMaterial & { isLoading?: boolean };

export function NushTopicsManager({ grade, topics, onTopicsChanged }: NushTopicsManagerProps) {
  const [expandedTopicId, setExpandedTopicId] = useState<number | null>(null);
  const [materials, setMaterials] = useState<Record<number, MaterialWithForm[]>>({});
  const [isLoadingMaterials, setIsLoadingMaterials] = useState<Record<number, boolean>>({});
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");

  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialUrl, setNewMaterialUrl] = useState("");
  const [newMaterialType, setNewMaterialType] = useState<NushTopicMaterial["materialType"]>("link");

  const loadMaterialsForTopic = async (topicId: number) => {
    setIsLoadingMaterials((prev) => ({ ...prev, [topicId]: true }));
    try {
      const res = await fetch(`/api/nush?grade=${grade}&topicId=${topicId}`);
      const result = (await res.json()) as {
        data?: MaterialWithForm[];
        error?: string;
      };
      if (res.ok && result.data) {
        setMaterials((prev) => ({ ...prev, [topicId]: result.data || [] }));
      }
    } finally {
      setIsLoadingMaterials((prev) => ({ ...prev, [topicId]: false }));
    }
  };

  const handleToggleTopic = (topicId: number) => {
    if (expandedTopicId === topicId) {
      setExpandedTopicId(null);
    } else {
      setExpandedTopicId(topicId);
      if (!materials[topicId]) {
        void loadMaterialsForTopic(topicId);
      }
    }
  };

  const handleAddTopic = async () => {
    const title = newTopicTitle.trim();
    if (!title) return;

    setIsLoadingTopics(true);
    try {
      const res = await fetch("/api/nush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-topic",
          grade,
          title,
          description: newTopicDesc,
        }),
      });

      if (res.ok) {
        setNewTopicTitle("");
        setNewTopicDesc("");
        onTopicsChanged();
      }
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const handleAddMaterial = async (topicId: number) => {
    const name = newMaterialName.trim();
    const url = newMaterialUrl.trim();
    if (!name || !url) return;

    setMaterials((prev) => ({
      ...prev,
      [topicId]: [
        ...(prev[topicId] || []),
        {
          id: -1,
          topicId,
          name,
          url,
          materialType: newMaterialType,
          isLoading: true,
        },
      ],
    }));

    try {
      const res = await fetch("/api/nush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-material",
          topicId,
          material: { name, url, materialType: newMaterialType },
        }),
      });

      if (res.ok) {
        setNewMaterialName("");
        setNewMaterialUrl("");
        setNewMaterialType("link");
        await loadMaterialsForTopic(topicId);
      } else {
        setMaterials((prev) => ({
          ...prev,
          [topicId]: (prev[topicId] || []).filter((m) => m.id !== -1),
        }));
      }
    } catch {
      setMaterials((prev) => ({
        ...prev,
        [topicId]: (prev[topicId] || []).filter((m) => m.id !== -1),
      }));
    }
  };

  const handleDeleteMaterial = async (topicId: number, materialId: number) => {
    const oldMaterials = materials[topicId];
    setMaterials((prev) => ({
      ...prev,
      [topicId]: (prev[topicId] || []).filter((m) => m.id !== materialId),
    }));

    try {
      const res = await fetch("/api/nush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-material",
          materialId,
        }),
      });

      if (!res.ok) {
        setMaterials((prev) => ({ ...prev, [topicId]: oldMaterials }));
      }
    } catch {
      setMaterials((prev) => ({ ...prev, [topicId]: oldMaterials }));
    }
  };

  const getMaterialTypeIcon = (type: NushTopicMaterial["materialType"]) => {
    const icons: Record<NushTopicMaterial["materialType"], string> = {
      google_drive: "☁",
      naurok: "📚",
      pdf: "▤",
      doc: "▥",
      link: "⛓",
      other: "▢",
    };
    return icons[type];
  };

  return (
    <section className="panel materials-column">
      <div className="panel-header">
        <div>
          <span className="eyebrow">ПРОГРАМА НУШ</span>
          <h2>Теми {grade} класу</h2>
        </div>
      </div>

      <ul className="materials-list">
        {topics.map((topic) => (
          <li key={topic.id}>
            <button
              className={`materials-list-item${expandedTopicId === topic.id ? " active" : ""}`}
              onClick={() => handleToggleTopic(topic.id)}
            >
              <span>◆</span> {topic.title}
              <em>{materials[topic.id]?.length ?? 0}</em>
            </button>

            {expandedTopicId === topic.id && (
              <div
                className="nush-topic-materials"
                style={{
                  paddingLeft: "20px",
                  borderLeft: "2px solid var(--green-soft)",
                  marginTop: "8px",
                }}
              >
                {isLoadingMaterials[topic.id] ? (
                  <p className="materials-empty">Завантаження матеріалів…</p>
                ) : (
                  <>
                    {materials[topic.id]?.length ? (
                      <ul className="materials-file-list" style={{ margin: "0" }}>
                        {materials[topic.id]!.map((material) => (
                          <li
                            key={material.id}
                            className="materials-file"
                            style={{ opacity: material.isLoading ? 0.6 : 1 }}
                          >
                            <span className="materials-file-icon">
                              {getMaterialTypeIcon(material.materialType)}
                            </span>
                            <div>
                              <b>{material.name}</b>
                              <small>
                                {
                                  {
                                    google_drive: "Google Drive",
                                    naurok: "NaUrok",
                                    pdf: "PDF",
                                    doc: "Документ",
                                    link: "Посилання",
                                    other: "Інше",
                                  }[material.materialType]
                                }
                              </small>
                            </div>
                            <a
                              href={material.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-button"
                            >
                              Відкрити
                            </a>
                            <button
                              className="icon-action icon-action-danger"
                              type="button"
                              aria-label="Видалити матеріал"
                              onClick={() => handleDeleteMaterial(topic.id, material.id)}
                              disabled={material.isLoading}
                            >
                              <Trash2 aria-hidden="true" size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="materials-empty" style={{ margin: "8px 0" }}>
                        Поки немає матеріалів
                      </p>
                    )}

                    <div
                      style={{
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid var(--border-light)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          color: "var(--text-secondary)",
                          marginBottom: "8px",
                        }}
                      >
                        Додати матеріал
                      </p>
                      <div className="materials-add-row">
                        <input
                          placeholder="Назва матеріалу"
                          value={newMaterialName}
                          onChange={(e) => setNewMaterialName(e.target.value)}
                        />
                      </div>
                      <div className="materials-add-row">
                        <input
                          placeholder="URL (напр. https://...)"
                          value={newMaterialUrl}
                          onChange={(e) => setNewMaterialUrl(e.target.value)}
                        />
                      </div>
                      <div className="materials-add-row">
                        <select
                          value={newMaterialType}
                          onChange={(e) =>
                            setNewMaterialType(e.target.value as NushTopicMaterial["materialType"])
                          }
                          style={{ flex: 1 }}
                        >
                          <option value="link">Посилання</option>
                          <option value="google_drive">Google Drive</option>
                          <option value="naurok">NaUrok</option>
                          <option value="pdf">PDF</option>
                          <option value="doc">Документ</option>
                          <option value="other">Інше</option>
                        </select>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => handleAddMaterial(topic.id)}
                        style={{ marginTop: "8px" }}
                      >
                        <Plus size={16} /> Додати матеріал
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="materials-add-row">
        <input
          placeholder="Нова тема (напр. Натуральні числа)"
          value={newTopicTitle}
          onChange={(e) => setNewTopicTitle(e.target.value)}
        />
        <button className="text-button" onClick={handleAddTopic} disabled={isLoadingTopics}>
          + Додати
        </button>
      </div>
    </section>
  );
}
