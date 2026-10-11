"use client";

import { useState, type FormEvent } from "react";
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
  TextField,
  Typography,
} from "@mui/material";
import FunctionsIcon from "@mui/icons-material/Functions";
import GoogleIcon from "@mui/icons-material/Google";
import { router } from "@/app/router";
import { errorMessages } from "@/lib/error-messages";
import {
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
  validateEmail,
  validatePassword,
} from "@/lib/validation";
import { glass, glow, gradientOf, shade } from "@/components/tones";

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

function PasswordLogin({ provider }: { provider: "credentials" | "teacher-credentials" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = email.trim() ? validateEmail(email) : null;
  const passwordError = password ? validatePassword(password) : null;
  const valid = Boolean(email.trim() && password) && !emailError && !passwordError;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await signIn(provider, {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) setError(signInErrors[result.error] ?? errorMessages.auth.loginFailed);
      else window.location.href = router.home;
    } catch {
      setError(errorMessages.common.networkFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        slotProps={{ htmlInput: { maxLength: MAX_EMAIL_LENGTH } }}
        error={Boolean(emailError)}
        helperText={emailError}
      />
      <TextField
        label="Пароль"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        slotProps={{ htmlInput: { maxLength: MAX_PASSWORD_LENGTH } }}
        error={Boolean(passwordError)}
        helperText={passwordError}
      />
      <Button type="submit" variant="contained" size="large" loading={busy} disabled={!valid}>
        Увійти
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
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [googleBusy, setGoogleBusy] = useState(false);

  return (
    <Box sx={{ display: "grid", minHeight: "100vh", gridTemplateColumns: { md: "1fr 1fr" } }}>
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
        {MATH_SYMBOLS.map(({ symbol, size, ...position }) => (
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
        <Stack
          direction="row"
          spacing={2.5}
          sx={{ position: "relative", alignItems: "center", mb: 3 }}
        >
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 96,
              height: 96,
              flexShrink: 0,
              borderRadius: "28px",
              bgcolor: glass(22),
              boxShadow: glow("secondary", 80),
              backdropFilter: "blur(6px)",
            }}
          >
            <FunctionsIcon sx={{ fontSize: 56 }} />
          </Box>
          <Typography variant="h4" component="p" sx={{ fontWeight: 700 }}>
            Математика
            <br />з Анастасією
          </Typography>
        </Stack>
        <Typography variant="h2" component="h1" sx={{ position: "relative", fontWeight: 700 }}>
          Твій простір для науки
        </Typography>
        <Typography
          variant="h6"
          sx={{ position: "relative", mt: 2, opacity: 0.9, fontWeight: 400 }}
        >
          Персональний кабінет для розвитку математичних навичок. Матеріали, завдання, прогрес в
          одному місці.
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
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ display: { xs: "flex", md: "none" }, alignItems: "center" }}
        >
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 44,
              height: 44,
              borderRadius: "14px",
              color: "primary.contrastText",
              background: gradientOf("primary"),
              boxShadow: glow("primary", 70),
            }}
          >
            <FunctionsIcon />
          </Box>
          <Typography variant="h6" component="p">
            Математика{" "}
            <Box component="span" sx={{ color: "secondary.main" }}>
              з Анастасією
            </Box>
          </Typography>
        </Stack>
        <Card sx={{ width: "100%", maxWidth: 420 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Вхід до кабінету
            </Typography>
            {message && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}
            <Tabs
              value={role}
              onChange={(_, value) => setRole(value)}
              variant="fullWidth"
              sx={{ mb: 3 }}
            >
              <Tab value="teacher" label="Вчитель" />
              <Tab value="student" label="Учень" />
            </Tabs>
            {role === "teacher" ? (
              <Stack spacing={2}>
                <PasswordLogin key="teacher" provider="teacher-credentials" />
                <Divider>або</Divider>
                <Button
                  fullWidth
                  size="large"
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  disabled={!googleLoginConfigured}
                  loading={googleBusy}
                  onClick={() => {
                    setGoogleBusy(true);
                    signIn("google", { redirectTo: router.home }).catch(() => setGoogleBusy(false));
                  }}
                >
                  Вхід через Google
                </Button>
              </Stack>
            ) : (
              <PasswordLogin key="student" provider="credentials" />
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
