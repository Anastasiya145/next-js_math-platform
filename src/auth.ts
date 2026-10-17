import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { validateEmail, validatePassword } from "@/lib/validation";
import { isAppLocale } from "@/lib/languages";
import { siteVariant } from "@/lib/site-variant";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      name: "Математика з Анастасією",
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
        siteType: { label: "Site", type: "text" },
        uiLanguage: { label: "Language", type: "text" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";
        const siteType = credentials.siteType;
        if (
          validateEmail(email) ||
          validatePassword(password) ||
          siteType !== siteVariant
        ) {
          return null;
        }

        const [
          { findStudentAccount, updateStudentUiLanguage },
          { verifyPassword },
        ] = await Promise.all([import("@/lib/db"), import("@/lib/passwords")]);
        const account = await findStudentAccount(email);
        if (
          !account ||
          account.siteType !== siteType ||
          !verifyPassword(
            password,
            account.password_salt,
            account.password_hash,
          )
        ) {
          return null;
        }

        const requestedLanguage = credentials.uiLanguage;
        const uiLanguage =
          account.siteType === "languages" &&
          isAppLocale(requestedLanguage) &&
          requestedLanguage !== "uk"
            ? requestedLanguage
            : account.uiLanguage;
        if (
          account.siteType === "languages" &&
          (uiLanguage === "fr" || uiLanguage === "ru") &&
          uiLanguage !== account.uiLanguage
        ) {
          await updateStudentUiLanguage(account.id, uiLanguage);
        }

        return {
          id: String(account.id),
          email: account.email,
          name: account.name,
          role: "student",
          studentId: account.id,
          siteType: account.siteType,
          baseLanguage: account.baseLanguage,
          targetLanguage: account.targetLanguage,
          uiLanguage,
        };
      },
    }),
    Credentials({
      id: "teacher-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";
        if (validateEmail(email) || validatePassword(password)) return null;

        const [{ findTeacherAccount }, { verifyPassword }] = await Promise.all([
          import("@/lib/db"),
          import("@/lib/passwords"),
        ]);
        const account = await findTeacherAccount(email);
        if (
          !account ||
          !verifyPassword(
            password,
            account.password_salt,
            account.password_hash,
          )
        ) {
          return null;
        }

        return {
          id: account.email,
          email: account.email,
          name: account.name,
          role: "teacher",
          siteType: "math",
          baseLanguage: null,
          targetLanguage: null,
          uiLanguage: "uk",
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
      if (account?.provider === "credentials") {
        return user.role === "student" && user.siteType === siteVariant;
      }
      const adminEmail = "ivanovaanastasiya145@gmail.com";
      const userEmail = user.email?.trim().toLowerCase();
      const isAdmin = Boolean(
        adminEmail && userEmail && adminEmail === userEmail,
      );
      if (account?.provider === "teacher-credentials") {
        return siteVariant === "math" && user.role === "teacher" && isAdmin;
      }
      if (account?.provider !== "google") return false;
      return siteVariant === "math" && isAdmin;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.role = user.role ?? "teacher";
        token.studentId = user.studentId;
        token.siteType = user.siteType ?? "math";
        token.baseLanguage = user.baseLanguage ?? null;
        token.targetLanguage = user.targetLanguage ?? null;
        token.uiLanguage = user.uiLanguage ?? "uk";
      }
      if (
        !user &&
        typeof token.studentId === "number" &&
        token.siteType === undefined
      ) {
        const { getStudentById } = await import("@/lib/db");
        const student = await getStudentById(token.studentId);
        if (student) {
          token.siteType = student.siteType;
          token.baseLanguage = student.baseLanguage;
          token.targetLanguage = student.targetLanguage;
          token.uiLanguage = student.uiLanguage;
        }
      }
      if (
        trigger === "update" &&
        token.siteType === "languages" &&
        isAppLocale(session?.uiLanguage) &&
        session.uiLanguage !== "uk"
      ) {
        token.uiLanguage = session.uiLanguage;
      }
      if (account?.provider === "google") {
        token.googleAccessToken = account.access_token ?? undefined;
        token.googleRefreshToken = account.refresh_token ?? undefined;
        token.googleAccessTokenExpiresAt = account.expires_at
          ? account.expires_at * 1000
          : undefined;

        // Save teacher's Google tokens to database for student access
        // The Google profile has no `role`; signIn() already limits Google to the teacher.
        const teacherEmail = user?.email ?? token.email;
        if (
          token.role === "teacher" &&
          teacherEmail &&
          account.access_token &&
          account.refresh_token
        ) {
          const { saveTeacherGoogleToken } = await import("@/lib/db");
          try {
            await saveTeacherGoogleToken({
              email: teacherEmail,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              expiresAt: account.expires_at
                ? account.expires_at * 1000
                : Date.now() + 3600000,
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
        session.user.siteType =
          token.siteType === "languages" ? "languages" : "math";
        session.user.baseLanguage =
          token.baseLanguage === "fr" || token.baseLanguage === "ru"
            ? token.baseLanguage
            : null;
        session.user.targetLanguage =
          token.targetLanguage === "fr" || token.targetLanguage === "ru"
            ? token.targetLanguage
            : null;
        session.user.uiLanguage = isAppLocale(token.uiLanguage)
          ? token.uiLanguage
          : "uk";
        if (typeof token.studentId === "number") {
          session.user.studentId = token.studentId;
        }
      }
      return session;
    },
  },
});
