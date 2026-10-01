"use client";

import { useState, type FormEvent } from "react";
import { Save, X } from "lucide-react";
import { errorMessages } from "@/lib/error-messages";
import {
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validatePassword,
} from "@/lib/validation";

type StudentEditFormProps = {
  studentId: number;
  initialName: string;
  initialGrade: number;
  initialEmail: string | null;
  onSave: (
    id: number,
    name: string,
    grade: number,
    email: string,
    temporaryPassword: string,
  ) => Promise<boolean>;
  onCancel: () => void;
};

export function StudentEditForm({
  studentId,
  initialName,
  initialGrade,
  initialEmail,
  onSave,
  onCancel,
}: StudentEditFormProps) {
  const [name, setName] = useState(initialName);
  const [grade, setGrade] = useState(String(initialGrade));
  const [email, setEmail] = useState(initialEmail ?? "");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  const getPasswordError = (value: string, emailValue = email) => {
    const error = validatePassword(value, false);
    if (error) return error;
    if (!initialEmail && emailValue.trim() && !value) {
      return errorMessages.students.newAccountPasswordRequired;
    }
    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const nextErrors = {
      name: trimmedName ? "" : errorMessages.students.nameRequired,
      email: validateEmail(email, false) ?? "",
      password: getPasswordError(temporaryPassword),
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || saving) return;

    setSaving(true);
    try {
      if (
        await onSave(
          studentId,
          trimmedName,
          Number(grade),
          email.trim().toLowerCase(),
          temporaryPassword,
        )
      ) {
        onCancel();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="student-edit-form" onSubmit={handleSubmit}>
      <div className="student-field">
        <label htmlFor={`edit-student-name-${studentId}`}>Ім&apos;я учня</label>
        <input
          id={`edit-student-name-${studentId}`}
          value={name}
          onChange={(event) => {
            const value = event.target.value;
            setName(value);
            if (fieldErrors.name) {
              setFieldErrors((errors) => ({
                ...errors,
                name: value.trim() ? "" : errorMessages.students.nameRequired,
              }));
            }
          }}
          maxLength={120}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={
            fieldErrors.name
              ? `edit-student-name-error-${studentId}`
              : undefined
          }
          required
        />
        {fieldErrors.name && (
          <small
            className="field-error"
            id={`edit-student-name-error-${studentId}`}
            aria-live="polite"
          >
            {fieldErrors.name}
          </small>
        )}
      </div>
      <div className="student-field">
        <label htmlFor={`edit-student-grade-${studentId}`}>Клас</label>
        <select
          id={`edit-student-grade-${studentId}`}
          value={grade}
          onChange={(event) => setGrade(event.target.value)}
        >
          {Array.from({ length: 11 }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              {value} клас
            </option>
          ))}
        </select>
      </div>
      <div className="student-field">
        <label htmlFor={`edit-student-email-${studentId}`}>Email</label>
        <input
          id={`edit-student-email-${studentId}`}
          type="email"
          autoComplete="off"
          maxLength={MAX_EMAIL_LENGTH}
          value={email}
          onChange={(event) => {
            const value = event.target.value;
            setEmail(value);
            if (fieldErrors.email) {
              setFieldErrors((errors) => ({
                ...errors,
                email: validateEmail(value, false) ?? "",
                password: getPasswordError(temporaryPassword, value),
              }));
            }
          }}
          onBlur={() =>
            setFieldErrors((errors) => ({
              ...errors,
              email: validateEmail(email, false) ?? "",
            }))
          }
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={
            fieldErrors.email
              ? `edit-student-email-error-${studentId}`
              : undefined
          }
        />
        {fieldErrors.email && (
          <small
            className="field-error"
            id={`edit-student-email-error-${studentId}`}
            aria-live="polite"
          >
            {fieldErrors.email}
          </small>
        )}
      </div>
      <div className="student-field">
        <label htmlFor={`edit-student-password-${studentId}`}>
          Тимчасовий пароль
        </label>
        <input
          id={`edit-student-password-${studentId}`}
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={MAX_PASSWORD_LENGTH}
          value={temporaryPassword}
          onChange={(event) => {
            const value = event.target.value;
            setTemporaryPassword(value);
            if (fieldErrors.password) {
              setFieldErrors((errors) => ({
                ...errors,
                password: getPasswordError(value),
              }));
            }
          }}
          placeholder="Не змінювати"
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password
              ? `edit-student-password-error-${studentId}`
              : undefined
          }
        />
        {fieldErrors.password && (
          <small
            className="field-error"
            id={`edit-student-password-error-${studentId}`}
            aria-live="polite"
          >
            {fieldErrors.password}
          </small>
        )}
        <small>
          Залиште порожнім, щоб не змінювати пароль. Новий: від{" "}
          {MIN_PASSWORD_LENGTH} символів.
        </small>
      </div>
      <div className="student-edit-actions">
        <button
          className="icon-action icon-action-primary"
          type="submit"
          aria-label="Зберегти зміни"
          title="Зберегти зміни"
          disabled={saving}
        >
          <Save aria-hidden="true" size={18} />
        </button>
        <button
          className="icon-action"
          type="button"
          onClick={onCancel}
          aria-label="Скасувати редагування"
          title="Скасувати редагування"
          disabled={saving}
        >
          <X aria-hidden="true" size={18} />
        </button>
      </div>
    </form>
  );
}
