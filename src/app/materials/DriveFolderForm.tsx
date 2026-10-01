"use client";

import { useState, type FormEvent } from "react";

type DriveFolderFormProps = {
  initialUrl: string;
  onSave: (url: string) => Promise<boolean>;
};

export function DriveFolderForm({ initialUrl, onSave }: DriveFolderFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      await onSave(url.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="materials-drive">
      <form className="materials-form" onSubmit={handleSubmit}>
        <div className="materials-form-field">
          <label htmlFor="class-drive-folder">Посилання на Google Диск</label>
          <input
            id="class-drive-folder"
            type="url"
            placeholder="https://drive.google.com/drive/folders/..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>
        <button className="text-button" type="submit" disabled={saving}>
          {saving ? "Збереження…" : "Зберегти посилання"}
        </button>
      </form>
    </div>
  );
}
