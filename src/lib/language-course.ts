import type { LanguageCode } from "@/lib/languages";

export const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];

export const isLanguageLevel = (value: unknown): value is LanguageLevel =>
  LANGUAGE_LEVELS.some((level) => level === value);

export const LANGUAGE_SECTIONS = [
  "grammar",
  "vocabulary",
  "phonetics",
  "reading",
  "speaking",
] as const;
export type LanguageSection = (typeof LANGUAGE_SECTIONS)[number];

export const isLanguageSection = (value: unknown): value is LanguageSection =>
  LANGUAGE_SECTIONS.some((section) => section === value);

// Teacher-facing (Ukrainian) labels; the student portal translates sections itself.
export const LANGUAGE_SECTION_LABELS: Record<LanguageSection, string> = {
  grammar: "Граматика",
  vocabulary: "Лексика",
  phonetics: "Фонетика",
  reading: "Читання",
  speaking: "Мовлення",
};

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  ru: "Російська мова",
  fr: "Французька мова",
};

export type LanguageTopicMaterial = { id: number; name: string; url: string };

export type LanguageTopic = {
  id: number;
  language: LanguageCode;
  level: LanguageLevel;
  section: LanguageSection;
  title: string;
  description: string;
  position: number;
  materials: LanguageTopicMaterial[];
};

// A course topic as the student sees it: studied once a held lesson covered it.
export type StudentCourseTopic = LanguageTopic & {
  studied: boolean;
  homeworkCount: number;
};
