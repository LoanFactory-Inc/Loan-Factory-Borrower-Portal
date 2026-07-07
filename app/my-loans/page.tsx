"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CheckIcon,
  FileIcon,
  FileTextIcon,
  HomeIcon,
  PencilIcon,
  PlusIcon,
  UploadIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, groupDigits } from "@/lib/helpers";
import { EmptyState } from "@/components/empty-state";
import { useAppSelector } from "@/store/hooks";
import { GetStartedHero } from "../get-started/get-started-hero";
import { PortalPageHeader, PortalShell } from "../components/portal-page";

type DocTab = "outstanding" | "completed";
type LoanFilter = "active" | "closed" | "all";

interface NeededDoc {
  id: number;
  /** Key into the `docNames` translation group. */
  nameKey: string;
  /** English name used to derive the mock uploaded file name. */
  name: string;
  /** Human "requested" label, e.g. "2 minutes ago". */
  time: string;
  uploaded: boolean;
  fileName?: string;
}

const INITIAL_DOCS: NeededDoc[] = [
  {
    id: 1,
    nameKey: "bankStatements",
    name: "Latest 2 months bank statements",
    time: "2 minutes ago",
    uploaded: false,
  },
  {
    id: 2,
    nameKey: "taxForms",
    name: "W-2s or 1099s (last 2 years)",
    time: "2 minutes ago",
    uploaded: false,
  },
  {
    id: 3,
    nameKey: "payStubs",
    name: "Recent pay stubs (last 30 days)",
    time: "2 minutes ago",
    uploaded: false,
  },
  { id: 4, nameKey: "govId", name: "Government-issued ID", time: "2 minutes ago", uploaded: false },
  {
    id: 5,
    nameKey: "insurance",
    name: "Homeowners insurance declaration",
    time: "5 minutes ago",
    uploaded: false,
  },
  {
    id: 6,
    nameKey: "mortgageStatement",
    name: "Current mortgage statement",
    time: "5 minutes ago",
    uploaded: false,
  },
  {
    id: 7,
    nameKey: "propertyTax",
    name: "Property tax bill",
    time: "8 minutes ago",
    uploaded: false,
  },
  {
    id: 8,
    nameKey: "borrowerAuth",
    name: "Signed borrower authorization",
    time: "8 minutes ago",
    uploaded: false,
  },
];

const fileNameFor = (name: string) => `${name.split(" ").slice(0, 2).join("-").toLowerCase()}.pdf`;

/** Ordered milestones for the loan status stepper (keys into `stepper.steps`). */
const LOAN_STEPS = ["submitted", "inReview", "processing", "underwriting", "clearToClose"] as const;
/** Index of the milestone a submitted loan sits at (0-based) → "In review". */
const CURRENT_STEP = 1;

/**
 * Tab state persisted in the URL query string, so a selected tab survives a
 * page reload / shared link. Falls back to `fallback` when the param is absent
 * or holds a value outside `values`.
 */
function useQueryTab<T extends string>(
  key: string,
  values: readonly T[],
  fallback: T,
  { writeDefault = false }: { writeDefault?: boolean } = {},
): [T, (value: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const param = searchParams.get(key);
  const value = param && (values as readonly string[]).includes(param) ? (param as T) : fallback;

  const setValue = React.useCallback(
    (next: T) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, key],
  );

  // Persist the resolved value to the URL on entry so the param is always
  // present (e.g. `?loan=active` on first visit), not just held in state.
  React.useEffect(() => {
    if (writeDefault && param !== value) {
      setValue(value);
    }
  }, [writeDefault, param, value, setValue]);

  return [value, setValue];
}

function MyLoansContent() {
  const router = useRouter();
  const { t } = useTranslation("myLoans");

  // No writeDefault: the URL stays clean (`/my-loans`) until the borrower
  // actually picks a filter, rather than eagerly appending `?loan=active`.
  const [loanFilter, setLoanFilter] = useQueryTab<LoanFilter>(
    "loan",
    ["active", "closed", "all"],
    "active",
  );
  const [tab, setTab] = useQueryTab<DocTab>("doc", ["outstanding", "completed"], "outstanding");
  const [docs, setDocs] = React.useState<NeededDoc[]>(INITIAL_DOCS);

  const total = docs.length;
  const uploadedCount = docs.filter((d) => d.uploaded).length;
  const pct = Math.round((uploadedCount / total) * 100);

  // The card reflects the borrower's most recently submitted/saved application
  // from Redux, so a freshly submitted loan (or an edit) surfaces here.
  const applications = useAppSelector((s) => s.application.applications);
  const currentLoan = React.useMemo(
    () =>
      [...applications].sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""))[0],
    [applications],
  );
  const purposeLabel = currentLoan
    ? t(currentLoan.purpose === "refi" ? "card.purposeRefi" : "card.purposeBuy")
    : "";
  const currentStep = currentLoan?.status === "submitted" ? CURRENT_STEP : 0;

  const showLoanContent = loanFilter !== "closed" && !!currentLoan;
  // The documents section is tied to a single loan, so it's hidden when the
  // borrower is viewing all loans at once.
  const showDocuments = loanFilter !== "all";

  const upload = (id: number) =>
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, uploaded: true, fileName: fileNameFor(d.name) } : d)),
    );

  const visibleDocs = docs.filter((d) => (tab === "outstanding" ? !d.uploaded : d.uploaded));
  const showEmpty = visibleDocs.length === 0;

  const hasLoan = !!currentLoan;

  return (
    <PortalShell hideChat={!hasLoan}>
      <div className="mx-auto w-full max-w-295 px-4 sm:px-7 py-9">
        <PortalPageHeader
          title={t("page.title")}
          subtitle={t("page.subtitle")}
          action={
            hasLoan ? <LoanFilterTabs value={loanFilter} onChange={setLoanFilter} /> : undefined
          }
        />

        {showLoanContent ? (
          <>
            {/* ── Loan summary card ── */}
            <Card className="mt-6 gap-0 overflow-hidden rounded-[18px] border py-0 shadow-none ring-0">
              {/* header + progress stepper */}
              <div className="px-7 pt-6 pb-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[19px] font-bold text-foreground">
                        {purposeLabel} · {currentLoan.loanType}
                      </span>
                      {currentLoan.status === "submitted" && (
                        <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold tracking-wide text-sky-700 uppercase dark:bg-sky-950/50 dark:text-sky-300">
                          {t("card.new")}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => router.push(`/application?mode=edit&id=${currentLoan.id}`)}
                        className="inline-flex items-center gap-1.25 text-[12.5px] font-semibold text-primary hover:underline"
                      >
                        <PencilIcon className="size-3.5" strokeWidth={1.9} />
                        {t("card.edit")}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                      <HomeIcon className="size-[17px]" strokeWidth={1.7} />
                      <span className="text-[14.5px] text-foreground/70">
                        {currentLoan.propertyAddress}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {currentLoan.status === "submitted" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.75 py-1.5 text-[12.5px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        <span className="size-[7px] rounded-full bg-amber-400" />
                        {t("card.inReview")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.75 py-1.5 text-[12.5px] font-bold text-muted-foreground">
                        <span className="size-[7px] rounded-full bg-muted-foreground/50" />
                        {t("card.inProgress")}
                      </span>
                    )}
                  </div>
                </div>
                {/* progress stepper */}
                <div className="mt-5.5">
                  <div className="mb-2.75 flex items-end justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                        {t("stepper.currentStep")}
                      </div>
                      <div className="mt-0.75 flex items-baseline gap-2.25">
                        <span className="text-base font-bold text-foreground">
                          {t(`stepper.steps.${LOAN_STEPS[currentStep]}`)}
                        </span>
                        <span className="text-[12.5px] font-semibold text-muted-foreground">
                          {t("stepper.stepOf", {
                            current: currentStep + 1,
                            total: LOAN_STEPS.length,
                          })}
                        </span>
                      </div>
                    </div>
                    <span className="text-[12.5px] text-muted-foreground">{t("stepper.next")}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {LOAN_STEPS.map((s, i) => (
                      <div
                        key={s}
                        className={cn(
                          "h-1.5 rounded-full",
                          i <= currentStep ? "bg-primary" : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-5 gap-1.5 text-[11.5px]">
                    {LOAN_STEPS.map((s, i) => (
                      <span
                        key={s}
                        className={cn(
                          i === currentStep
                            ? "font-bold text-primary"
                            : "font-semibold text-muted-foreground",
                          i > currentStep && "text-muted-foreground/60",
                          i === LOAN_STEPS.length - 1 && "text-right",
                        )}
                      >
                        {t(`stepper.steps.${s}`)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* key facts */}
              <div className="grid grid-cols-2 gap-px border-t bg-border/70 sm:grid-cols-3">
                <SummaryCell
                  label={t("summary.loanAmount.label")}
                  value={`$${groupDigits(currentLoan.loanAmount)}`}
                  hint={t("summary.loanAmount.hint")}
                />
                <SummaryCell
                  label={t("summary.interestRate.label")}
                  value="6.75%"
                  hint={t("summary.interestRate.hint")}
                />
                <SummaryCell
                  label={t("summary.payment.label")}
                  value="$3,373"
                  hint={t("summary.payment.hint")}
                />
                <SummaryCell
                  label={t("summary.rateType.label")}
                  value={t("summary.rateType.value")}
                  hint={t("summary.rateType.hint")}
                />
                <SummaryCell
                  label={t("summary.financing.label")}
                  value={t("summary.financing.value")}
                  hint={t("summary.financing.hint")}
                />
                <SummaryCell
                  label={t("summary.closing.label")}
                  value="Aug 15, 2026"
                  hint={t("summary.closing.hint")}
                />
              </div>
            </Card>

            {/* ── Needed documents ── */}
            {showDocuments && (
              <Card className="mt-5 gap-0 rounded-[18px] border px-7 pt-6.5 pb-2.5 shadow-none ring-0">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <div className="text-[17px] font-bold text-foreground">
                      {t("documents.title")}
                    </div>
                    <div className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed text-muted-foreground">
                      {t("documents.description")}
                    </div>
                  </div>
                  <div className="min-w-52">
                    <div className="mb-1.75 flex items-center justify-between">
                      <span className="text-[12.5px] font-semibold text-foreground/70">
                        {t("documents.uploadedCount", { uploaded: uploadedCount, total })}
                      </span>
                      <span className="text-[12.5px] font-bold text-primary">{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-250 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* tabs */}
                <div className="mt-5.5 flex gap-6.5 border-b">
                  <DocTabButton
                    label={t("documents.tabs.outstanding", { count: total - uploadedCount })}
                    active={tab === "outstanding"}
                    onClick={() => setTab("outstanding")}
                  />
                  <DocTabButton
                    label={t("documents.tabs.completed", { count: uploadedCount })}
                    active={tab === "completed"}
                    onClick={() => setTab("completed")}
                  />
                </div>

                {/* list */}
                <div className="pt-1.5 pb-4">
                  {showEmpty ? (
                    <EmptyState
                      imageClassName="h-32"
                      title={
                        tab === "outstanding"
                          ? t("documents.empty.caughtUpTitle")
                          : t("documents.empty.emptyTitle")
                      }
                      description={
                        tab === "outstanding"
                          ? t("documents.empty.caughtUpDesc")
                          : t("documents.empty.emptyDesc")
                      }
                    />
                  ) : (
                    visibleDocs.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-4 border-b border-border/60 py-3.75 last:border-b-0"
                      >
                        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-muted">
                          <FileTextIcon
                            className="size-[18px] text-muted-foreground"
                            strokeWidth={1.6}
                          />
                          {d.uploaded && (
                            <span className="absolute -right-1.25 -bottom-1.25 flex size-[17px] items-center justify-center rounded-full border-2 border-card bg-success">
                              <CheckIcon
                                className="size-2.25 text-success-foreground"
                                strokeWidth={3.2}
                              />
                            </span>
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="text-[14.5px] font-semibold text-foreground">
                            {t(`docNames.${d.nameKey}`)}
                          </div>
                          {d.uploaded ? (
                            <div className="mt-1.5 inline-flex items-center gap-1.75 rounded-md bg-muted px-2.25 py-0.75 text-[12.5px] text-foreground/70">
                              <FileIcon
                                className="size-[13px] text-muted-foreground"
                                strokeWidth={1.7}
                              />
                              {d.fileName}
                            </div>
                          ) : (
                            <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                              {t("documents.requested", { time: d.time })}
                            </div>
                          )}
                        </div>

                        {d.uploaded ? (
                          <div className="inline-flex items-center gap-2.5">
                            <span className="inline-flex items-center rounded-md bg-success/12 px-4 py-1.5 text-[13px] font-semibold text-success">
                              {t("documents.complete")}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => upload(d.id)}
                              className="inline-flex items-center gap-1.75 rounded-md border bg-card px-3.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted/60"
                            >
                              <PlusIcon className="size-3.75" strokeWidth={1.9} />
                              {t("documents.addFile")}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="lg"
                            onClick={() => upload(d.id)}
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-4.5 text-[13.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
                          >
                            <UploadIcon className="size-[15px]" strokeWidth={1.8} />
                            {t("documents.upload")}
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}
          </>
        ) : loanFilter === "closed" ? (
          <EmptyState
            className="mt-6 rounded-[18px] border bg-card py-14"
            title={t("filter.closedEmptyTitle")}
            description={t("filter.closedEmptyDesc")}
          />
        ) : (
          // No active loan yet — show the get-started hero so the borrower can
          // kick off a fresh application.
          <GetStartedHero className="mt-6" />
        )}
      </div>
    </PortalShell>
  );
}

const FILTER_KEYS: LoanFilter[] = ["active", "closed", "all"];

function LoanFilterTabs({
  value,
  onChange,
}: {
  value: LoanFilter;
  onChange: (value: LoanFilter) => void;
}) {
  const { t } = useTranslation("myLoans");
  return (
    <div className="inline-flex items-center gap-0.75 rounded-xl border bg-muted p-1.25">
      {FILTER_KEYS.map((key) => {
        const on = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-[9px] px-4 text-[13px] font-semibold whitespace-nowrap transition-[background,color,box-shadow]",
              on
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`filter.${key}`)}
          </button>
        );
      })}
    </div>
  );
}

function SummaryCell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-card px-7 py-3.75">
      <div className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      <div className="mt-1 text-base font-bold text-foreground">{value}</div>
      {hint && (
        <div className="mt-0.5 text-[12px] leading-snug font-medium text-muted-foreground/80">
          {hint}
        </div>
      )}
    </div>
  );
}

function DocTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "-mb-px h-auto rounded-none border-0 border-b-2 px-0 pb-3 text-sm hover:bg-transparent",
        active
          ? "border-b-primary font-bold text-primary hover:text-primary"
          : "border-b-transparent font-semibold text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Button>
  );
}

// useSearchParams() (via useQueryTab) requires a Suspense boundary during prerender.
export default function MyLoansPage() {
  return (
    <React.Suspense fallback={null}>
      <MyLoansContent />
    </React.Suspense>
  );
}
