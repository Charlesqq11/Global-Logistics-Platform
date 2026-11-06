"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export const languages = [
  { code: "en", label: "English", native: "English" },
  { code: "fr", label: "French", native: "Français" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "zh", label: "Chinese", native: "中文" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "uk", label: "Ukrainian", native: "Українська" },
] as const;

export type LanguageCode = (typeof languages)[number]["code"];

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  isReady: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("global-logistics-language");

    if (
      savedLanguage &&
      languages.some((item) => item.code === savedLanguage)
    ) {
      setLanguageState(savedLanguage as LanguageCode);
    }

    setIsReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  function setLanguage(nextLanguage: LanguageCode) {
    setLanguageState(nextLanguage);
    localStorage.setItem("global-logistics-language", nextLanguage);
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, isReady }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}