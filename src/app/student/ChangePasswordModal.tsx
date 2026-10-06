"use client";

import { useState } from "react";
import { validatePassword } from "@/lib/validation";
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "@/lib/validation";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordError = newPassword && validatePassword(newPassword);
  const passwordsMatch = newPassword && newPassword === confirmPassword;
  const isFormValid = !passwordError && passwordsMatch && newPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isFormValid) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/student/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Не вдалося змінити пароль.");
        return;
      }

      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError("Помилка підключення. Спробуйте ще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 600 }}>Змінити пароль</h2>

        {success && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#e8f5e9",
              border: "1px solid #4caf50",
              borderRadius: "4px",
              color: "#2e7d32",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            ✓ Пароль успішно змінено!
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#ffebee",
              border: "1px solid #f44336",
              borderRadius: "4px",
              color: "#c62828",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="new-password"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Новий пароль
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              disabled={isLoading}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "password-error" : undefined}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${passwordError ? "#f44336" : "#ddd"}`,
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            {passwordError && (
              <span
                id="password-error"
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#f44336",
                  marginTop: "4px",
                }}
              >
                {passwordError}
              </span>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="confirm-password"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Підтвердіть пароль
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              disabled={isLoading}
              aria-invalid={!!(!passwordsMatch && confirmPassword)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${!passwordsMatch && confirmPassword ? "#f44336" : "#ddd"}`,
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            {!passwordsMatch && confirmPassword && (
              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#f44336",
                  marginTop: "4px",
                }}
              >
                Паролі не співпадають
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: isFormValid ? "#1976d2" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isFormValid ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {isLoading ? "Змінюю..." : "Змінити"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
