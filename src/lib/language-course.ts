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

export type LanguageWord = {
  id: number;
  term: string;
  translation: string;
  example: string;
};

export type WordInput = Omit<LanguageWord, "id">;

export const MAX_WORDS_PER_BATCH = 200;

// One word per line: "term — translation — optional example sentence" (also "-" or a tab).
export function parseWordList(text: string): WordInput[] | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0 || lines.length > MAX_WORDS_PER_BATCH) return null;
  const words: WordInput[] = [];
  for (const line of lines) {
    const [term = "", translation = "", ...rest] = line
      .split(/\s+[—–-]\s+|\t/)
      .map((part) => part.trim());
    const example = rest.join(" — ");
    if (
      !term ||
      !translation ||
      term.length > 160 ||
      translation.length > 160 ||
      example.length > 300
    ) {
      return null;
    }
    words.push({ term, translation, example });
  }
  return words;
}

export const isWordInput = (value: unknown): value is WordInput => {
  if (typeof value !== "object" || value === null) return false;
  const { term, translation, example } = value as Record<string, unknown>;
  return (
    typeof term === "string" &&
    typeof translation === "string" &&
    typeof example === "string" &&
    term.trim().length > 0 &&
    term.length <= 160 &&
    translation.trim().length > 0 &&
    translation.length <= 160 &&
    example.length <= 300
  );
};

export type LanguageTopic = {
  id: number;
  language: LanguageCode;
  level: LanguageLevel;
  section: LanguageSection;
  title: string;
  description: string;
  position: number;
  materials: LanguageTopicMaterial[];
  words: LanguageWord[];
};

// A course topic as the student sees it: studied once a held lesson covered it.
export type StudentCourseTopic = LanguageTopic & {
  studied: boolean;
  homeworkCount: number;
};
