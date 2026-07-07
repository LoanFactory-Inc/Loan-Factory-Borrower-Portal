"use client";

import * as React from "react";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/helpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

const LANGUAGES: Record<SupportedLanguage, { flag: string; nativeName: string }> = {
  en: { flag: "🇺🇸", nativeName: "English" },
  vi: { flag: "🇻🇳", nativeName: "Tiếng Việt" },
};

type Variant = "pill" | "icon";

export function LanguageSwitcher({
  variant = "pill",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const { i18n, t } = useTranslation("common");
  const current = (
    SUPPORTED_LANGUAGES.includes(i18n.resolvedLanguage as SupportedLanguage)
      ? i18n.resolvedLanguage
      : "en"
  ) as SupportedLanguage;

  const changeLanguage = (lng: SupportedLanguage) => {
    void i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("language.label")}
        className={cn(
          variant === "pill"
            ? "inline-flex h-9 items-center gap-2 rounded-full border bg-card px-3.5 text-[13.5px] font-semibold text-foreground/80 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-accent"
            : "inline-flex h-9 items-center gap-1.5 rounded-full px-2 outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-accent aria-expanded:bg-muted",
          className,
        )}
      >
        {variant === "pill" ? (
          <>
            <span className="text-[15px]">{LANGUAGES[current].flag}</span>
            {LANGUAGES[current].nativeName}
            <ChevronDownIcon className="size-3.5 text-muted-foreground" />
          </>
        ) : (
          <>
            <span className="text-[16px] leading-none">{LANGUAGES[current].flag}</span>
            <ChevronDownIcon className="size-3.5 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={16} className="min-w-40">
        {SUPPORTED_LANGUAGES.map((lng) => {
          const { flag, nativeName } = LANGUAGES[lng];
          const active = current === lng;
          return (
            <DropdownMenuItem
              key={lng}
              onClick={() => changeLanguage(lng)}
              className={cn(
                "gap-2.5 focus:bg-secondary! focus:text-foreground! focus:**:text-foreground!",
                active && "font-semibold",
              )}
            >
              <span className="text-[15px]">{flag}</span>
              <span className="flex-1">{nativeName}</span>
              {active && <CheckIcon className="size-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
