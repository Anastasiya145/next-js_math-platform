import type { LanguageCode, SiteType, AppLocale } from "@/lib/languages";

export type Student = {
  id: number;
  name: string;
  grade: number;
  created_at: string;
  email: string | null;
  hasDriveFolder?: boolean;
  siteType: SiteType;
  baseLanguage: LanguageCode | null;
  targetLanguage: LanguageCode | null;
  uiLanguage: AppLocale;
};
