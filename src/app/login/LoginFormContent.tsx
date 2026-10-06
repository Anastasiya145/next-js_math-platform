"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { router } from "@/app/router";
import { validateEmail, validatePassword } from "@/lib/validation";
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/validation";
import { errorMessages } from "@/lib/error-messages";

// Map NextAuth error codes to user-friendly messages
const errorCodeMap: Record<string, string> = {
  CredentialsSignin: errorMessages.auth.credentialsSignin,
  OAuthSignin: errorMessages.auth.oauthSignin,
  OAuthCallback: errorMessages.auth.oauthCallback,
  AccessDenied: errorMessages.auth.accessDenied,
  Default: errorMessages.auth.loginFailed,
};

export function LoginFormContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const emailError = email.trim() && validateEmail(email);
  const passwordError = password && validatePassword(password);
  const isFormValid = !emailError && !passwordError && email.trim() && password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!isFormValid) return;

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        // Map error code to user-friendly message
        const errorMessage =
          errorCodeMap[result.error] || result.error || errorMessages.auth.loginFailed;
        setServerError(errorMessage);
      } else if (result?.ok) {
        window.location.href = router.home.href;
      }
    } catch {
      setServerError("Помилка підключення. Спробуйте ще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="login-credentials-form" onSubmit={handleSubmit}>
      {serverError && (
        <div className="login-error-message" role="alert">
          {serverError}
        </div>
      )}

      <div className="login-form-field">
        <label htmlFor="login-email">Email</label>
        <input
          className="login-form-input"
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={(e) => setEmail(e.target.value.trim())}
          autoComplete="username"
          maxLength={MAX_EMAIL_LENGTH}
          disabled={isLoading}
          aria-invalid={!!emailError}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {emailError && (
          <span id="email-error" className="login-field-error">
            Будь ласка, введіть дійсний email
          </span>
        )}
      </div>

      <div className="login-form-field">
        <label htmlFor="login-password">Пароль</label>
        <input
          className="login-form-input"
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          minLength={MIN_PASSWORD_LENGTH}
          maxLength={MAX_PASSWORD_LENGTH}
          disabled={isLoading}
          aria-invalid={!!passwordError}
          aria-describedby={passwordError ? "password-error" : undefined}
        />
        {passwordError && (
          <span id="password-error" className="login-field-error">
            {passwordError}
          </span>
        )}
      </div>

      <button className="secondary-button" type="submit" disabled={isLoading || !isFormValid}>
        {isLoading ? "Вхід..." : "Увійти через email"}
      </button>
    </form>
  );
}
