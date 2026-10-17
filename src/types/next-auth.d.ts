import type { DefaultSession } from "next-auth";
import type { AppLocale, LanguageCode, SiteType } from "@/lib/languages";

type UserRole = "teacher" | "student";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    studentId?: number;
    siteType?: SiteType;
    baseLanguage?: LanguageCode | null;
    targetLanguage?: LanguageCode | null;
    uiLanguage?: AppLocale;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      studentId?: number;
      siteType: SiteType;
      baseLanguage: LanguageCode | null;
      targetLanguage: LanguageCode | null;
      uiLanguage: AppLocale;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    studentId?: number;
    siteType?: SiteType;
    baseLanguage?: LanguageCode | null;
    targetLanguage?: LanguageCode | null;
    uiLanguage?: AppLocale;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleAccessTokenExpiresAt?: number;
  }
}
