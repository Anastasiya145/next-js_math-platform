"use client";

import { useState } from "react";
import { errorMessages } from "@/lib/error-messages";
import {
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validatePassword,
} from "@/lib/validation";

type StudentFormProps = {
  onAdd: (
    name: string,
    grade: number,
    email: string,
    temporaryPassword: string,
  ) => Promise<boolean>;
};

export function StudentForm({ onAdd }: StudentFormProps) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("4");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const nextErrors = {
      name: trimmedName ? "" : errorMessages.students.nameRequired,
      email: validateEmail(trimmedEmail) ?? "",
      password: validatePassword(temporaryPassword) ?? "",
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || submitting) return;

    setSubmitting(true);
    try {
      const created = await onAdd(
        trimmedName,
        Number(grade),
        trimmedEmail,
        temporaryPassword,
      );
      if (created) {
        setName("");
        setEmail("");
        setTemporaryPassword("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">ДОДАТИ</span>
          <h2>Новий учень</h2>
        </div>
      </div>
      <form className="materials-add-row student-form" onSubmit={handleSubmit}>
        <div className="student-field">
          <label htmlFor="student-name">Ім&apos;я учня</label>
          <input
            id="student-name"
            autoComplete="name"
            maxLength={120}
            placeholder="Наприклад, Марія"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() =>
              setFieldErrors((errors) => ({
                ...errors,
                name: name.trim() ? "" : errorMessages.students.nameRequired,
              }))
            }
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={
              fieldErrors.name ? "student-name-error" : undefined
            }
            required
          />
          {fieldErrors.name && (
            <small
              className="field-error"
              id="student-name-error"
              aria-live="polite"
            >
              {fieldErrors.name}
            </small>
          )}
        </div>
        <div className="student-field">
          <label htmlFor="student-grade">Клас</label>
          <select
            id="student-grade"
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
        <div className="student-field">
          <label htmlFor="student-email">Email учня</label>
          <input
            id="student-email"
            type="email"
            autoComplete="off"
            maxLength={MAX_EMAIL_LENGTH}
            placeholder="учень@example.com"
            value={email}
            onChange={(event) => {
              const value = event.target.value;
              setEmail(value);
              if (fieldErrors.email) {
                setFieldErrors((errors) => ({
                  ...errors,
                  email: validateEmail(value) ?? "",
                }));
              }
            }}
            onBlur={() =>
              setFieldErrors((errors) => ({
                ...errors,
                email: validateEmail(email) ?? "",
              }))
            }
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email ? "student-email-error" : undefined
            }
            required
          />
          {fieldErrors.email && (
            <small
              className="field-error"
              id="student-email-error"
              aria-live="polite"
            >
              {fieldErrors.email}
            </small>
          )}
        </div>
        <div className="student-field">
          <label htmlFor="student-temporary-password">Тимчасовий пароль</label>
          <input
            id="student-temporary-password"
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
                  password: validatePassword(value) ?? "",
                }));
              }
            }}
            onBlur={() =>
              setFieldErrors((errors) => ({
                ...errors,
                password: validatePassword(temporaryPassword) ?? "",
              }))
            }
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password
                ? "student-password-help student-password-error"
                : "student-password-help"
            }
            required
          />
          <small id="student-password-help">
            Від {MIN_PASSWORD_LENGTH} до {MAX_PASSWORD_LENGTH} символів.
            Передайте учню окремо.
          </small>
          {fieldErrors.password && (
            <small
              className="field-error"
              id="student-password-error"
              aria-live="polite"
            >
              {fieldErrors.password}
            </small>
          )}
        </div>
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Додавання…" : "+ Додати учня"}
        </button>
      </form>
    </section>
  );
}
