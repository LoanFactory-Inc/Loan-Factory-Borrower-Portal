"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  ClockIcon,
  LockIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const STEPS = [
  { num: "1", key: "loanInfo" },
  { num: "2", key: "borrowerInfo" },
  { num: "3", key: "realEstate" },
  { num: "4", key: "liabilities" },
] as const;

const TRUST = [
  { icon: ShieldCheckIcon, key: "encryption" },
  { icon: BadgeCheckIcon, key: "noCredit" },
  { icon: ClockIcon, key: "duration" },
] as const;

/**
 * The "start your application" hero — a two-column card with the intro/CTA on
 * the left and an at-a-glance dark panel on the right. Shared by the standalone
 * get-started page and the empty state of "My loans".
 */
export function GetStartedHero({ className }: { className?: string }) {
  const router = useRouter();
  const { t } = useTranslation("getStarted");

  return (
    <Card
      className={
        "grid grid-cols-1 gap-0 overflow-hidden rounded-3xl border py-0 shadow-[0_26px_64px_-36px_rgba(23,20,15,0.32)] ring-0 lg:grid-cols-[1.12fr_0.88fr] " +
        (className ?? "")
      }
    >
      {/* Left — intro */}
      <div className="flex flex-col p-10 sm:p-13">
        <span className="inline-flex self-start items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold tracking-wide text-accent-foreground">
          <SparklesIcon className="size-3.5" />
          {t("badge")}
        </span>
        <h1 className="mt-6 text-[40px] leading-[1.1] font-bold tracking-tight text-foreground">
          {t("heroTitle")}
        </h1>
        <p className="mt-4.5 max-w-[430px] text-base leading-relaxed text-muted-foreground">
          <Trans
            t={t}
            i18nKey="heroDesc"
            components={{
              1: <strong className="font-semibold text-foreground/80" />,
            }}
          />
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3.5">
          <ShimmerButton
            onClick={() => router.push("/my-loans")}
            background="var(--primary)"
            borderRadius="10px"
            className="h-12 gap-2.5 px-8 text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/30"
          >
            {t("startButton")}
            <ArrowRightIcon className="size-4.5" />
          </ShimmerButton>
        </div>
        <div className="mt-auto flex flex-wrap gap-x-6 gap-y-3 pt-9">
          {TRUST.map(({ icon: Icon, key }) => (
            <div key={key} className="inline-flex items-center gap-2.5 text-[13px] text-foreground/80">
              <span className="flex size-7.5 items-center justify-center rounded-[9px] bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </span>
              {t(`trust.${key}`)}
            </div>
          ))}
        </div>
      </div>

      {/* Right — dark "at a glance" panel */}
      <div className="relative overflow-hidden bg-[#17140f] p-11">
        <svg
          className="pointer-events-none absolute -top-24 -right-32 opacity-[0.06]"
          width="360"
          height="360"
          viewBox="0 0 360 360"
          fill="none"
          aria-hidden
        >
          <circle cx="180" cy="180" r="150" stroke="#fff" strokeWidth="1.4" />
          <circle cx="180" cy="180" r="100" stroke="#fff" strokeWidth="1.4" />
        </svg>
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-[radial-gradient(circle,rgba(243,112,38,0.22),transparent_68%)]" />

        <div className="relative">
          <div className="flex items-baseline justify-between">
            <div className="text-[11px] font-bold tracking-wider text-white/50 uppercase">
              {t("panel.yourApplication")}
            </div>
            <div className="text-xs text-white/50">{t("panel.estimate")}</div>
          </div>

          {/* progress */}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/12">
              <div className="h-full w-[5%] rounded-full bg-primary" />
            </div>
            <span className="text-xs font-semibold whitespace-nowrap text-white/60">
              {t("panel.progress")}
            </span>
          </div>

          <div className="mt-5 flex flex-col">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex size-8.5 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.06] text-[13px] font-bold text-[#f8a56a]">
                    {s.num}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className="my-1.5 min-h-5 w-px flex-1 bg-white/10" />
                  )}
                </div>
                <div className="min-w-0 pb-4">
                  <div className="text-[14.5px] font-semibold text-white">
                    {t(`steps.${s.key}.title`)}
                  </div>
                  <div className="mt-px text-[12.5px] text-white/50">{t(`steps.${s.key}.hint`)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-1.5 flex items-center gap-2.5 border-t border-white/10 pt-4.5 text-[12.5px] text-white/50">
            <LockIcon className="size-3.75" />
            {t("panel.encrypted")}
          </div>
        </div>
      </div>
    </Card>
  );
}
