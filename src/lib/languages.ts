export type SiteType = "math" | "languages";
export type AppLocale = "uk" | "fr" | "ru";
export type LanguageCode = "fr" | "ru";

export const isAppLocale = (value: unknown): value is AppLocale =>
  value === "uk" || value === "fr" || value === "ru";

export const isLanguageCode = (value: unknown): value is LanguageCode =>
  value === "fr" || value === "ru";
