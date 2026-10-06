"use client";

import { signIn } from "next-auth/react";
import { router } from "@/app/router";
import { LoginFormContent } from "./LoginFormContent";
import { useState } from "react";

export function LoginForm({
  googleLoginConfigured,
  errorMessage,
  setupMessage,
}: {
  googleLoginConfigured: boolean;
  errorMessage: string | null;
  setupMessage: string | null;
}) {
  const [userRole, setUserRole] = useState<"teacher" | "student" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="login-modern-shell">
      {/* Left Panel - Branding & Headline */}
      <div className="login-hero-section">
        <div className="login-hero-content">
          <h1 className="login-hero-title">
            Твій простір
            <br />
            для науки
          </h1>
          <p className="login-hero-subtitle">
            Персональний кабінет для розвитку математичних навичок. Матеріали, завдання, прогрес в
            одному місці.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-form-section">
        <div className="login-form-card">
          <div className="login-form-header">
            <h2 className="login-form-title">Вхід до кабінету</h2>
          </div>

          {(errorMessage ?? setupMessage) && (
            <p className="materials-error" role="alert" style={{ marginBottom: "20px" }}>
              {errorMessage ?? setupMessage}
            </p>
          )}

          {!userRole ? (
            <div className="login-role-selection">
              <p className="login-role-prompt">Ви учитель або учень?</p>
              <div className="login-role-buttons-group">
                <button
                  type="button"
                  onClick={() => setUserRole("teacher")}
                  className="login-role-btn teacher-btn"
                >
                  <span className="role-icon">👨‍🏫</span>
                  <span>Учитель</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserRole("student")}
                  className="login-role-btn student-btn"
                >
                  <span className="role-icon">👨‍🎓</span>
                  <span>Учень</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="login-role-form-wrapper">
              <button type="button" onClick={() => setUserRole(null)} className="login-back-link">
                ← Назад до вибору
              </button>

              {userRole === "teacher" && (
                <div className="login-method-section">
                  <p className="login-method-label">Увійдіть через Google</p>
                  {googleLoginConfigured && (
                    <button
                      className="login-google-button"
                      onClick={() => signIn("google", { redirectTo: router.home.href })}
                      disabled={isLoading}
                    >
                      {isLoading ? "Завантажуємо..." : "Вхід через Google"}
                    </button>
                  )}
                  {!googleLoginConfigured && (
                    <p className="login-error-text">
                      ⚠️ Google-вхід не налаштований. Зверніться до адміністратора.
                    </p>
                  )}
                </div>
              )}

              {userRole === "student" && (
                <div className="login-method-section">
                  <p className="login-method-label">Введіть email та пароль</p>
                  <LoginFormContent />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
