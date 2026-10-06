import { authErrorMessages, errorMessages } from "@/lib/error-messages";
import { LoginForm } from "./LoginForm";

const googleLoginConfigured = Boolean(
  process.env.AUTH_SECRET?.trim() &&
  process.env.AUTH_GOOGLE_ID?.trim() &&
  process.env.AUTH_GOOGLE_SECRET?.trim() &&
  process.env.ADMIN_EMAIL?.trim(),
);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? (authErrorMessages[error] ?? errorMessages.auth.loginFailed) : null;
  const setupMessage = googleLoginConfigured ? null : errorMessages.auth.googleSetup;

  return (
    <main className="login-shell">
      <LoginForm
        googleLoginConfigured={googleLoginConfigured}
        errorMessage={errorMessage}
        setupMessage={setupMessage}
      />
    </main>
  );
}
