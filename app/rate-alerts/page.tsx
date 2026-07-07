"use client";

import * as React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BellIcon,
  CheckIcon,
  ChevronDownIcon,
  MailIcon,
  MessageSquareIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  TrendingUpIcon,
  XIcon,
} from "lucide-react";

import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { PortalPageHeader, PortalShell } from "../components/portal-page";

// ── Data model ─────────────────────────────────────────────────
type Purpose = "Purchase" | "Refinance";
type Channel = "email" | "sms" | "push";

interface RateAlert {
  id: number;
  type: string;
  purpose: Purpose;
  target: number;
  current: number;
  channels: Record<Channel, boolean>;
}

interface AlertForm {
  type: string;
  purpose: Purpose;
  target: string;
  amount: string;
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

const CURRENT_RATES: Record<string, number> = {
  "30-year fixed": 6.625,
  "15-year fixed": 5.875,
  "20-year fixed": 6.25,
  "FHA 30-year": 6.25,
  "VA 30-year": 6.125,
  "5/1 ARM": 6.0,
};

const MARKET_RATES = [
  { labelKey: "marketRates.fixed30", rate: "6.625%", delta: "0.05", down: true },
  { labelKey: "marketRates.fixed15", rate: "5.875%", delta: "0.02", down: true },
  { labelKey: "marketRates.fha30", rate: "6.250%", delta: "0.03", down: false },
  { labelKey: "marketRates.va30", rate: "6.125%", delta: "0.04", down: true },
];

const INITIAL_ALERTS: RateAlert[] = [
  {
    id: 1,
    type: "30-year fixed",
    purpose: "Purchase",
    target: 6.25,
    current: 6.625,
    channels: { email: true, sms: true, push: false },
  },
  {
    id: 2,
    type: "15-year fixed",
    purpose: "Refinance",
    target: 5.5,
    current: 5.875,
    channels: { email: true, sms: false, push: false },
  },
  {
    id: 3,
    type: "FHA 30-year",
    purpose: "Purchase",
    target: 6.375,
    current: 6.25,
    channels: { email: true, sms: false, push: true },
  },
];

const BLANK_FORM: AlertForm = {
  type: "30-year fixed",
  purpose: "Purchase",
  target: "",
  amount: "",
  email: true,
  sms: false,
  push: false,
};

const fmt = (n: number) => `${n.toFixed(3)}%`;

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
  // dialog, prefilling the target rate when provided. Opening on mount (rather
  // than via lazy initial state) keeps the server render closed and avoids a
  // hydration mismatch on a hard load of the deep-linked URL.
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
        channels: { email: form.email, sms: form.sms, push: form.push },
      },
      ...prev,
    ]);
    setNextId((n) => n + 1);
    setCreateOpen(false);
    setForm(BLANK_FORM);
  };

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-295 px-4 sm:px-7 py-9">
        <PortalPageHeader
          title={t("page.title")}
          subtitle={t("page.subtitle")}
          action={
            <Button
              size="lg"
              onClick={openCreate}
              className="gap-2 rounded-md px-5.5 text-[14.5px] shadow-lg shadow-primary/30"
            >
              <PlusIcon className="size-4.5" strokeWidth={1.9} />
              {t("page.createAlert")}
            </Button>
          }
        />

        {/* ── Today's rates ticker ── */}
        <Card className="mt-6 gap-0 rounded-2xl border px-2 py-4.5 shadow-none ring-0">
          <div className="flex items-center gap-2 border-b px-5 pb-3.5">
            <TrendingUpIcon className="size-4 text-primary" strokeWidth={1.8} />
            <span className="text-[12.5px] font-bold tracking-wide text-foreground/70">
              {t("ticker.heading")}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{t("ticker.updated")}</span>
          </div>
          <div className="flex flex-wrap">
            {MARKET_RATES.map((r) => (
              <div key={r.labelKey} className="min-w-37.5 flex-1 border-r px-5 py-4 last:border-r-0">
                <div className="text-xs font-semibold text-muted-foreground">{t(r.labelKey)}</div>
                <div className="mt-1.5 flex items-center gap-2.25">
                  <span className="text-[23px] font-bold tracking-tight text-foreground">
                    {r.rate}
                  </span>
                  <span
                    className={cn(
                      "inline-flex h-5.5 items-center gap-0.75 rounded-md px-2 text-xs font-bold",
                      r.down ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {r.down ? (
                      <ArrowDownIcon className="size-3" strokeWidth={2.4} />
                    ) : (
                      <ArrowUpIcon className="size-3" strokeWidth={2.4} />
                    )}
                    {r.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Section header ── */}
        <div className="mt-8 mb-4 flex items-center gap-2.5">
          <div className="text-[17px] font-bold text-foreground">{t("list.heading")}</div>
          <span className="inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-accent px-1.75 text-xs font-bold text-accent-foreground">
            {alerts.length}
          </span>
          <span className="ml-auto text-[13px] text-muted-foreground">
            {t("list.sortedBy")}
          </span>
        </div>

        {/* ── Alert list ── */}
        <div className="flex flex-col gap-3.5">
          {alerts.map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              onDelete={() => deleteAlert(a.id)}
              onEdit={openCreate}
            />
          ))}
          {alerts.length === 0 && (
            <EmptyState
              className="rounded-2xl border border-dashed py-14"
              title={t("empty.title")}
              description={t("empty.description")}
            />
          )}
        </div>

        {/* ── Create alert modal ── */}
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
  const gap = triggered
    ? t("card.readyToLock")
    : t("card.toGo", { diff: diff.toFixed(3) });

  return (
    <Card className="flex flex-col gap-4 rounded-2xl border p-5.5 ring-0 transition-shadow hover:shadow-[0_12px_30px_-16px_rgba(23,20,15,0.22)] sm:flex-row sm:items-center sm:gap-4.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-[13px] bg-accent">
        <TrendingUpIcon className="size-6 text-primary" strokeWidth={1.7} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.25">
          <span className="text-base font-bold text-foreground">{alert.type}</span>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {t(`purpose.${alert.purpose === "Purchase" ? "purchase" : "refinance"}`)}
          </span>
          {triggered && (
            <span className="inline-flex items-center gap-1.25 rounded-md bg-success/12 px-2 py-0.75 text-[11px] font-bold tracking-wide text-success uppercase">
              <CheckIcon className="size-3" strokeWidth={3} />
              {t("card.targetMet")}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-5.5">
          <div>
            <div className="text-[10.5px] font-bold tracking-wider text-muted-foreground uppercase">
              {t("card.target")}
            </div>
            <div className="mt-px text-[19px] font-bold text-accent-foreground">
              {fmt(alert.target)}
            </div>
          </div>
          <div className="h-8.5 w-px bg-border" />
          <div>
            <div className="text-[10.5px] font-bold tracking-wider text-muted-foreground uppercase">
              {t("card.now")}
            </div>
            <div className="mt-px text-[19px] font-bold text-foreground">{fmt(alert.current)}</div>
          </div>
          <span
            className={cn(
              "inline-flex h-6.5 items-center rounded-full px-3 text-[12.5px] font-bold",
              triggered ? "bg-success/12 text-success" : "bg-accent text-accent-foreground",
            )}
          >
            {gap}
          </span>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <span className="mr-0.5 text-[11px] text-muted-foreground">{t("card.alertsVia")}</span>
          {alert.channels.email && <ChannelChip icon={<MailIcon />} label={t("channels.email")} />}
          {alert.channels.sms && <ChannelChip icon={<MessageSquareIcon />} label={t("channels.sms")} />}
          {alert.channels.push && <ChannelChip icon={<BellIcon />} label={t("channels.push")} />}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          type="button"
          onClick={onEdit}
          aria-label={t("card.editAlert")}
          className="flex size-9 items-center justify-center rounded-[9px] border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PencilIcon className="size-4" strokeWidth={1.7} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={t("card.deleteAlert")}
          className="flex size-9 items-center justify-center rounded-[9px] border bg-card text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2Icon className="size-4" strokeWidth={1.6} />
        </button>
      </div>
    </Card>
  );
}

function ChannelChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex h-6.75 items-center gap-1.5 rounded-full border px-2.75 text-xs font-semibold text-foreground/70 [&_svg]:size-3.5 [&_svg]:text-muted-foreground">
      {icon}
      {label}
    </span>
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
            <DialogTitle className="text-xl font-bold text-foreground">
              {t("dialog.title")}
            </DialogTitle>
            <DialogDescription className="text-[13.5px]">
              {t("dialog.description")}
            </DialogDescription>
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

        <div className="px-7 pt-5.5">
          {/* Loan type */}
          <ModalLabel>{t("dialog.loanType")}</ModalLabel>
          <div className="relative mb-4.5">
            <select
              value={form.type}
              onChange={(e) => patchForm({ type: e.target.value })}
              className="h-12.5 w-full appearance-none rounded-xl border-[1.5px] bg-card pr-10 pl-4 text-[15px] text-foreground outline-none focus-visible:border-ring"
            >
              {TYPE_OPTS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          {/* Loan purpose */}
          <ModalLabel>{t("dialog.loanPurpose")}</ModalLabel>
          <div className="mb-4.5 flex gap-2.5">
            <SegButton
              label={t("purpose.purchase")}
              selected={form.purpose === "Purchase"}
              onClick={() => patchForm({ purpose: "Purchase" })}
            />
            <SegButton
              label={t("purpose.refinance")}
              selected={form.purpose === "Refinance"}
              onClick={() => patchForm({ purpose: "Refinance" })}
            />
          </div>

          {/* Target + amount */}
          <div className="mb-4.5 grid grid-cols-2 gap-4">
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
            <div>
              <ModalLabel>
                {t("dialog.loanAmount")}{" "}
                <span className="font-normal text-muted-foreground">
                  {t("dialog.loanAmountOptional")}
                </span>
              </ModalLabel>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[15px] font-semibold text-muted-foreground">
                  $
                </span>
                <Input
                  inputMode="numeric"
                  placeholder={t("dialog.loanAmountPlaceholder")}
                  value={form.amount}
                  onChange={(e) => patchForm({ amount: e.target.value })}
                  className="h-12.5 rounded-xl border-[1.5px] pl-8 text-[15px]"
                />
              </div>
            </div>
          </div>

          {/* Notify by */}
          <ModalLabel>{t("dialog.notifyMeBy")}</ModalLabel>
          <div className="flex gap-2.5">
            <SegButton
              icon={<MailIcon className="size-4" strokeWidth={1.8} />}
              label={t("channels.email")}
              selected={form.email}
              onClick={() => patchForm({ email: !form.email })}
            />
            <SegButton
              icon={<MessageSquareIcon className="size-4" strokeWidth={1.8} />}
              label={t("channels.sms")}
              selected={form.sms}
              onClick={() => patchForm({ sms: !form.sms })}
            />
            <SegButton
              icon={<BellIcon className="size-4" strokeWidth={1.8} />}
              label={t("channels.push")}
              selected={form.push}
              onClick={() => patchForm({ push: !form.push })}
            />
          </div>
        </div>

        <div className="mt-2 flex gap-3 px-7 pt-5.5 pb-6.5">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            size="lg"
            className="rounded-md px-6 text-[15px]"
          >
            {t("dialog.cancel")}
          </Button>
          <Button
            onClick={onSubmit}
            size="lg"
            className="flex-1 rounded-md text-[15px] shadow-lg shadow-primary/30"
          >
            {t("dialog.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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

// useSearchParams() requires a Suspense boundary during prerender.
export default function RateAlertsPage() {
  return (
    <React.Suspense fallback={null}>
      <RateAlertsContent />
    </React.Suspense>
  );
}
