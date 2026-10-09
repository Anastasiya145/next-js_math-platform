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
  const message = error
    ? (authErrorMessages[error] ?? errorMessages.auth.loginFailed)
    : googleLoginConfigured
      ? null
      : errorMessages.auth.googleSetup;

  return <LoginForm googleLoginConfigured={googleLoginConfigured} message={message} />;
}
