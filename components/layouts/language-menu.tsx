"use client";

import { CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/helpers";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

const LANGUAGES: Record<SupportedLanguage, { flag: string; name: string }> = {
  en: { flag: "🇺🇸", name: "English" },
  vi: { flag: "🇻🇳", name: "Tiếng Việt" },
};

/**
 * Standalone language switcher living in the header bar (a flag button that
 * opens a short list). Kept separate from the profile menu so the borrower can
 * change language without digging into account settings.
 */
export function LanguageMenu() {
  const { t, i18n } = useTranslation("common");

  const currentLang = (
    SUPPORTED_LANGUAGES.includes(i18n.resolvedLanguage as SupportedLanguage)
      ? i18n.resolvedLanguage
      : "en"
  ) as SupportedLanguage;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("account.language")}
        className="flex size-9 items-center justify-center rounded-full text-lg leading-none outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-accent aria-expanded:bg-muted"
      >
        <span aria-hidden>{LANGUAGES[currentLang].flag}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={16} className="w-48 p-1.5">
        <div className="px-2.5 pt-1 pb-2 text-[10.5px] font-bold tracking-wide text-muted-foreground/70 uppercase">
          {t("account.language")}
        </div>
        {SUPPORTED_LANGUAGES.map((lng) => {
          const on = currentLang === lng;
          return (
            <button
              key={lng}
              type="button"
              onClick={() => void i18n.changeLanguage(lng)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold transition-colors",
                on ? "text-primary" : "text-foreground/85 hover:bg-secondary",
              )}
            >
              <span className="text-[17px] leading-none">{LANGUAGES[lng].flag}</span>
              <span className="flex-1 text-left">{LANGUAGES[lng].name}</span>
              {on && <CheckIcon className="size-4 text-primary" strokeWidth={2.4} />}
            </button>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
