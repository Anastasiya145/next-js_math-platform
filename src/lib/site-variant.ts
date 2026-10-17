import type { AppLocale, SiteType } from "@/lib/languages";

const configuredVariant = process.env.NEXT_PUBLIC_SITE_VARIANT;

if (
  (process.env.VERCEL === "1" && !configuredVariant) ||
  (configuredVariant !== undefined &&
    configuredVariant !== "math" &&
    configuredVariant !== "languages")
) {
  throw new Error(
    'Set NEXT_PUBLIC_SITE_VARIANT to "math" or "languages" for this deployment',
  );
}

export const siteVariant: SiteType =
  configuredVariant === "languages" ? "languages" : "math";

export const siteConfig =
  siteVariant === "languages"
    ? {
        title: "Langues avec Anastasia",
        description: "Espace élève pour apprendre les langues avec Anastasia.",
        defaultLocale: "fr" as AppLocale,
        favicon: "/favicon-languages.svg",
      }
    : {
        title: "Математика з Анастасією",
        description: "Платформа для репетитора з математики",
        defaultLocale: "uk" as AppLocale,
        favicon: "/favicon-math.svg",
      };
