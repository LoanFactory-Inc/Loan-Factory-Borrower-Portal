"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, ClockIcon, LockIcon, TrendingUpIcon } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { cn } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { SelectField } from "../application/components/form-primitives";
import {
  FICO_OPTS,
  INITIAL_FORM,
  LOAN_TYPE_OPTS,
  num,
  OCCUPANCY_OPTS,
  PURPOSE_OPTS,
  saveQuote,
  ZIP_CITY,
  type DocMode,
  type QuoteForm,
} from "./quote-model";
import { PortalPageHeader, PortalShell } from "../components/portal-page";

// ── Page ───────────────────────────────────────────────────────
export default function QuotePage() {
  const { t } = useTranslation("quote");
  const router = useRouter();
  const [docMode, setDocMode] = React.useState<DocMode>("full");
  const [form, setForm] = React.useState<QuoteForm>(INITIAL_FORM);

  const set = (name: keyof QuoteForm, value: string) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const loan = num(form.loanAmount);
  const value = num(form.propertyValue);
  const downPct = value > 0 ? `${Math.max(0, Math.round((1 - loan / value) * 100))}%` : "—";
  const zipCity = ZIP_CITY[form.zip.trim()] ?? t("form.invalidZip");

  // Hand the scenario off to the dedicated result page.
  const onSubmit = () => {
    saveQuote({ form, docMode });
    router.push("/quote/result");
  };

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-295 px-4 sm:px-7 py-11">
        <PortalPageHeader title={t("page.title")} subtitle={t("page.subtitle")} />

        <div className="grid items-start gap-5.5 lg:grid-cols-[0.82fr_1.18fr] mt-6">
          <ValuePanel />

          {/* ── Form card ── */}
          <div className="rounded-2xl border bg-card p-7.5 sm:p-8">
            {/* Doc-mode segmented */}
            <div className="mb-6.5 flex gap-1.5 rounded-md bg-page p-1.25">
              <SegTab
                label={t("docMode.full")}
                active={docMode === "full"}
                onClick={() => setDocMode("full")}
              />
              <SegTab
                label={t("docMode.noIncome")}
                active={docMode === "noinc"}
                onClick={() => setDocMode("noinc")}
              />
            </div>

            <FormView
              form={form}
              set={set}
              downPct={downPct}
              zipCity={zipCity}
              onSubmit={onSubmit}
            />
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

// ── Left value panel ───────────────────────────────────────────
function ValuePanel() {
  const { t } = useTranslation("quote");
  const perks = [
    {
      icon: <TrendingUpIcon className="size-4.75" strokeWidth={1.7} />,
      title: t("panel.lendersTitle"),
      sub: t("panel.lendersSubtitle"),
    },
    {
      icon: <LockIcon className="size-4.75" strokeWidth={1.7} />,
      title: t("panel.creditTitle"),
      sub: t("panel.creditSubtitle"),
    },
    {
      icon: <ClockIcon className="size-4.75" strokeWidth={1.7} />,
      title: t("panel.timeTitle"),
      sub: t("panel.timeSubtitle"),
    },
  ];
  return (
    <div className="sticky top-6 overflow-hidden rounded-2xl bg-[#231f1a] p-8 text-white">
      <span className="inline-flex h-7 items-center gap-1.75 rounded-md bg-primary/16 px-3.25 text-[11.5px] font-bold tracking-wide text-[#ffb27a] uppercase">
        {t("panel.badge")}
      </span>
      <div className="mt-5.5 text-[60px] leading-none font-extrabold tracking-tight text-primary">
        {t("panel.amount")}
      </div>
      <p className="mt-3.5 text-[15.5px] leading-relaxed text-white/70">{t("panel.description")}</p>
      <a
        href="/policies"
        className="mt-5 inline-flex h-10.5 items-center gap-1.75 rounded-md border border-white/18 bg-white/10 px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-white/16"
      >
        {t("panel.terms")}
      </a>

      <div className="mt-7.5 flex flex-col gap-4.5 border-t border-white/12 pt-6.5">
        {perks.map((p) => (
          <div key={p.title} className="flex items-center gap-3.25">
            <span className="flex size-9.5 shrink-0 items-center justify-center rounded-md bg-primary/16 text-[#ffb27a]">
              {p.icon}
            </span>
            <div>
              <div className="text-[14.5px] font-bold">{p.title}</div>
              <div className="text-[12.5px] text-white/55">{p.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Form view ──────────────────────────────────────────────────
function FormView({
  form,
  set,
  downPct,
  zipCity,
  onSubmit,
}: {
  form: QuoteForm;
  set: (name: keyof QuoteForm, value: string) => void;
  downPct: string;
  zipCity: string;
  onSubmit: () => void;
}) {
  const { t } = useTranslation("quote");
  return (
    <div>
      <div className="mb-5 text-[19px] font-extrabold text-foreground">{t("form.heading")}</div>

      <div className="grid gap-4.5 sm:grid-cols-2">
        <Field label={t("form.loanAmount")}>
          <MoneyInput value={form.loanAmount} onChange={(v) => set("loanAmount", v)} />
        </Field>
        <Field label={t("form.propertyValue")} hint={t("form.downPayment", { pct: downPct })}>
          <MoneyInput value={form.propertyValue} onChange={(v) => set("propertyValue", v)} />
        </Field>
        <Field label={t("form.loanPurpose")}>
          <SelectInput
            value={form.purpose}
            onChange={(v) => set("purpose", v)}
            options={PURPOSE_OPTS}
          />
        </Field>
        <Field label={t("form.zip")} hint={zipCity}>
          <TextInput value={form.zip} onChange={(v) => set("zip", v)} inputMode="numeric" />
        </Field>
        <Field label={t("form.occupancy")}>
          <SelectInput
            value={form.occupancy}
            onChange={(v) => set("occupancy", v)}
            options={OCCUPANCY_OPTS}
          />
        </Field>
        <Field label={t("form.loanType")}>
          <SelectInput
            value={form.loanType}
            onChange={(v) => set("loanType", v)}
            options={LOAN_TYPE_OPTS}
          />
        </Field>
      </div>

      <div className="mt-4.5">
        <Field label={t("form.fico")}>
          <SelectInput value={form.fico} onChange={(v) => set("fico", v)} options={FICO_OPTS} />
        </Field>
      </div>

      <Button
        size="lg"
        onClick={onSubmit}
        className="mt-6.5 w-full gap-2.25 rounded-md text-base font-bold shadow-lg shadow-primary/30"
      >
        {t("form.submit")}
        <ArrowRightIcon className="size-4.5" strokeWidth={2} />
      </Button>

      <div className="mt-4 text-center text-[13.5px] text-muted-foreground">
        <Trans
          t={t}
          i18nKey="form.searchNote"
          components={{ b: <strong className="font-bold text-foreground" /> }}
        />
      </div>
      <div className="mt-2 text-center">
        <a
          href="/policies"
          className="text-[13px] font-semibold text-accent-foreground underline underline-offset-2"
        >
          {t("form.disclosure")}
        </a>
      </div>
    </div>
  );
}

// ── Field primitives ───────────────────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.75 block text-[13px] font-semibold text-foreground">
        {label} <span className="text-destructive">*</span>
      </label>
      {children}
      {hint && <div className="mt-1.5 text-[12.5px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

const inputClass =
  "h-13 w-full rounded-md border-[1.5px] border-input bg-card px-4 text-[15px] text-foreground outline-none transition-colors focus-visible:border-ring";

function TextInput({
  value,
  onChange,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  inputMode?: "numeric" | "text";
}) {
  return (
    <input
      type="text"
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}

function MoneyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[15px] text-muted-foreground">
        $
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "pl-7.5")}
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <SelectField
      value={value}
      onValueChange={onChange}
      options={options.map((o) => ({ value: o, label: o }))}
    />
  );
}

function SegTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10.5 flex-1 cursor-pointer rounded-md text-[13.5px] font-bold tracking-wide uppercase transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "bg-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
