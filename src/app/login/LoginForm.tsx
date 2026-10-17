"use client";

import { useEffect, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { router } from "@/app/router";
import { errorMessages } from "@/lib/error-messages";
import {
  MAX_PASSWORD_LENGTH,
  validateEmail,
  validatePassword,
} from "@/lib/validation";
import { glass, shade } from "@/components/tones";
import { PasswordField } from "@/components/PasswordField";
import { EmailField } from "@/components/EmailField";
import { SiteLogo } from "@/components/SiteLogo";
import {
  translate,
  translateError,
  type TranslationKey,
} from "@/lib/language-messages";
import type { AppLocale, SiteType } from "@/lib/languages";
import { siteVariant } from "@/lib/site-variant";

const MATH_SYMBOLS = [
  { symbol: "π", top: "8%", right: "12%", size: 96 },
  { symbol: "∑", bottom: "10%", right: "8%", size: 120 },
  { symbol: "√", bottom: "18%", left: "8%", size: 88 },
  { symbol: "∞", top: "14%", left: "10%", size: 80 },
];

const signInErrors: Record<string, string> = {
  CredentialsSignin: errorMessages.auth.credentialsSignin,
  OAuthSignin: errorMessages.auth.oauthSignin,
  OAuthCallback: errorMessages.auth.oauthCallback,
  AccessDenied: errorMessages.auth.accessDenied,
};

function PasswordLogin({
  provider,
  siteType,
  uiLanguage,
  locale,
}: {
  provider: "credentials" | "teacher-credentials";
  siteType?: SiteType;
  uiLanguage: AppLocale;
  locale: AppLocale;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = email.trim() ? validateEmail(email) : null;
  const passwordError = password ? validatePassword(password) : null;
  const valid =
    Boolean(email.trim() && password) && !emailError && !passwordError;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await signIn(provider, {
        email: email.trim().toLowerCase(),
        password,
        ...(siteType ? { siteType, uiLanguage } : {}),
        redirect: false,
      });
      if (result?.error) {
        setError(
          translateError(
            signInErrors[result.error] ?? errorMessages.auth.loginFailed,
            locale,
          ),
        );
      } else window.location.href = router.home;
    } catch {
      setError(translateError(errorMessages.common.networkFailed, locale));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit}>
      {error && <Alert severity="error">{error}</Alert>}
      <EmailField
        label={translate(locale, "emailLabel")}
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={Boolean(emailError)}
        helperText={emailError ? translateError(emailError, locale) : undefined}
      />
      <PasswordField
        locale={locale}
        label={translate(locale, "passwordLabel")}
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        slotProps={{ htmlInput: { maxLength: MAX_PASSWORD_LENGTH } }}
        error={Boolean(passwordError)}
        helperText={
          passwordError ? translateError(passwordError, locale) : undefined
        }
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        loading={busy}
        disabled={!valid}
      >
        {translate(locale, "signIn")}
      </Button>
    </Stack>
  );
}

export function LoginForm({
  googleLoginConfigured,
  message,
}: {
  googleLoginConfigured: boolean;
  message: string | null;
}) {
  const [role, setRole] = useState<"teacher" | "student">(
    siteVariant === "languages" ? "student" : "teacher",
  );
  const [studentLanguage, setStudentLanguage] = useState<AppLocale>("fr");
  const [googleBusy, setGoogleBusy] = useState(false);
  const locale: AppLocale =
    siteVariant === "languages" ? studentLanguage : "uk";
  const languageSite = siteVariant === "languages";
  const t = (key: TranslationKey) => translate(locale, key);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = languageSite
      ? translate(locale, "languageBrand")
      : "Математика з Анастасією";
  }, [locale, languageSite]);

  return (
    <Box
      sx={{
        display: "grid",
        minHeight: "100vh",
        gridTemplateColumns: { md: "1fr 1fr" },
      }}
    >
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          p: 8,
          color: "primary.contrastText",
          background: `linear-gradient(145deg, ${shade("primary", "dark")}, ${shade("primary")} 55%, ${shade("secondary")})`,
          "&::before": {
            content: '""',
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            top: -140,
            left: -120,
            bgcolor: glass(12),
          },
          "&::after": {
            content: '""',
            position: "absolute",
            width: 320,
            height: 320,
            borderRadius: "50%",
            bottom: -100,
            right: -80,
            bgcolor: glass(10),
          },
        }}
      >
        {!languageSite &&
          MATH_SYMBOLS.map(({ symbol, size, ...position }) => (
            <Typography
              key={symbol}
              aria-hidden
              sx={{
                position: "absolute",
                fontSize: size,
                fontWeight: 700,
                color: glass(22),
                ...position,
              }}
            >
              {symbol}
            </Typography>
          ))}
        <SiteLogo
          size="hero"
          locale={locale}
          sx={{ position: "relative", mb: 3 }}
        />
        <Typography
          variant="h2"
          component="h1"
          sx={{ position: "relative", fontWeight: 700 }}
        >
          {languageSite ? t("languageLoginHeadline") : t("loginHeadline")}
        </Typography>
        <Typography
          variant="h6"
          sx={{ position: "relative", mt: 2, opacity: 0.9, fontWeight: 400 }}
        >
          {languageSite ? t("languageLoginDescription") : t("loginDescription")}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          p: 3,
        }}
      >
        <SiteLogo
          size="compact"
          locale={locale}
          sx={{ display: { xs: "flex", md: "none" } }}
        />
        <Card sx={{ width: "100%", maxWidth: 420 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              {t("loginHeading")}
            </Typography>
            {message && role === "teacher" && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {translateError(message, locale)}
              </Alert>
            )}
            {siteVariant === "math" ? (
              <Tabs
                value={role}
                onChange={(_, value: "teacher" | "student") => setRole(value)}
                variant="fullWidth"
                sx={{ mb: 3 }}
              >
                <Tab value="teacher" label={t("teacherRole")} />
                <Tab value="student" label={t("studentRole")} />
              </Tabs>
            ) : (
              <Stack spacing={1.5} sx={{ mb: 2, alignItems: "flex-end" }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ alignSelf: "flex-start" }}
                >
                  {t("studentRole")}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  aria-label={
                    locale === "fr" ? t("switchToRu") : t("switchToFr")
                  }
                  onClick={() =>
                    setStudentLanguage(locale === "fr" ? "ru" : "fr")
                  }
                  sx={{ minHeight: 40 }}
                >
                  {locale === "fr" ? "RU" : "FR"}
                </Button>
              </Stack>
            )}
            {role === "teacher" ? (
              <Stack spacing={2}>
                <PasswordLogin
                  key="teacher"
                  provider="teacher-credentials"
                  locale="uk"
                  uiLanguage="uk"
                />
                <Divider>{t("or")}</Divider>
                <Button
                  fullWidth
                  size="large"
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  disabled={!googleLoginConfigured}
                  loading={googleBusy}
                  onClick={() => {
                    setGoogleBusy(true);
                    signIn("google", { redirectTo: router.home }).catch(() =>
                      setGoogleBusy(false),
                    );
                  }}
                >
                  {t("googleSignIn")}
                </Button>
              </Stack>
            ) : (
              <PasswordLogin
                key={`student-${siteVariant}`}
                provider="credentials"
                siteType={siteVariant}
                uiLanguage={locale}
                locale={locale}
              />
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
