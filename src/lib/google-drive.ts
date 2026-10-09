import { getToken } from "next-auth/jwt";

type RefreshedToken = {
  access_token?: string;
  expires_in?: number;
};

export async function getGoogleDriveAccessToken(request: Request): Promise<string | null> {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  if (token?.role !== "teacher") return null;

  const expiresAt = Number(token.googleAccessTokenExpiresAt ?? 0);
  if (typeof token.googleAccessToken === "string" && expiresAt > Date.now() + 60_000) {
    return token.googleAccessToken;
  }

  if (typeof token.googleRefreshToken !== "string") return null;
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.googleRefreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) return null;

  const refreshed = (await response.json()) as RefreshedToken;
  return refreshed.access_token ?? null;
}

export async function getTeacherGoogleDriveAccessToken(
  teacherEmail: string,
): Promise<string | null> {
  const { getTeacherGoogleToken, saveTeacherGoogleToken } = await import("@/lib/db");
  const storedToken = await getTeacherGoogleToken(teacherEmail);
  if (!storedToken) return null;

  const expiresAt = new Date(storedToken.expiresAt).getTime();
  if (expiresAt > Date.now() + 60_000) {
    return storedToken.accessToken;
  }

  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: storedToken.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) return null;

  const refreshed = (await response.json()) as RefreshedToken;
  if (!refreshed.access_token) return null;

  await saveTeacherGoogleToken({
    email: teacherEmail,
    accessToken: refreshed.access_token,
    refreshToken: storedToken.refreshToken,
    expiresAt: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
  });
  return refreshed.access_token;
}
