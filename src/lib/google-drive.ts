import { getToken } from "next-auth/jwt";

type RefreshedToken = {
  access_token?: string;
  expires_in?: number;
};

export async function getGoogleDriveAccessToken(
  request: Request,
): Promise<string | null> {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  if (token?.role !== "teacher") return null;

  const expiresAt = Number(token.googleAccessTokenExpiresAt ?? 0);
  if (
    typeof token.googleAccessToken === "string" &&
    expiresAt > Date.now() + 60_000
  ) {
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
