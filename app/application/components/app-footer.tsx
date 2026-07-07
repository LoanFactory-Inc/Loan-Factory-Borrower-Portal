"use client";

import * as React from "react";
import Link from "next/link";
import { HomeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LoanFactoryWordmark } from "@/components/loan-factory-wordmark";

/** Social glyphs — lucide dropped brand icons, so these mirror the design SVGs. */
function FacebookGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}

function LinkedinGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
      <path d="M10 9v12M10 14a4 4 0 018 0v7" />
    </svg>
  );
}

function MailGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M2 7l10 6 10-6" />
    </svg>
  );
}

type FooterLink = { labelKey: string; href: string };

const LINK_COLUMNS: { titleKey: string; links: FooterLink[] }[] = [
  {
    titleKey: "footer.product",
    links: [
      { labelKey: "footer.links.myLoans", href: "/my-loans" },
      { labelKey: "footer.links.rateAlerts", href: "/rate-alerts" },
      { labelKey: "footer.links.aiAssistant", href: "/ai-assistant" },
      { labelKey: "footer.links.loanfactoryIq", href: "/loanfactory-iq" },
    ],
  },
  {
    titleKey: "footer.company",
    links: [
      { labelKey: "footer.links.about", href: "#" },
      { labelKey: "footer.links.testimonials", href: "/testimonials" },
      { labelKey: "footer.links.careers", href: "#" },
      { labelKey: "footer.links.contact", href: "#" },
      { labelKey: "footer.links.help", href: "#" },
    ],
  },
  {
    titleKey: "footer.legal",
    links: [
      { labelKey: "footer.links.privacy", href: "/policies?policy=privacy" },
      { labelKey: "footer.links.terms", href: "/policies?policy=terms" },
      { labelKey: "footer.links.licenses", href: "#" },
      { labelKey: "footer.links.accessibility", href: "#" },
    ],
  },
];

const SOCIAL_LINKS: { icon: React.ElementType; href: string; label: string }[] = [
  { icon: FacebookGlyph, href: "#", label: "Facebook" },
  { icon: LinkedinGlyph, href: "#", label: "LinkedIn" },
  { icon: MailGlyph, href: "#", label: "Email" },
];

/** Footer is hidden across all pages for now — flip to `true` to restore it. */
const SHOW_FOOTER = false as boolean;

export function ApplicationFooter() {
  const { t } = useTranslation("common");

  if (!SHOW_FOOTER) return null;

  return (
    <footer className="mt-auto w-full border-t bg-card text-foreground">
      <div className="mx-auto max-w-295 px-7 pt-11 pb-7">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="pr-5">
            <LoanFactoryWordmark className="h-5.5" />
            <p className="mt-4 max-w-70 text-[13.5px] leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <div className="mt-4.5 flex gap-2.5">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex size-8.5 items-center justify-center rounded-[9px] border text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {LINK_COLUMNS.map((column) => (
            <div key={column.titleKey}>
              <div className="mb-3.5 text-2xs font-bold tracking-wider text-muted-foreground uppercase">
                {t(column.titleKey)}
              </div>
              <div className="flex flex-col gap-2.75">
                {column.links.map((link) => (
                  <Link
                    key={link.labelKey}
                    href={link.href}
                    className="text-[13.5px] text-muted-foreground transition-colors hover:text-primary"
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Meta row */}
        <div className="mt-8.5 flex flex-wrap items-center justify-between gap-4 border-t pt-5.5">
          <div className="flex flex-wrap items-center gap-3.5">
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <HomeIcon className="size-4" strokeWidth={1.6} />
              {t("footer.equalHousing")}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{t("footer.nmls")}</span>
          </div>
          <div className="text-xs text-muted-foreground">{t("footer.copyright")}</div>
        </div>

        <p className="mt-4.5 text-2xs leading-relaxed text-muted-foreground">
          {t("footer.disclaimer")}
        </p>
      </div>
    </footer>
  );
}
