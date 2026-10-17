"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { api } from "@/lib/api";
import { router } from "@/app/router";
import type { AppLocale, LanguageCode, SiteType } from "@/lib/languages";
import { translate, type TranslationKey } from "@/lib/language-messages";

type LanguageContextValue = {
  locale: AppLocale;
  siteType: SiteType;
  baseLanguage: LanguageCode | null;
  targetLanguage: LanguageCode | null;
  switching: boolean;
  switchError: string | null;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  switchLanguage: () => Promise<void>;
  clearSwitchError: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  const { update } = useSession();
  const siteType = session?.user.siteType ?? "math";
  const baseLanguage = session?.user.baseLanguage ?? null;
  const targetLanguage = session?.user.targetLanguage ?? null;
  const [locale, setLocale] = useState<AppLocale>(
    siteType === "languages" && session?.user.uiLanguage !== "uk"
      ? (session?.user.uiLanguage ?? "fr")
      : "uk",
  );
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const t = (key: TranslationKey, values?: Record<string, string | number>) =>
    translate(locale, key, values);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (siteType === "languages")
      document.title = translate(locale, "languageBrand");
  }, [locale, siteType]);

  const switchLanguage = async () => {
    if (siteType !== "languages" || switching) return;
    const nextLocale = locale === "fr" ? "ru" : "fr";
    setSwitching(true);
    setSwitchError(null);
    try {
      await api(router.api.studentLanguage, {
        method: "PATCH",
        body: { uiLanguage: nextLocale },
        fallback: t("languageSaveFailed"),
      });
      await update({ uiLanguage: nextLocale });
      setLocale(nextLocale);
    } catch {
      setSwitchError(t("languageSaveFailed"));
    } finally {
      setSwitching(false);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        siteType,
        baseLanguage,
        targetLanguage,
        switching,
        switchError,
        t,
        switchLanguage,
        clearSwitchError: () => setSwitchError(null),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useAppLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useAppLanguage must be used inside LanguageProvider");
  return context;
}
