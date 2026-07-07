"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BanknoteIcon,
  CheckIcon,
  ClipboardCheckIcon,
  ClockIcon,
  DownloadIcon,
  FileCheckIcon,
  HomeIcon,
  InfoIcon,
  LockIcon,
  PencilIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingDownIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { AppFooterPortal } from "@/app/application/components/app-footer-portal";
import { ApplicationHeader } from "@/app/application/components/app-header";

type Purpose = "refi" | "buy";
type Sub = "lower" | "cash" | "preapproval" | "offer";
type Method = "ai" | "manual";

const AUTO_ADVANCE_MS = 240;

export default function LoanPurposePage() {
  const router = useRouter();
  const { t } = useTranslation("loanPurpose");
  const [step, setStep] = React.useState(0);
  const [purpose, setPurpose] = React.useState<Purpose | null>(null);
  const [sub, setSub] = React.useState<Sub | null>(null);
  const [method, setMethod] = React.useState<Method>("ai");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const advance = () => setStep((s) => Math.min(s + 1, 2));
  const scheduleAdvance = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(advance, AUTO_ADVANCE_MS);
  };

  const pickPurpose = (p: Purpose) => {
    setPurpose(p);
    setSub(null);
    scheduleAdvance();
  };
  const pickSub = (v: Sub) => {
    setSub(v);
    scheduleAdvance();
  };
  const back = () => {
    if (timer.current) clearTimeout(timer.current);
    setStep((s) => {
      if (s === 2) return 1;
      if (s === 1) {
        setSub(null);
        return 0;
      }
      return 0;
    });
  };

  const stepName =
    step === 0
      ? t("stepNames.purpose")
      : step === 1
        ? purpose === "buy"
          ? t("stepNames.buyStage")
          : t("stepNames.refiGoal")
        : t("stepNames.fillMethod");

  return (
    <div className="flex min-h-svh flex-col bg-page">
      <ApplicationHeader />

      <div className="mx-auto w-full max-w-295 flex-1 px-4 sm:px-7 pt-13 pb-20">
        <div className="w-full">
          {/* ── Minimal progress ── */}
          <div className="mb-10 flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-14 rounded-full transition-colors",
                    i <= step ? "bg-primary" : "bg-border",
                  )}
                />
              ))}
            </div>
            <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t("progress.stepOf", { current: step + 1, total: 3, stepName })}
            </div>
          </div>

          {/* ── Step 0 — Purpose ── */}
          {step === 0 && (
            <>
              <Heading title={t("purpose.title")} subtitle={t("purpose.subtitle")} />
              <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
                <OptionTile
                  icon={RefreshCwIcon}
                  title={t("purpose.refi.title")}
                  desc={t("purpose.refi.desc")}
                  selected={purpose === "refi"}
                  onSelect={() => pickPurpose("refi")}
                />
                <OptionTile
                  icon={HomeIcon}
                  title={t("purpose.buy.title")}
                  desc={t("purpose.buy.desc")}
                  selected={purpose === "buy"}
                  onSelect={() => pickPurpose("buy")}
                />
              </div>

              <Card className="mt-6.5 flex items-start gap-3 rounded-2xl border px-4.5 py-4 shadow-none ring-0">
                <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-xs leading-relaxed text-muted-foreground">
                  <strong className="font-semibold text-foreground/70">{t("privacy.label")}</strong>{" "}
                  {t("privacy.body")}{" "}
                  <a href="#" className="font-medium text-accent-foreground hover:underline">
                    {t("privacy.clbaLink")}
                  </a>{" "}
                  {t("privacy.and")}{" "}
                  <a href="#" className="font-medium text-accent-foreground hover:underline">
                    {t("privacy.californiaLink")}
                  </a>
                  {t("privacy.noSell")}
                </div>
              </Card>

              <div className="mt-4 flex flex-wrap justify-center gap-6">
                <QuestionnaireLink label={t("questionnaires.refinance")} />
                <QuestionnaireLink label={t("questionnaires.purchase")} />
              </div>
            </>
          )}

          {/* ── Step 1 — Refinance goal ── */}
          {step === 1 && purpose === "refi" && (
            <>
              <Heading title={t("refiGoal.title")} subtitle={t("refiGoal.subtitle")} />
              <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
                <OptionTile
                  icon={TrendingDownIcon}
                  title={t("refiGoal.lower.title")}
                  desc={t("refiGoal.lower.desc")}
                  selected={sub === "lower"}
                  onSelect={() => pickSub("lower")}
                />
                <OptionTile
                  icon={BanknoteIcon}
                  title={t("refiGoal.cash.title")}
                  desc={t("refiGoal.cash.desc")}
                  selected={sub === "cash"}
                  onSelect={() => pickSub("cash")}
                />
              </div>
            </>
          )}

          {/* ── Step 1 — Buy stage ── */}
          {step === 1 && purpose === "buy" && (
            <>
              <Heading title={t("buyStage.title")} subtitle={t("buyStage.subtitle")} />
              <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
                <OptionTile
                  icon={FileCheckIcon}
                  title={t("buyStage.preapproval.title")}
                  desc={t("buyStage.preapproval.desc")}
                  selected={sub === "preapproval"}
                  onSelect={() => pickSub("preapproval")}
                />
                <OptionTile
                  icon={ClipboardCheckIcon}
                  title={t("buyStage.offer.title")}
                  desc={t("buyStage.offer.desc")}
                  selected={sub === "offer"}
                  onSelect={() => pickSub("offer")}
                />
              </div>
            </>
          )}

          {/* ── Step 2 — Fill method ── */}
          {step === 2 && (
            <>
              <Heading title={t("fillMethod.title")} subtitle={t("fillMethod.subtitle")} />
              <div className="grid grid-cols-1 items-stretch gap-4.5 sm:grid-cols-2">
                <MethodTile
                  icon={SparklesIcon}
                  title={t("fillMethod.ai.title")}
                  badge={t("fillMethod.ai.badge")}
                  selected={method === "ai"}
                  onSelect={() => setMethod("ai")}
                  desc={t("fillMethod.ai.desc")}
                  features={[
                    t("fillMethod.ai.features.skipPaperwork"),
                    t("fillMethod.ai.features.autoVerified"),
                  ]}
                  featurePositive
                />
                <MethodTile
                  icon={PencilIcon}
                  title={t("fillMethod.manual.title")}
                  selected={method === "manual"}
                  onSelect={() => setMethod("manual")}
                  desc={t("fillMethod.manual.desc")}
                  features={[
                    t("fillMethod.manual.features.fullControl"),
                    t("fillMethod.manual.features.savesAutomatically"),
                  ]}
                />
              </div>
            </>
          )}

          {/* ── Footer ── */}
          <div className="mt-9 flex items-center justify-center gap-3.5">
            {step > 0 && (
              <Button
                variant="outline"
                size="lg"
                className="gap-2 rounded-md px-6 text-[15px]"
                onClick={back}
              >
                <ArrowLeftIcon className="size-4" />
                {t("footer.back")}
              </Button>
            )}
            {step === 2 && (
              <Button
                size="lg"
                className="gap-2 rounded-md px-8 text-[15px] shadow-lg shadow-primary/30"
                onClick={() => router.push(`/application?purpose=${purpose ?? "buy"}`)}
              >
                {t("footer.continue")}
                <ArrowRightIcon className="size-4" />
              </Button>
            )}
            {step === 0 && (
              <span className="text-[13px] text-muted-foreground">
                {t("footer.selectToContinue")}
              </span>
            )}
          </div>

          {/* ── Reassurance ── */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6.5 gap-y-3">
            <Reassure icon={LockIcon} label={t("reassurance.encryption")} />
            <Reassure icon={ShieldCheckIcon} label={t("reassurance.noCreditImpact")} />
            <Reassure icon={ClockIcon} label={t("reassurance.duration")} />
          </div>
        </div>
      </div>

      <AppFooterPortal />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto mb-8 max-w-150 text-center">
      <h1 className="text-[33px] leading-tight font-bold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return selected ? (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-primary">
      <span className="size-3 rounded-full bg-primary" />
    </span>
  ) : (
    <span className="size-6 shrink-0 rounded-full border-2 border-input" />
  );
}

function OptionTile({
  icon: Icon,
  title,
  desc,
  selected,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full flex-col items-start rounded-[20px] border-[1.5px] bg-card px-7 pt-7 pb-7.5 text-left transition-all",
        selected
          ? "border-primary"
          : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(35,31,26,0.28)]",
      )}
    >
      <div className="flex w-full items-start justify-between">
        <span className="flex size-14 items-center justify-center rounded-[15px] bg-accent">
          <Icon className="size-6.75 text-primary" strokeWidth={1.7} />
        </span>
        <Radio selected={selected} />
      </div>
      <div className="mt-5 text-xl font-bold text-foreground">{title}</div>
      <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</div>
    </button>
  );
}

function MethodTile({
  icon: Icon,
  title,
  desc,
  features,
  selected,
  onSelect,
  badge,
  featurePositive = false,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  features: string[];
  selected: boolean;
  onSelect: () => void;
  badge?: string;
  featurePositive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full flex-col items-start rounded-[20px] border-[1.5px] bg-card px-7 pt-7 pb-7.5 text-left transition-all",
        selected
          ? "border-primary"
          : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(35,31,26,0.28)]",
      )}
    >
      <div className="flex w-full items-start justify-between">
        <span
          className={cn(
            "flex size-14 items-center justify-center rounded-[15px]",
            badge ? "bg-accent" : "bg-secondary",
          )}
        >
          <Icon
            className={cn("size-6.5", badge ? "text-primary" : "text-muted-foreground")}
            strokeWidth={1.7}
          />
        </span>
        <Radio selected={selected} />
      </div>
      <div className="mt-5 flex items-center gap-2.5">
        <span className="text-xl font-bold text-foreground">{title}</span>
        {badge && (
          <span className="inline-flex h-5.25 items-center rounded-full bg-success/15 px-2.5 text-[10px] font-bold tracking-wide text-success uppercase">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</div>
      <div className="mt-4 flex flex-col gap-2">
        {features.map((f) => (
          <span key={f} className="inline-flex items-center gap-2 text-[13px] text-foreground/70">
            {featurePositive ? (
              <CheckIcon className="size-3.75 shrink-0 text-success" strokeWidth={2.4} />
            ) : (
              <span className="h-px w-3.5 shrink-0 bg-muted-foreground/60" />
            )}
            {f}
          </span>
        ))}
      </div>
    </button>
  );
}

function QuestionnaireLink({ label }: { label: string }) {
  return (
    <a
      href="#"
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-accent-foreground"
    >
      <DownloadIcon className="size-3.75" />
      {label}
    </a>
  );
}

function Reassure({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] text-muted-foreground">
      <Icon className="size-3.75 text-muted-foreground/70" strokeWidth={1.6} />
      {label}
    </span>
  );
}
