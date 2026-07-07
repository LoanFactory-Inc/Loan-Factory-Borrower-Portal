import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enGetStarted from "./locales/en/get-started.json";
import enMyLoans from "./locales/en/my-loans.json";
import enApplication from "./locales/en/application.json";
import enRateAlerts from "./locales/en/rate-alerts.json";
import enLoanPurpose from "./locales/en/loan-purpose.json";
import enTestimonials from "./locales/en/testimonials.json";
import enPolicies from "./locales/en/policies.json";
import enQuote from "./locales/en/quote.json";
import enChat from "./locales/en/chat.json";
import enSettings from "./locales/en/settings.json";

import viCommon from "./locales/vi/common.json";
import viAuth from "./locales/vi/auth.json";
import viGetStarted from "./locales/vi/get-started.json";
import viMyLoans from "./locales/vi/my-loans.json";
import viApplication from "./locales/vi/application.json";
import viRateAlerts from "./locales/vi/rate-alerts.json";
import viLoanPurpose from "./locales/vi/loan-purpose.json";
import viTestimonials from "./locales/vi/testimonials.json";
import viPolicies from "./locales/vi/policies.json";
import viQuote from "./locales/vi/quote.json";
import viChat from "./locales/vi/chat.json";
import viSettings from "./locales/vi/settings.json";

export const SUPPORTED_LANGUAGES = ["en", "vi"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

/** Key used to persist the chosen language in localStorage. */
export const LANGUAGE_STORAGE_KEY = "app.lang";

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    getStarted: enGetStarted,
    myLoans: enMyLoans,
    application: enApplication,
    rateAlerts: enRateAlerts,
    loanPurpose: enLoanPurpose,
    testimonials: enTestimonials,
    policies: enPolicies,
    quote: enQuote,
    chat: enChat,
    settings: enSettings,
  },
  vi: {
    common: viCommon,
    auth: viAuth,
    getStarted: viGetStarted,
    myLoans: viMyLoans,
    application: viApplication,
    rateAlerts: viRateAlerts,
    loanPurpose: viLoanPurpose,
    testimonials: viTestimonials,
    policies: viPolicies,
    quote: viQuote,
    chat: viChat,
    settings: viSettings,
  },
} as const;

export const NAMESPACES = Object.keys(resources.en) as (keyof typeof resources.en)[];

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: NAMESPACES,
    defaultNS: "common",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
