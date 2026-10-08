import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { validateEmail, validatePassword } from "@/lib/validation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      name: "Математика з Анастасією",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";
        if (validateEmail(email) || validatePassword(password)) return null;

        const [{ findStudentAccount }, { verifyPassword }] = await Promise.all([
          import("@/lib/db"),
          import("@/lib/passwords"),
        ]);
        const account = await findStudentAccount(email);
        if (!account || !verifyPassword(password, account.password_salt, account.password_hash)) {
          return null;
        }

        // Check if this email belongs to the teacher (admin)
        const adminEmail = "ivanovaanastasiya145@gmail.com";
        const isTeacher = email === adminEmail;

        return {
          id: String(account.id),
          email: account.email,
          name: account.name,
          role: isTeacher ? "teacher" : "student",
          studentId: isTeacher ? undefined : account.id,
        };
      },
    }),
  ],
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Only the platform owner (admin) is allowed to sign in.
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return user.role === "student";
      if (account?.provider !== "google") return false;
      const adminEmail = "ivanovaanastasiya145@gmail.com";
      const userEmail = user.email?.trim().toLowerCase();
      return Boolean(adminEmail && userEmail && adminEmail === userEmail);
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role ?? "teacher";
        token.studentId = user.studentId;
      }
      if (account?.provider === "google") {
        token.googleAccessToken = account.access_token ?? undefined;
        token.googleRefreshToken = account.refresh_token ?? undefined;
        token.googleAccessTokenExpiresAt = account.expires_at
          ? account.expires_at * 1000
          : undefined;
        
        // Save teacher's Google tokens to database for student access
        if (user?.role === "teacher" && user.email && account.access_token && account.refresh_token) {
          const { saveTeacherGoogleToken } = await import("@/lib/db");
          try {
            await saveTeacherGoogleToken({
              email: user.email,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              expiresAt: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600000,
            });
          } catch {
            // Log but don't fail authentication if token saving fails
            console.error("Failed to save teacher Google token");
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role === "student" ? "student" : "teacher";
        if (typeof token.studentId === "number") {
          session.user.studentId = token.studentId;
        }
      }
      return session;
    },
  },
});
