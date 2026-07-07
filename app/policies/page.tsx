"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRightIcon, ChevronRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/helpers";
import { AppFooterPortal } from "@/app/application/components/app-footer-portal";
import { ApplicationHeader } from "@/app/application/components/app-header";
import {
  POLICIES,
  POLICY_IDS,
  type PolicyId,
} from "./policies-data";

function isPolicyId(value: string | null): value is PolicyId {
  return value != null && (POLICY_IDS as readonly string[]).includes(value);
}

function PoliciesContent() {
  const { t } = useTranslation("policies");
  const router = useRouter();
  const searchParams = useSearchParams();

  const requested = searchParams.get("policy");
  const activeId: PolicyId = isPolicyId(requested) ? requested : POLICY_IDS[0];
  const active = POLICIES.find((p) => p.id === activeId) ?? POLICIES[0];

  const select = React.useCallback(
    (id: PolicyId) => {
      router.replace(`/policies?policy=${id}`, { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router],
  );

  return (
    <div className="flex min-h-svh flex-col bg-card">
      <ApplicationHeader />

      {/* ── Hero band ── */}
      <div className="border-b bg-page">
        <div className="mx-auto w-full max-w-295 px-4 sm:px-7 py-11">
          <h1 className="text-[44px] leading-none font-extrabold tracking-tight text-foreground">
            {t(`items.${active.id}.title`)}
          </h1>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1">
        <div className="mx-auto grid w-full max-w-295 grid-cols-1 items-start gap-12 px-4 sm:px-7 pt-11 pb-18 md:grid-cols-[280px_1fr]">
          {/* Policy nav */}
          <aside className="md:sticky md:top-24">
            <div className="border-b pb-3.5 text-2xs font-bold tracking-wider text-muted-foreground uppercase">
              {t("sidebarHeading")}
            </div>
            <nav className="mt-3 flex flex-col gap-1.5">
              {POLICIES.map((policy) => {
                const isActive = policy.id === active.id;
                return (
                  <button
                    key={policy.id}
                    type="button"
                    onClick={() => select(policy.id as PolicyId)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center justify-between gap-2.5 rounded-xl px-4 py-3.5 text-left text-sm transition-colors",
                      isActive
                        ? "bg-accent font-bold text-accent-foreground"
                        : "font-medium text-foreground hover:bg-secondary/60",
                    )}
                  >
                    {t(`items.${policy.id}.label`)}
                    <ChevronRightIcon
                      className={cn(
                        "size-4 shrink-0",
                        isActive ? "text-accent-foreground" : "text-muted-foreground/60",
                      )}
                    />
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Article */}
          <article className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-2xl font-bold text-foreground">
                {t(`items.${active.id}.title`)}
              </h2>
              <span className="text-[13px] text-muted-foreground italic">
                ({t("lastUpdated", { date: active.updated })})
              </span>
            </div>
            <div className="mt-3.5 h-[3px] w-11 rounded bg-primary" />
            <div className="mt-4.5 h-px bg-border" />

            <div className="mt-6 flex flex-col">
              {active.blocks.map((block, i) => {
                switch (block.kind) {
                  case "h":
                    return (
                      <h3
                        key={i}
                        className="mt-6.5 text-[22px] font-bold text-foreground first:mt-0"
                      >
                        {block.text}
                      </h3>
                    );
                  case "sub":
                    return (
                      <h4 key={i} className="mt-5 text-[15.5px] font-bold text-foreground">
                        {block.text}
                      </h4>
                    );
                  case "strong":
                    return (
                      <p
                        key={i}
                        className="mt-3.5 text-[15px] leading-relaxed font-semibold text-foreground"
                      >
                        {block.text}
                      </p>
                    );
                  default:
                    return (
                      <p key={i} className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                        {block.text}
                      </p>
                    );
                }
              })}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3 border-t pt-5.5">
              <span className="text-sm text-muted-foreground">{t("questions")}</span>
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                {t("contact")}
                <ArrowRightIcon className="size-3.5" />
              </a>
            </div>
          </article>
        </div>
      </div>

      <AppFooterPortal />
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <React.Suspense fallback={null}>
      <PoliciesContent />
    </React.Suspense>
  );
}
