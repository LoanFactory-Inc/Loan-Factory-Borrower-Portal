"use client";

import * as React from "react";
import { CheckIcon, HomeIcon, LockIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

const RESUME_STEPS = [
  { key: "loanInfo", done: true },
  { key: "borrowerInfo", done: true },
  { key: "realEstate", done: false },
] as const;

const RESUME_RING_CIRC = 2 * Math.PI * 24;

/**
 * Dark marketing panel shown alongside the login form on larger screens.
 * Purely decorative — mirrors the "resume your application" story from the design.
 */
export function BrandPanel() {
  const { t } = useTranslation("auth");

  return (
    <div className="relative hidden shrink-0 flex-col justify-between overflow-hidden bg-[#17140f] p-14 lg:flex lg:basis-[47%]">
      {/* ambient decor */}
      <svg
        width="440"
        height="440"
        viewBox="0 0 440 440"
        className="pointer-events-none absolute -top-32 -right-36 opacity-5"
      >
        <circle cx="220" cy="220" r="180" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="220" cy="220" r="120" fill="none" stroke="#fff" strokeWidth="1.5" />
      </svg>
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full bg-[radial-gradient(circle,rgba(243,111,32,0.20),transparent_68%)]" />

      <div className="relative z-10 flex items-center gap-3">
        <HomeIcon className="size-8 text-primary" strokeWidth={1.7} />
      </div>

      <div className="relative z-10">
        <h1 className="max-w-[440px] text-[37px] leading-[1.14] font-bold tracking-tight whitespace-pre-line text-white">
          {t("brand.title")}
        </h1>
        <p className="mt-4 max-w-[400px] text-base leading-relaxed text-white/60">
          {t("brand.subtitle")}
        </p>

        {/* floating resume card */}
        <div className="mt-8 max-w-[372px] animate-[lffloat_6s_ease-in-out_infinite] rounded-[20px] bg-white p-5 shadow-[0_34px_60px_-22px_rgba(0,0,0,0.55)]">
          <div className="text-[10.5px] font-bold tracking-wide text-[#adb5bd] uppercase">
            {t("brand.yourApplication")}
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative size-[58px] shrink-0">
              <svg width="58" height="58" viewBox="0 0 58 58">
                <circle cx="29" cy="29" r="24" fill="none" stroke="#f1f3f5" strokeWidth="6" />
                <circle
                  cx="29"
                  cy="29"
                  r="24"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={RESUME_RING_CIRC}
                  strokeDashoffset={RESUME_RING_CIRC * 0.4}
                  transform="rotate(-90 29 29)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#25262b]">
                60%
              </div>
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#25262b]">
                {t("brand.sectionsProgress", { done: 3, total: 5 })}
              </div>
              <div className="mt-0.5 text-[13px] text-[#868e96]">
                {t("brand.next", { step: t("brand.steps.realEstate") })}
              </div>
            </div>
          </div>
          <div className="my-4 h-px bg-[#f1f3f5]" />
          <div className="flex flex-col gap-2.5">
            {RESUME_STEPS.map((step) => (
              <div key={step.key} className="flex items-center gap-2.5">
                <span
                  className={
                    step.done
                      ? "flex size-5 items-center justify-center rounded-full bg-success/15"
                      : "flex size-5 items-center justify-center rounded-full bg-accent"
                  }
                >
                  {step.done ? (
                    <CheckIcon className="size-3 text-success" strokeWidth={3} />
                  ) : (
                    <span className="size-[7px] rounded-full bg-primary" />
                  )}
                </span>
                <span
                  className={
                    step.done
                      ? "text-[13.5px] text-[#495057]"
                      : "text-[13.5px] font-semibold text-[#25262b]"
                  }
                >
                  {t(`brand.steps.${step.key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 text-[13px] text-white/40">
        <LockIcon className="size-[15px]" strokeWidth={1.6} />
        {t("brand.encryption")}
      </div>
    </div>
  );
}
