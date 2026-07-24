"use client";

import * as React from "react";
import {
  BellIcon,
  ChevronDownIcon,
  ClockIcon,
  MailIcon,
  MessageSquareIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PortalShell } from "@/components/layouts/portal-page";

// ── Data model ─────────────────────────────────────────────────
type Purpose = "Purchase" | "Refinance";
type Channel = "email" | "sms" | "push";
type Freq = "daily" | "once";

interface RateAlert {
  id: number;
  type: string;
  purpose: Purpose;
  target: number;
  current: number;
  amount: number;
  homeValue: number;
  credit: string;
  property: string;
  zip: string;
  freq: Freq;
  channels: Record<Channel, boolean>;
}

interface AlertForm {
  type: string;
  purpose: Purpose;
  target: string;
  amount: string;
  homeValue: string;
  credit: string;
  property: string;
  zip: string;
  freq: Freq;
  email: boolean;
  sms: boolean;
  push: boolean;
}

const TYPE_OPTS = [
  "30-year fixed",
  "15-year fixed",
  "20-year fixed",
  "FHA 30-year",
  "VA 30-year",
  "5/1 ARM",
];
const CREDIT_OPTS = ["760+", "740-759", "720-739", "700-719", "680-699", "660-679", "640-659"];
const PROPERTY_OPTS = ["Single family", "Condo", "Townhouse", "Multi-family", "Manufactured"];

const CURRENT_RATES: Record<string, number> = {
  "30-year fixed": 6.625,
  "15-year fixed": 5.875,
  "20-year fixed": 6.25,
  "FHA 30-year": 6.25,
  "VA 30-year": 6.125,
  "5/1 ARM": 6.0,
};

const INITIAL_ALERTS: RateAlert[] = [
  { id: 1, type: "30-year fixed", purpose: "Purchase", target: 6.25, current: 6.625, amount: 400000, homeValue: 500000, credit: "740+", property: "Single family", zip: "95111", freq: "daily", channels: { email: true, sms: true, push: false } },
  { id: 2, type: "15-year fixed", purpose: "Refinance", target: 5.5, current: 5.875, amount: 320000, homeValue: 610000, credit: "760+", property: "Single family", zip: "95035", freq: "once", channels: { email: true, sms: false, push: false } },
  { id: 3, type: "FHA 30-year", purpose: "Purchase", target: 6.375, current: 6.25, amount: 280000, homeValue: 330000, credit: "680-699", property: "Condo", zip: "94088", freq: "daily", channels: { email: true, sms: false, push: true } },
];

const BLANK_FORM: AlertForm = {
  type: "30-year fixed",
  purpose: "Purchase",
  target: "",
  amount: "",
  homeValue: "",
  credit: "740-759",
  property: "Single family",
  zip: "",
  freq: "daily",
  email: true,
  sms: false,
  push: false,
};

const fmt = (n: number) => `${n.toFixed(3)}%`;
const money = (n: number) => (n ? "$" + n.toLocaleString("en-US") : "");

function RateAlertsContent() {
  const { t } = useTranslation("rateAlerts");
  const searchParams = useSearchParams();
  const [alerts, setAlerts] = React.useState<RateAlert[]>(INITIAL_ALERTS);
  const [nextId, setNextId] = React.useState(4);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState<AlertForm>(BLANK_FORM);

  const patchForm = (patch: Partial<AlertForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const openCreateWithTarget = (target: string) => {
    setForm({ ...BLANK_FORM, target });
    setCreateOpen(true);
  };
  const openCreate = () => openCreateWithTarget("");

  // Deep link (e.g. "Lock this rate" on the quote result) opens the create
  // dialog, prefilling the target rate when provided.
  const create = searchParams.get("create");
  const targetParam = searchParams.get("target");
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (create) openCreateWithTarget(targetParam ?? "");
  }, [create, targetParam]);

  const deleteAlert = (id: number) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  const submitCreate = () => {
    const target = parseFloat(form.target);
    if (!target || Number.isNaN(target)) return;
    const current = CURRENT_RATES[form.type] ?? 6.5;
    setAlerts((prev) => [
      {
        id: nextId,
        type: form.type,
        purpose: form.purpose,
        target,
        current,
        amount: parseInt(form.amount.replace(/\D/g, ""), 10) || 0,
        homeValue: parseInt(form.homeValue.replace(/\D/g, ""), 10) || 0,
        credit: form.credit,
        property: form.property,
        zip: form.zip,
        freq: form.freq,
        channels: { email: form.email, sms: form.sms, push: form.push },
      },
      ...prev,
    ]);
    setNextId((n) => n + 1);
    setCreateOpen(false);
    setForm(BLANK_FORM);
  };

  // Closest to target first.
  const sorted = React.useMemo(
    () => [...alerts].sort((a, b) => a.current - a.target - (b.current - b.target)),
    [alerts],
  );
  const readyCount = sorted.filter((a) => a.current <= a.target).length;
  const watchingCount = sorted.length - readyCount;

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-295 px-4 py-9 sm:px-7">
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={openCreate}
            className="gap-2 rounded-lg px-5.5 text-[14.5px] shadow-lg shadow-primary/30"
          >
            <PlusIcon className="size-4.5" strokeWidth={1.9} />
            {t("page.newAlert")}
          </Button>
        </div>

        {/* ── Summary strip ── */}
        <div className="mt-6 flex flex-wrap gap-2.5">
          <div className="inline-flex h-11 items-center gap-2.5 rounded-xl border bg-card px-4.5">
            <span className="text-xl font-bold tracking-tight text-foreground">{watchingCount}</span>
            <span className="text-[13px] font-medium text-muted-foreground">{t("summary.watching")}</span>
          </div>
          <div className="inline-flex h-11 items-center gap-2.5 rounded-xl border border-primary/30 bg-card px-4.5">
            <span className="text-xl font-bold tracking-tight text-primary">{readyCount}</span>
            <span className="text-[13px] font-medium text-primary">{t("summary.ready")}</span>
          </div>
          <div className="inline-flex h-11 items-center gap-2 rounded-xl border bg-card px-4.5 text-[13px] font-medium text-muted-foreground">
            <span className="size-1.75 rounded-full bg-primary" />
            {t("summary.updated")}
          </div>
        </div>

        {/* ── Two-column ── */}
        <div className="mt-6.5 grid grid-cols-1 items-start gap-5.5 lg:grid-cols-[1fr_320px]">
          {/* alerts column */}
          <div>
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {t("list.heading")}
              </span>
              <span className="h-px flex-1 bg-border" />
              <span className="text-[12.5px] text-muted-foreground">{t("list.sortedBy")}</span>
            </div>

            <div className="flex flex-col gap-3.5">
              {sorted.map((a) => (
                <AlertCard key={a.id} alert={a} onDelete={() => deleteAlert(a.id)} onEdit={openCreate} />
              ))}
            </div>

            {sorted.length === 0 && (
              <div className="rounded-[18px] border border-dashed bg-card px-8 py-12 text-center">
                <div className="mx-auto flex size-13 items-center justify-center rounded-[14px] bg-accent">
                  <BellIcon className="size-6.5 text-primary" strokeWidth={1.7} />
                </div>
                <div className="mt-4 text-[17px] font-bold text-foreground">{t("empty.title")}</div>
                <p className="mx-auto mt-2 mb-5 max-w-85 text-sm leading-relaxed text-muted-foreground">
                  {t("empty.description")}
                </p>
                <Button onClick={openCreate} size="lg" className="rounded-lg">
                  {t("empty.cta")}
                </Button>
              </div>
            )}
          </div>

          {/* context rail */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-6">
            <div className="rounded-[18px] border bg-card p-5.5">
              <div className="text-[15px] font-bold text-foreground">{t("rail.howTitle")}</div>
              <div className="relative mt-4.5">
                {/* vertical connector behind the numbered badges */}
                <span className="absolute top-3.5 bottom-3.5 left-3.25 w-0.5 bg-primary/25" />
                {[1, 2, 3].map((n, i) => (
                  <div key={n} className={cn("relative flex gap-3.5", i < 2 && "pb-5.5")}>
                    <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground ring-4 ring-card">
                      {n}
                    </span>
                    <div className="pt-0.5">
                      <div className="text-[13.5px] font-bold text-foreground">
                        {t(`rail.step${n}Title`)}
                      </div>
                      <div className="mt-0.75 text-[12.5px] leading-relaxed text-muted-foreground">
                        {t(`rail.step${n}Body`)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border border-primary/20 bg-accent p-5.5">
              <div className="text-[15px] font-bold text-foreground">{t("rail.notSureTitle")}</div>
              <p className="mt-2 mb-4 text-[13px] leading-relaxed text-muted-foreground">
                {t("rail.notSureBody")}
              </p>
              <Link
                href="/my-loans/messages"
                className="inline-flex h-10.5 items-center gap-2 rounded-xl bg-primary px-4.5 text-[13.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <MessageSquareIcon className="size-4" strokeWidth={1.8} />
                {t("rail.askOfficer")}
              </Link>
            </div>
          </div>
        </div>

        <CreateAlertDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          form={form}
          patchForm={patchForm}
          onSubmit={submitCreate}
        />
      </div>
    </PortalShell>
  );
}

// ── Alert card ─────────────────────────────────────────────────
function AlertCard({
  alert,
  onDelete,
  onEdit,
}: {
  alert: RateAlert;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const { t } = useTranslation("rateAlerts");
  const triggered = alert.current <= alert.target;
  const diff = alert.current - alert.target;
  const gap = triggered ? t("card.targetHit") : t("card.toGo", { diff: diff.toFixed(3) });
  const prox = triggered ? 100 : Math.max(8, Math.min(100, Math.round((1 - diff / 0.75) * 100)));
  const channelText =
    [alert.channels.email && t("channels.email"), alert.channels.sms && t("channels.sms"), alert.channels.push && t("channels.push")]
      .filter(Boolean)
      .join(" & ") || t("channels.email");

  const scenario = [
    { k: t("scenario.loan"), v: money(alert.amount) },
    { k: t("scenario.value"), v: money(alert.homeValue) },
    { k: t("scenario.fico"), v: alert.credit },
    { k: "", v: alert.property },
    { k: t("scenario.zip"), v: alert.zip },
  ].filter((s) => s.v);

  return (
    <div className="rounded-[18px] border bg-card px-6 pt-5.5 pb-5 transition-shadow hover:shadow-[0_12px_30px_-16px_rgba(23,20,15,0.22)]">
      {/* header */}
      <div className="flex items-center gap-2.5">
        <span className="text-[17px] font-bold tracking-tight text-foreground">{alert.type}</span>
        <span className="rounded-md bg-secondary px-2.25 py-0.75 text-xs font-semibold text-muted-foreground">
          {t(`purpose.${alert.purpose === "Purchase" ? "purchase" : "refinance"}`)}
        </span>
        <span
          className={cn(
            "ml-auto inline-flex h-6.5 items-center rounded-full px-3 text-[11.5px] font-bold tracking-wide",
            triggered ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground",
          )}
        >
          {triggered ? t("card.readyToLock") : t("card.watching")}
        </span>
        <div className="ml-1 flex items-center gap-1.5">
          <IconButton label={t("card.editAlert")} onClick={onEdit}>
            <PencilIcon className="size-3.75" strokeWidth={1.7} />
          </IconButton>
          <IconButton label={t("card.deleteAlert")} onClick={onDelete} danger>
            <Trash2Icon className="size-3.75" strokeWidth={1.6} />
          </IconButton>
        </div>
      </div>

      {/* scenario chips */}
      <div className="mt-3.5 flex flex-wrap gap-1.75">
        {scenario.map((s, i) => (
          <span
            key={i}
            className="inline-flex h-6.75 items-center gap-1.5 rounded-lg bg-secondary px-2.75 text-xs font-semibold text-foreground/80"
          >
            {s.k && (
              <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                {s.k}
              </span>
            )}
            {s.v}
          </span>
        ))}
      </div>

      {/* target vs now */}
      <div className="mt-4.5 flex items-end gap-8.5">
        <div>
          <div className="text-[10.5px] font-bold tracking-wide text-muted-foreground uppercase">
            {t("card.yourTarget")}
          </div>
          <div className="mt-0.75 text-[27px] font-bold tracking-tight text-primary">
            {fmt(alert.target)}
          </div>
        </div>
        <div>
          <div className="text-[10.5px] font-bold tracking-wide text-muted-foreground uppercase">
            {t("card.rateNow")}
          </div>
          <div className="mt-0.75 text-[27px] font-bold tracking-tight text-foreground">
            {fmt(alert.current)}
          </div>
        </div>
        <span
          className={cn(
            "mb-1.5 inline-flex h-6.75 items-center rounded-full px-3.25 text-[12.5px] font-bold",
            "bg-accent text-accent-foreground",
          )}
        >
          {gap}
        </span>
      </div>

      {/* proximity bar */}
      <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${prox}%` }} />
      </div>

      {/* footer */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.75 text-[12.5px] font-semibold text-foreground/80">
          <ClockIcon className="size-3.75 text-primary" strokeWidth={1.8} />
          {alert.freq === "daily" ? t("card.freqDaily") : t("card.freqOnce")}
        </span>
        <span className="h-4 w-px bg-border" />
        <span className="text-[12.5px] text-muted-foreground">
          {t("card.via", { channels: channelText })}
        </span>
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-8.5 items-center justify-center rounded-[9px] border bg-card text-muted-foreground transition-colors",
        danger
          ? "hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          : "hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

// ── Create alert modal ─────────────────────────────────────────
function CreateAlertDialog({
  open,
  onOpenChange,
  form,
  patchForm,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: AlertForm;
  patchForm: (patch: Partial<AlertForm>) => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation("rateAlerts");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="gap-0 p-0" showCloseButton={false}>
        <DialogHeader className="flex-row items-start justify-between gap-4 px-7 pt-6">
          <div className="space-y-1.5">
            <DialogTitle className="text-xl font-bold text-foreground">{t("dialog.title")}</DialogTitle>
            <DialogDescription className="text-[13.5px]">{t("dialog.description")}</DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t("dialog.close")}
            className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-secondary text-foreground/70 transition-colors hover:bg-muted"
          >
            <XIcon className="size-4.5" strokeWidth={1.9} />
          </button>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-7 pt-5.5">
          {/* purpose */}
          <ModalLabel>{t("dialog.loanPurpose")}</ModalLabel>
          <div className="mb-4.5 flex gap-2.5">
            <SegButton label={t("purpose.purchase")} selected={form.purpose === "Purchase"} onClick={() => patchForm({ purpose: "Purchase" })} />
            <SegButton label={t("purpose.refinance")} selected={form.purpose === "Refinance"} onClick={() => patchForm({ purpose: "Refinance" })} />
          </div>

          {/* program + target */}
          <div className="mb-4.5 grid grid-cols-[1.3fr_1fr] gap-4">
            <div>
              <ModalLabel>{t("dialog.loanProgram")}</ModalLabel>
              <SelectField value={form.type} onChange={(v) => patchForm({ type: v })} options={TYPE_OPTS} />
            </div>
            <div>
              <ModalLabel>{t("dialog.targetRate")}</ModalLabel>
              <div className="relative">
                <Input
                  inputMode="decimal"
                  placeholder={t("dialog.targetRatePlaceholder")}
                  value={form.target}
                  onChange={(e) => patchForm({ target: e.target.value })}
                  className="h-12.5 rounded-xl border-[1.5px] pr-9 text-[15px]"
                />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] font-semibold text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* amount + home value */}
          <div className="mb-4.5 grid grid-cols-2 gap-4">
            <div>
              <ModalLabel>{t("dialog.loanAmount")}</ModalLabel>
              <MoneyField value={form.amount} onChange={(v) => patchForm({ amount: v })} placeholder={t("dialog.loanAmountPlaceholder")} />
            </div>
            <div>
              <ModalLabel>{t("dialog.homeValue")}</ModalLabel>
              <MoneyField value={form.homeValue} onChange={(v) => patchForm({ homeValue: v })} placeholder={t("dialog.homeValuePlaceholder")} />
            </div>
          </div>

          {/* credit + property */}
          <div className="mb-4.5 grid grid-cols-2 gap-4">
            <div>
              <ModalLabel>{t("dialog.creditScore")}</ModalLabel>
              <SelectField value={form.credit} onChange={(v) => patchForm({ credit: v })} options={CREDIT_OPTS} />
            </div>
            <div>
              <ModalLabel>{t("dialog.propertyType")}</ModalLabel>
              <SelectField value={form.property} onChange={(v) => patchForm({ property: v })} options={PROPERTY_OPTS} />
            </div>
          </div>

          {/* zip */}
          <div className="mb-4.5 max-w-55">
            <ModalLabel>{t("dialog.zip")}</ModalLabel>
            <Input
              inputMode="numeric"
              placeholder={t("dialog.zipPlaceholder")}
              value={form.zip}
              onChange={(e) => patchForm({ zip: e.target.value })}
              className="h-12.5 rounded-xl border-[1.5px] text-[15px]"
            />
          </div>

          {/* frequency */}
          <ModalLabel>{t("dialog.notifyMe")}</ModalLabel>
          <div className="mb-4.5 flex gap-2.5">
            <FreqButton
              title={t("dialog.freqDailyTitle")}
              sub={t("dialog.freqDailySub")}
              selected={form.freq === "daily"}
              onClick={() => patchForm({ freq: "daily" })}
            />
            <FreqButton
              title={t("dialog.freqOnceTitle")}
              sub={t("dialog.freqOnceSub")}
              selected={form.freq === "once"}
              onClick={() => patchForm({ freq: "once" })}
            />
          </div>

          {/* channels */}
          <ModalLabel>{t("dialog.sendBy")}</ModalLabel>
          <div className="flex gap-2.5">
            <SegButton icon={<MailIcon className="size-4" strokeWidth={1.8} />} label={t("channels.email")} selected={form.email} onClick={() => patchForm({ email: !form.email })} />
            <SegButton icon={<MessageSquareIcon className="size-4" strokeWidth={1.8} />} label={t("channels.sms")} selected={form.sms} onClick={() => patchForm({ sms: !form.sms })} />
            <SegButton icon={<BellIcon className="size-4" strokeWidth={1.8} />} label={t("channels.push")} selected={form.push} onClick={() => patchForm({ push: !form.push })} />
          </div>
        </div>

        <div className="mt-2 flex gap-3 px-7 pt-5.5 pb-6.5">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="lg" className="rounded-lg px-6 text-[15px]">
            {t("dialog.cancel")}
          </Button>
          <Button onClick={onSubmit} size="lg" className="flex-1 rounded-lg text-[15px] shadow-lg shadow-primary/30">
            {t("dialog.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12.5 w-full appearance-none rounded-xl border-[1.5px] bg-card pr-10 pl-4 text-[15px] text-foreground outline-none focus-visible:border-ring"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function MoneyField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[15px] font-semibold text-muted-foreground">
        $
      </span>
      <Input
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12.5 rounded-xl border-[1.5px] pl-8 text-[15px]"
      />
    </div>
  );
}

function ModalLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-[13px] font-semibold text-foreground">{children}</label>;
}

function SegButton({
  icon,
  label,
  selected,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-11.5 flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] text-[13.5px] font-semibold transition-colors",
        selected
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border bg-card text-foreground/70 hover:border-primary/40",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function FreqButton({
  title,
  sub,
  selected,
  onClick,
}: {
  title: string;
  sub: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-16 flex-1 flex-col items-start justify-center gap-0.5 rounded-xl border-[1.5px] px-4 text-left transition-colors",
        selected
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border bg-card text-foreground/70 hover:border-primary/40",
      )}
    >
      <span className="text-[13.5px] font-bold">{title}</span>
      <span className="text-[11.5px] opacity-80">{sub}</span>
    </button>
  );
}

// useSearchParams() requires a Suspense boundary during prerender.
export default function RateAlertsPage() {
  return (
    <React.Suspense fallback={null}>
      <RateAlertsContent />
    </React.Suspense>
  );
}
