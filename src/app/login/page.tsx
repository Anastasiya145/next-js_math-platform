import { signIn } from "@/auth";
import { authErrorMessages, errorMessages } from "@/lib/error-messages";
import {
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/lib/validation";
import { router } from "../router";

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
  const errorMessage = error
    ? (authErrorMessages[error] ?? errorMessages.auth.loginFailed)
    : null;
  const setupMessage = googleLoginConfigured
    ? null
    : errorMessages.auth.googleSetup;

  return (
    <main className="login-shell">
      <div className="login-card">
        <div className="brand">
          <span className="brand-mark">∑</span>
          <span>
            Математика
            <br />
            <b>з Анастасією</b>
          </span>
        </div>
        <h1>Вхід до кабінету</h1>
        <p>Увійдіть через Google або email, щоб відкрити свій кабінет.</p>
        {(errorMessage ?? setupMessage) && (
          <p className="materials-error" role="alert">
            {errorMessage ?? setupMessage}
          </p>
        )}
        {googleLoginConfigured && (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: router.home.href });
            }}
          >
            <button className="primary-button google-button" type="submit">
              Увійти через Google
            </button>
          </form>
        )}
        <div className="login-divider" role="separator">
          або
        </div>
        <form
          className="login-credentials-form"
          action={async (formData) => {
            "use server";
            await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirectTo: router.home.href,
            });
          }}
        >
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            maxLength={MAX_EMAIL_LENGTH}
            required
          />
          <label htmlFor="login-password">Пароль</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={MAX_PASSWORD_LENGTH}
            required
          />
          <button className="secondary-button" type="submit">
            Увійти через email
          </button>
        </form>
      </div>
    </main>
  );
}
