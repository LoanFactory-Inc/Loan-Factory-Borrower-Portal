"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  FileIcon,
  FileTextIcon,
  HomeIcon,
  PencilIcon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { LoanSuccessDialog } from "@/components/loan-success-dialog";
import { cn } from "@/lib/helpers";
import { useAppSelector } from "@/store/hooks";
import { LoanIntakeModal } from "./loan-intake-modal";
import { PortalShell } from "@/components/layouts/portal-page";
import type { LoanApplication } from "@/store/slices/application-slice";
import { listBorrowerLoans, type BorrowerLoan } from "./services";
import {
  getApplicationDetail,
  getApplicationSections,
  type ApplicationSections,
} from "@/app/application/services/borrower-application";
import { firstIncompleteStep, stepPage, stepSignalsFrom } from "@/app/application/sections";
import { useLoansView } from "@/hooks/use-loans-view";

/** A backend transaction id (UUID) — locally-created loans use a `TR-#####` id. */
const TX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fields the loan summary card renders — a rich Redux LoanApplication (filled
 *  on this device) and a backend-only BorrowerLoan both satisfy this. */
type DisplayLoan = Pick<
  LoanApplication,
  "id" | "purpose" | "status" | "loanType" | "propertyAddress" | "loanAmount"
> & {
  /** Human loan number (e.g. "TR-84920"), shown next to the status when known. */
  loanNumber?: string;
};

/** Build a display card from a backend loan when there's no local snapshot. */
function backendToDisplay(l: BorrowerLoan): DisplayLoan {
  return {
    id: l.id,
    purpose: l.purpose || "buy",
    status: l.status,
    loanType: "",
    propertyAddress: l.borrowerName,
    loanAmount: l.loanAmount,
    loanNumber: l.loanNumber,
  };
}

/** Documents the borrower is asked to send once the loan is submitted. */
interface NeededDoc {
  id: number;
  /** Key into the `docNames` translation group. */
  nameKey: string;
  /** Human "requested" label, e.g. "2 minutes ago". */
  time: string;
  /** Uploaded file, when present. */
  fileName?: string;
  /** Object URL for previewing/opening the uploaded file. */
  previewUrl?: string;
  /** Whether the uploaded file is an image (renders an inline thumbnail). */
  isImage?: boolean;
}

const INITIAL_DOCS: NeededDoc[] = [
  { id: 1, nameKey: "bankStatements", time: "2 minutes ago" },
  { id: 2, nameKey: "taxForms", time: "2 minutes ago" },
  { id: 3, nameKey: "payStubs", time: "2 minutes ago" },
  { id: 4, nameKey: "govId", time: "2 minutes ago" },
  { id: 5, nameKey: "insurance", time: "5 minutes ago" },
  { id: 6, nameKey: "mortgageStatement", time: "5 minutes ago" },
  { id: 7, nameKey: "propertyTax", time: "8 minutes ago" },
  { id: 8, nameKey: "borrowerAuth", time: "8 minutes ago" },
];

function MyLoansContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation("myLoans");

  // Empty state: show the intro cards first; the AI card routes to the
  // full-screen short application, the manual card opens the classic modal.
  const [intakeOpen, setIntakeOpen] = React.useState(false);

  // How the loan summary + documents are laid out: stacked (one column, the
  // default) or a side-by-side grid (loan card left, documents right). The
  // control lives in the profile menu; this page just reads the shared choice.
  const [view] = useLoansView();

  // The application flow lands here with `?celebrate=created|edited`. Capture it
  // once, then strip the param so a refresh doesn't re-open the modal.
  const [celebrate, setCelebrate] = React.useState<"created" | "edited" | null>(() => {
    const c = searchParams.get("celebrate");
    return c === "created" || c === "edited" ? c : null;
  });
  React.useEffect(() => {
    if (!searchParams.get("celebrate")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("celebrate");
    router.replace(`/my-loans${params.toString() ? `?${params}` : ""}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backend is the source of truth for whether an application exists; Redux
  // holds the rich form snapshot when the borrower filled it out on this device.
  const applications = useAppSelector((s) => s.application.applications);

  // Real loans come from tera-be (BorrowerLoanController), scoped to the
  // authenticated borrower. Redux still holds the rich form snapshot when the
  // borrower filled the application out on this device.
  const [backendLoans, setBackendLoans] = React.useState<BorrowerLoan[] | null>(null);
  const [backendError, setBackendError] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    listBorrowerLoans()
      .then((loans) => alive && setBackendLoans(loans))
      .catch(() => alive && setBackendError(true));
    return () => {
      alive = false;
    };
  }, []);

  const reduxLatest = React.useMemo(
    () =>
      [...applications].sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""))[0],
    [applications],
  );

  const loadingBackend = backendLoans === null && !backendError;
  const backendLatest = backendLoans && backendLoans.length > 0 ? backendLoans[0] : null;
  // Prefer the rich Redux card for the same transaction, when we have it.
  const reduxMatch = backendLatest
    ? applications.find((a) => a.id === backendLatest.id)
    : undefined;

  // Backend errored → fall back to local state (offline dev still works).
  // Backend loaded → it decides existence. Still loading → show local to avoid
  // flashing the get-started intake before the result arrives.
  const currentLoan: DisplayLoan | undefined = backendError
    ? reduxLatest
    : backendLoans !== null
      ? backendLatest
        ? (reduxMatch ?? backendToDisplay(backendLatest))
        : undefined
      : reduxLatest;
  const purposeLabel = currentLoan
    ? t(currentLoan.purpose === "refi" ? "card.purposeRefi" : "card.purposeBuy")
    : "";

  // Pull the saved 1003 for the current loan so the summary card shows REAL
  // values (address, loan type…) instead of placeholders. camelCase on the wire
  // for this DTO, so read both casings.
  const currentId = currentLoan?.id;
  const [detail, setDetail] = React.useState<Record<string, unknown> | null>(null);
  // The non-1003 sections (employments, assets, demographics) live on a separate
  // endpoint and are absent from the 1003 detail — both are needed to know which
  // steps are actually complete.
  const [sections, setSections] = React.useState<ApplicationSections | null>(null);
  React.useEffect(() => {
    if (!currentId || !TX_UUID.test(currentId)) return;
    let alive = true;
    getApplicationDetail(currentId)
      .then((d) => alive && setDetail(d as unknown as Record<string, unknown>))
      .catch(() => {
        /* toasted centrally */
      });
    getApplicationSections(currentId, { skipErrorToast: true })
      .then((s) => alive && setSections(s))
      .catch(() => {
        /* best-effort enrichment */
      });
    return () => {
      alive = false;
    };
  }, [currentId]);

  const dstr = (snake: string, camel: string): string | undefined => {
    const v = detail?.[snake] ?? detail?.[camel];
    return typeof v === "string" && v ? v : undefined;
  };

  const loanTypeStr = dstr("loan_type", "loanType");

  // Property address for the card: real 1003 address, else composed city/state/zip.
  const cityStateZip = [dstr("city", "city"), dstr("state", "state"), dstr("zip", "zip")]
    .filter(Boolean)
    .join(" ");
  const addressDisplay =
    dstr("full_address", "fullAddress") || cityStateZip || currentLoan?.propertyAddress || "";

  // Which screen the borrower should tackle next, computed from the saved 1003 +
  // sections (shared step identity with the flow). Drives the in-progress card's
  // "Continue" CTA — e.g. property done → resume at "Loan terms".
  const stepSignals = stepSignalsFrom(detail, sections);
  const nextStep = firstIncompleteStep(stepSignals);

  const isSubmitted = currentLoan?.status === "submitted";

  // Resume the flow: submitted loans reopen for edits, in-progress loans jump to
  // the next incomplete step.
  const openApplication = () => {
    if (!currentLoan) return;
    if (isSubmitted) {
      router.push(`/application?mode=edit&id=${currentLoan.id}`);
      return;
    }
    router.push(`/application?mode=edit&id=${currentLoan.id}&step=${stepPage(nextStep)}`);
  };

  const loanTitle = `${purposeLabel}${loanTypeStr ? ` · ${loanTypeStr}` : ""}`;
  const hasLoan = !!currentLoan;

  // Grid puts the loan card and documents side by side (stacking on narrow
  // viewports); stacked keeps the single-column flow. The wrapper owns the
  // spacing so the cards don't carry their own top margins.
  const layoutClass =
    view === "grid"
      ? "mt-6 grid items-start gap-5 lg:grid-cols-[1fr_2fr]"
      : "mt-6 flex flex-col gap-5";

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-295 px-4 py-9 sm:px-7">
        {hasLoan ? (
          isSubmitted ? (
            <div className={layoutClass}>
              {/* ── Submitted loan card ── */}
              <Card className="gap-0 overflow-hidden rounded-[18px] border py-0 shadow-none ring-0">
                <div className="px-7 py-6">
                  <div className="flex flex-col items-start gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.75 py-1.5 text-[12.5px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      <span className="size-1.75 rounded-full bg-amber-400" />
                      {t("card.inReview")}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-[19px] font-bold text-foreground">{loanTitle}</span>
                        <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold tracking-wide text-sky-700 uppercase dark:bg-sky-950/50 dark:text-sky-300">
                          {t("card.new")}
                        </span>
                        <button
                          type="button"
                          onClick={openApplication}
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary transition-colors hover:text-primary/80"
                        >
                          <PencilIcon className="size-3.5" strokeWidth={1.9} />
                          {t("card.edit")}
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                        <HomeIcon className="size-4.25" strokeWidth={1.7} />
                        <Link
                          href="/loanfactory-iq"
                          className="text-[14.5px] font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
                        >
                          {addressDisplay || t("card.addressTbd")}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* ── Documents to send ── */}
              <NeededDocumentsCard />
            </div>
          ) : (
            /* ── In-progress card ── */
            <div className={layoutClass}>
            <Card className="gap-0 rounded-[18px] border p-7 shadow-none ring-0">
              <div className="flex items-start gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <HomeIcon className="size-5.5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <span className="text-[19px] font-bold tracking-tight text-foreground">
                      {purposeLabel}
                    </span>
                    {loanTypeStr && (
                      <span className="rounded-md border bg-muted/60 px-2 py-0.5 text-[12px] font-semibold text-foreground/70">
                        {loanTypeStr}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-start gap-1.5 text-muted-foreground">
                    <Link
                      href="/loanfactory-iq"
                      className="text-[14px] font-medium leading-snug text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
                    >
                      {addressDisplay || t("card.addressTbd")}
                    </Link>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-sky-100 px-2.75 py-1 text-[12px] font-bold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                    <span className="size-1.75 rounded-full bg-sky-500" />
                    {t("card.inProgress")}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex w-full flex-col items-start gap-4 rounded-[14px] border border-primary/15 bg-primary/5 px-6 py-5.5">
                <div className="w-full">
                  <div className="text-lg font-bold text-foreground">
                    {t("card.almostDoneTitle")}
                  </div>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
                    {t("card.almostDoneDesc")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="lg"
                  onClick={openApplication}
                  className="shrink-0 gap-2 px-6"
                >
                  {t("card.resume")}
                  <ArrowRightIcon className="size-4.25" strokeWidth={2.1} />
                </Button>
              </div>
            </Card>

            {/* ── Documents to send ── */}
            <NeededDocumentsCard />
            </div>
          )
        ) : // No active loan yet — show the get-started hero so the borrower can
        // kick off a fresh application.
        loadingBackend ? (
          // Fetching the borrower's loans — hold the space so the intake
          // doesn't flash before the result arrives.
          <Card className="mt-6 h-40 animate-pulse rounded-[18px] border bg-muted/40 shadow-none ring-0" />
        ) : (
          <StartApplicationIntro
            onStartAi={() => router.push("/apply")}
            onOpenForm={() => setIntakeOpen(true)}
          />
        )}
      </div>
      {intakeOpen && <LoanIntakeModal onClose={() => setIntakeOpen(false)} />}
      {celebrate && (
        <LoanSuccessDialog
          mode={celebrate}
          onClose={() => setCelebrate(null)}
          onSendDocuments={() => {
            setCelebrate(null);
            // Let the modal begin unmounting, then bring the document-collection
            // card into view so the borrower lands on the real next step.
            requestAnimationFrame(() =>
              document
                .getElementById("needed-documents")
                ?.scrollIntoView({ behavior: "smooth", block: "start" }),
            );
          }}
        />
      )}
    </PortalShell>
  );
}

/**
 * The document-collection card, shown inline once the loan is submitted. Files
 * are held in-memory with object URLs for preview — nothing is uploaded to a
 * backend in this portal build.
 */
function NeededDocumentsCard() {
  const { t } = useTranslation("myLoans");
  const [docs, setDocs] = React.useState<NeededDoc[]>(INITIAL_DOCS);

  // One hidden input reused for every row; `pendingDocId` remembers which doc
  // the picked file belongs to.
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pendingDocId = React.useRef<number | null>(null);

  const openFilePicker = (id: number) => {
    pendingDocId.current = id;
    fileInputRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = pendingDocId.current;
    e.target.value = "";
    pendingDocId.current = null;
    if (!file || id == null) return;
    const previewUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith("image/");
    setDocs((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        if (d.previewUrl) URL.revokeObjectURL(d.previewUrl);
        return { ...d, fileName: file.name, previewUrl, isImage };
      }),
    );
  };

  const removeFile = (id: number) =>
    setDocs((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        if (d.previewUrl) URL.revokeObjectURL(d.previewUrl);
        return { ...d, fileName: undefined, previewUrl: undefined, isImage: undefined };
      }),
    );

  // Release outstanding object URLs on unmount.
  const docsRef = React.useRef(docs);
  React.useEffect(() => {
    docsRef.current = docs;
  }, [docs]);
  React.useEffect(
    () => () => {
      docsRef.current.forEach((d) => d.previewUrl && URL.revokeObjectURL(d.previewUrl));
    },
    [],
  );

  const allUploaded = docs.every((d) => !!d.fileName);

  return (
    <Card
      id="needed-documents"
      className="scroll-mt-24 gap-0 rounded-[18px] border px-7 pt-6.5 pb-3 shadow-none ring-0"
    >
      <div>
        <div className="text-lg font-bold text-foreground">{t("docsPage.cardTitle")}</div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={onFileSelected}
      />

      <div className="pt-4 pb-1">
        {allUploaded ? (
          <EmptyState
            imageClassName="h-32"
            title={t("docsPage.allCaughtUpTitle")}
            description={t("docsPage.allCaughtUpDesc")}
          />
        ) : null}

        {docs.map((d) => {
          const uploaded = !!d.fileName;
          return (
            <div
              key={d.id}
              className="flex items-start gap-4 border-b border-border/60 py-4 last:border-b-0"
            >
              {/* thumbnail / file icon */}
              <span className="relative flex size-10.5 shrink-0 items-center justify-center rounded-[9px] border bg-muted">
                {d.previewUrl && d.isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.previewUrl}
                    alt={d.fileName}
                    className="size-full rounded-[9px] object-cover"
                  />
                ) : (
                  <FileTextIcon className="size-4.75 text-muted-foreground" strokeWidth={1.6} />
                )}
                {uploaded && (
                  <span className="absolute -right-1.25 -bottom-1.25 flex size-4.5 items-center justify-center rounded-full border-2 border-card bg-success">
                    <CheckIcon className="size-2.5 text-success-foreground" strokeWidth={3.2} />
                  </span>
                )}
              </span>

              {/* name + state */}
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold text-foreground">
                  {t(`docNames.${d.nameKey}`)}
                </div>
                {uploaded ? (
                  <a
                    href={d.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={d.fileName}
                    className="mt-1.5 inline-flex max-w-full items-center gap-1.75 rounded-md bg-muted px-2.5 py-1 text-[12.5px] text-foreground/70 transition-colors hover:bg-muted/70 hover:text-foreground"
                  >
                    <FileIcon
                      className="size-3.25 shrink-0 text-muted-foreground"
                      strokeWidth={1.7}
                    />
                    <span className="truncate">{d.fileName}</span>
                  </a>
                ) : (
                  <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                    {t("documents.requested", { time: d.time })}
                  </div>
                )}
              </div>

              {/* actions */}
              {uploaded ? (
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={d.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.75 rounded-lg border bg-card px-3.5 text-[13px] font-semibold text-foreground/80 transition-colors hover:bg-muted"
                  >
                    <EyeIcon className="size-4" strokeWidth={1.8} />
                    {t("documents.view")}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeFile(d.id)}
                    aria-label={t("documents.remove")}
                    title={t("documents.remove")}
                    className="inline-flex h-9 items-center gap-1.75 rounded-lg border border-destructive/40 bg-card px-3.5 text-[13px] font-semibold text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2Icon className="size-4" strokeWidth={1.8} />
                    {t("documents.remove")}
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => openFilePicker(d.id)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-4.5 text-[13.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  <UploadIcon className="size-3.75" strokeWidth={1.8} />
                  {t("documents.upload")}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** A single benefit row inside an intro choice card. */
function IntroPerk({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2.25 text-[13px] font-medium text-foreground/70">
      <span
        className={cn(
          "flex size-4.25 shrink-0 items-center justify-center rounded-full",
          highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <CheckIcon className="size-2.5" strokeWidth={3} />
      </span>
      {label}
    </div>
  );
}

/**
 * Empty-state intake shown when the borrower has no loan yet (ported from the
 * design's `noApplication` block): a two-card choice between an AI-guided
 * intake (recommended) and the classic full form. "Start with AI" reveals the
 * inline conversational intake; "Open the form" jumps to the full application.
 */
function StartApplicationIntro({
  onStartAi,
  onOpenForm,
}: {
  onStartAi: () => void;
  onOpenForm: () => void;
}) {
  const { t } = useTranslation("myLoans");
  const aiPerks = t("intro.ai.perks", { returnObjects: true }) as string[];
  const manualPerks = t("intro.manual.perks", { returnObjects: true }) as string[];

  return (
    <div className="mt-6">
      <div className="mx-auto max-w-130 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("intro.title")}</h2>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
          {t("intro.description")}
        </p>
      </div>

      <div className="mt-7 grid gap-4.5 sm:grid-cols-2">
        {/* AI — recommended */}
        <div className="relative flex flex-col rounded-[18px] border bg-card p-6 shadow-[0_16px_40px_-26px_rgba(243,111,32,0.55)]">
          <div className="flex justify-end">
            <span className="inline-flex h-6 items-center rounded-full bg-primary px-2.75 text-[10.5px] font-bold tracking-wide text-primary-foreground uppercase">
              {t("intro.ai.recommended")}
            </span>
          </div>
          <div className="mt-4 text-[19px] font-bold text-foreground">{t("intro.ai.title")}</div>
          <p className="mt-1.75 text-[13.5px] leading-relaxed text-muted-foreground">
            {t("intro.ai.description")}
          </p>
          <div className="my-4 flex flex-col gap-2.25">
            {aiPerks.map((p) => (
              <IntroPerk key={p} label={p} highlight />
            ))}
          </div>
          <Button
            type="button"
            onClick={onStartAi}
            className="mt-auto inline-flex h-12.5 items-center justify-center gap-2.25 rounded-xl text-[14.5px] font-bold"
          >
            <SparklesIcon className="size-4.25" strokeWidth={1.9} />
            {t("intro.ai.cta")}
            <ArrowRightIcon className="size-4.25" strokeWidth={2.1} />
          </Button>
        </div>

        {/* Manual */}
        <div className="flex flex-col rounded-[18px] border bg-card p-6">
          <div className="text-[19px] font-bold text-foreground">{t("intro.manual.title")}</div>
          <p className="mt-1.75 text-[13.5px] leading-relaxed text-muted-foreground">
            {t("intro.manual.description")}
          </p>
          <div className="my-4 flex flex-col gap-2.25">
            {manualPerks.map((p) => (
              <IntroPerk key={p} label={p} />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onOpenForm}
            className="mt-auto inline-flex h-12.5 items-center justify-center gap-2.25 rounded-xl border bg-card text-[14.5px] font-semibold text-foreground hover:bg-muted/60"
          >
            {t("intro.manual.cta")}
            <ArrowRightIcon className="size-4.25" strokeWidth={2.1} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MyLoansPage() {
  // useSearchParams() requires a Suspense boundary during prerender.
  return (
    <React.Suspense fallback={null}>
      <MyLoansContent />
    </React.Suspense>
  );
}
