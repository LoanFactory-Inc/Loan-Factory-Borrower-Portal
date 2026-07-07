"use client";

import * as React from "react";
import { I18nextProvider } from "react-i18next";

import i18n, {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isSupportedLanguage,
} from "./index";

function readStoredLanguage(): string {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(stored)) return stored;
    const fromNavigator = window.navigator.language?.split("-")[0];
    if (isSupportedLanguage(fromNavigator)) return fromNavigator;
  } catch {
    // localStorage có thể bị chặn (private mode) → dùng mặc định.
  }
  return DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Áp dụng ngôn ngữ đã lưu sau khi mount (client-only) để không lệch với SSR.
    const stored = readStoredLanguage();
    if (stored !== i18n.resolvedLanguage) {
      void i18n.changeLanguage(stored);
    }
    document.documentElement.lang = i18n.resolvedLanguage ?? DEFAULT_LANGUAGE;

    const handleChange = (lng: string) => {
      document.documentElement.lang = lng;
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
      } catch {
        // bỏ qua nếu không ghi được localStorage
      }
    };

    i18n.on("languageChanged", handleChange);
    return () => {
      i18n.off("languageChanged", handleChange);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
