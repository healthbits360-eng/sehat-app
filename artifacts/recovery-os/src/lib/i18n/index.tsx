import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import en from "./en.json";
import hi from "./hi.json";

export type Language = "en" | "hi";

const STORAGE_KEY = "appLanguage";

const dictionaries: Record<Language, Record<string, string>> = {
  en: en as Record<string, string>,
  hi: hi as Record<string, string>,
};

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi (Simple)" },
];

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "hi" || stored === "en" ? stored : "en";
}

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => readStoredLanguage());

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: string) => {
      const dict = dictionaries[language] ?? dictionaries.en;
      return dict[key] ?? dictionaries.en[key] ?? key;
    },
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useT must be used within an I18nProvider");
  }
  return ctx;
}
