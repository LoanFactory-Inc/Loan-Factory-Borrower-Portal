"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  HomeIcon,
  InfoIcon,
  Loader2Icon,
  PencilIcon,
  StarIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PortalShell } from "@/components/layouts/portal-page";
import {
  computeOffers,
  INITIAL_FORM,
  loadQuote,
  money,
  num,
  ZIP_CITY,
  type Offer,
  type SortKey,
  type StoredQuote,
  type TermFilter,
} from "../quote-model";

const LENDER_COUNT = 232;

export default function QuoteResultPage() {
  const { t } = useTranslation("quote");
  const [loading, setLoading] = React.useState(true);
  const [term, setTerm] = React.useState<TermFilter>("all");
  const [sort, setSort] = React.useState<SortKey>("rate");

  // Start from the default scenario (SSR-safe), then load the persisted quote
  // once mounted. Reading localStorage inside the timer callback keeps it off
  // the render/effect-body path and out of server rendering.
  const [quote, setQuote] = React.useState<StoredQuote>({ form: INITIAL_FORM, docMode: "full" });
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      setQuote(loadQuote());
      setLoading(false);
    }, 1500);
    return () => window.clearTimeout(id);
  }, []);

  const offers = React.useMemo(
    () => computeOffers(quote.form, quote.docMode, { term, sort }),
    [quote, term, sort],
  );

  const summary = React.useMemo(() => {
    const { form, docMode } = quote;
    const loan = num(form.loanAmount);
    const value = num(form.propertyValue);
    const city = ZIP_CITY[form.zip.trim()] ?? form.zip;
    const downPct = value > 0 ? `${Math.max(0, Math.round((1 - loan / value) * 100))}%` : "—";
    return {
      line: `${money(loan)} · ${form.loanType}`,
      chips: [
        form.purpose,
        city,
        t("result.summary.down", { pct: downPct }),
        form.occupancy,
        t("result.summary.fico", { score: form.fico.split(" (")[0] }),
        docMode === "full" ? t("result.summary.fullDoc") : t("result.summary.noDoc"),
      ],
    };
  }, [quote, t]);

  const hero = offers[0];
  const rest = offers.slice(1);
  const heroBadge =
    sort === "payment"
      ? t("result.badge.payment")
      : sort === "apr"
        ? t("result.badge.apr")
        : t("result.badge.rate");

  const TERM_DEFS: { value: TermFilter; label: string }[] = [
    { value: "all", label: t("result.term.all") },
    { value: "30", label: t("result.term.y30") },
    { value: "20", label: t("result.term.y20") },
    { value: "15", label: t("result.term.y15") },
  ];
  const SORT_DEFS: { value: SortKey; label: string }[] = [
    { value: "rate", label: t("result.sort.rate") },
    { value: "payment", label: t("result.sort.payment") },
    { value: "apr", label: t("result.sort.apr") },
  ];

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-295 px-4 sm:px-7 py-8.5">
        {/* ── Search summary bar ── */}
        <div className="flex flex-wrap items-center gap-5 rounded-[18px] bg-[#231f1a] px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-[11px] bg-primary/18 text-[#ffb27a]">
              <HomeIcon className="size-5" strokeWidth={1.8} />
            </span>
            <div>
              <div className="text-[11px] font-bold tracking-wide text-white/50 uppercase">
                {t("result.yourSearch")}
              </div>
              <div className="text-base font-bold text-white">{summary.line || "—"}</div>
            </div>
          </div>
          <div className="ml-1.5 flex flex-wrap gap-2">
            {summary.chips.map((c, i) => (
              <span
                key={i}
                className="rounded-lg bg-white/8 px-2.75 py-1.5 text-[12.5px] font-semibold text-white/80"
              >
                {c}
              </span>
            ))}
          </div>
          <Button
            asChild
            variant="outline"
            className="ml-auto h-10 gap-1.75 rounded-full border-white/18 bg-white/10 px-4.5 text-[13.5px] font-semibold text-white hover:bg-white/16 hover:text-white"
          >
            <Link href="/quote">
              <PencilIcon className="size-3.75" strokeWidth={1.8} />
              {t("result.editSearch")}
            </Link>
          </Button>
        </div>

        {loading ? (
          <LoadingState t={t} />
        ) : (
          <div className="mt-6.5">
            {/* Controls */}
            <div className="mb-4.5 flex flex-wrap items-center gap-4.5">
              <div className="text-[15px] font-bold text-foreground">
                {t("result.offerCount", { count: offers.length })}{" "}
                <span className="font-medium text-muted-foreground">
                  {t("result.fromLenders", { count: LENDER_COUNT })}
                </span>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-4.5">
                <Segmented
                  label={t("result.termLabel")}
                  value={term}
                  options={TERM_DEFS}
                  onChange={setTerm}
                />
                <Segmented
                  label={t("result.sortLabel")}
                  value={sort}
                  options={SORT_DEFS}
                  onChange={setSort}
                />
              </div>
            </div>

            {offers.length === 0 ? (
              <div className="rounded-2xl border bg-card px-6 py-16 text-center text-[15px] text-muted-foreground">
                {t("result.empty")}
              </div>
            ) : (
              <>
                {hero && <HeroOffer offer={hero} badge={heroBadge} t={t} />}

                <div className="mt-3.5 flex flex-col gap-3">
                  {rest.map((offer, i) => (
                    <OfferRow key={`${offer.lender}-${i}`} offer={offer} t={t} />
                  ))}
                </div>
              </>
            )}

            {/* Disclosure */}
            <div className="mt-5 flex items-start gap-2.25 rounded-[14px] border bg-card px-4.5 py-4">
              <InfoIcon
                className="mt-px size-4 shrink-0 text-muted-foreground"
                strokeWidth={1.7}
              />
              <div className="text-xs leading-relaxed text-muted-foreground">
                {t("result.disclaimer")}{" "}
                <Link href="/policies" className="font-semibold text-accent-foreground">
                  {t("result.fullDisclosure")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}

type TFn = ReturnType<typeof useTranslation>["t"];

// ── Loading ────────────────────────────────────────────────────
function LoadingState({ t }: { t: TFn }) {
  return (
    <div className="mt-7">
      <div className="flex flex-col items-center justify-center pt-6 pb-7.5">
        <Loader2Icon className="size-14 animate-spin text-primary" strokeWidth={2} />
        <div className="mt-4 text-[17px] font-bold text-foreground">
          {t("result.searching", { count: LENDER_COUNT })}
        </div>
        <div className="mt-1.25 text-[13.5px] text-muted-foreground">{t("result.comparing")}</div>
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-21 rounded-2xl" />
        <Skeleton className="h-21 rounded-2xl" />
        <Skeleton className="h-21 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Offer cards ────────────────────────────────────────────────
function LenderMark({ offer, featured }: { offer: Offer; featured?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] text-[13px] font-extrabold",
        featured
          ? "size-11 rounded-[11px] border border-primary/25 bg-accent/50 text-accent-foreground"
          : "size-10 bg-muted text-muted-foreground",
      )}
    >
      {offer.mark}
    </span>
  );
}

function pointsLabel(offer: Offer, t: TFn) {
  return offer.points === 0
    ? t("result.zeroPoints")
    : t("result.points", { points: offer.points });
}

function HeroOffer({ offer, badge, t }: { offer: Offer; badge: string; t: TFn }) {
  return (
    <div className="relative rounded-[20px] border-2 border-primary bg-card px-7 py-6.5 shadow-[0_16px_40px_-18px_rgba(243,111,32,0.5)]">
      <span className="absolute -top-2.75 left-6.5 inline-flex items-center gap-1.5 rounded-md bg-primary px-2.75 py-1 text-[11px] font-bold tracking-wide text-primary-foreground uppercase">
        <StarIcon className="size-3.25 fill-current" strokeWidth={0} />
        {badge}
      </span>
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex min-w-45 flex-1 items-center gap-2.75">
          <LenderMark offer={offer} featured />
          <div className="min-w-0">
            <div className="text-base font-extrabold text-foreground">{offer.lender}</div>
            <div className="text-[13px] text-muted-foreground">
              {t(`result.products.${offer.productKey}.label`)} · {pointsLabel(offer, t)}
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-[34px] leading-none font-extrabold tracking-tight text-foreground">
            {offer.rate}
          </div>
          <div className="mt-1 text-[11.5px] text-muted-foreground">{t("result.interestRate")}</div>
        </div>
        <div className="border-x px-5.5 text-center">
          <div className="text-xl leading-none font-bold text-foreground/80">{offer.apr}</div>
          <div className="mt-1 text-[11.5px] text-muted-foreground">{t("result.apr")}</div>
        </div>
        <div className="text-center">
          <div className="text-xl leading-none font-bold text-foreground/80">{offer.payment}</div>
          <div className="mt-1 text-[11.5px] text-muted-foreground">{t("result.estMonthly")}</div>
        </div>
        <Button
          asChild
          size="lg"
          className="h-13 gap-2 rounded-full px-6.5 text-[15px] font-bold shadow-lg shadow-primary/40"
        >
          <Link href={`/rate-alerts?create=1&target=${offer.rateNum.toFixed(3)}`}>
            {t("result.lockRate")}
            <ArrowRightIcon className="size-4.25" strokeWidth={2} />
          </Link>
        </Button>
      </div>
      <div className="mt-4.5 flex flex-wrap gap-5 border-t pt-4 text-[12.5px]">
        <span className="text-foreground/70">💳 {feesLabel(offer, t)}</span>
        <span className="text-foreground/70">📅 {t(`result.products.${offer.productKey}.term`)}</span>
        <span className="font-semibold text-success">✓ {t("result.bestPriceEligible")}</span>
      </div>
    </div>
  );
}

function feesLabel(offer: Offer, t: TFn) {
  return offer.fees === 0
    ? t("result.noLenderFees")
    : t("result.lenderFees", { amount: money(offer.fees) });
}

function OfferRow({ offer, t }: { offer: Offer; t: TFn }) {
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl border bg-card px-5.5 py-4.5">
      <div className="flex min-w-47.5 flex-1 items-center gap-2.75">
        <LenderMark offer={offer} />
        <div className="min-w-0">
          <div className="text-[14.5px] font-bold text-foreground">{offer.lender}</div>
          <div className="text-[12.5px] text-muted-foreground">
            {t(`result.products.${offer.productKey}.label`)} · {pointsLabel(offer, t)}
          </div>
        </div>
      </div>
      <div className="min-w-20 text-center">
        <div className="text-[23px] leading-none font-extrabold tracking-tight text-foreground">
          {offer.rate}
        </div>
        <div className="mt-0.75 text-[11px] text-muted-foreground">{t("result.rate")}</div>
      </div>
      <div className="min-w-17.5 border-l pl-4.5 text-center">
        <div className="text-[15px] leading-none font-bold text-foreground/80">{offer.apr}</div>
        <div className="mt-0.75 text-[11px] text-muted-foreground">{t("result.apr")}</div>
      </div>
      <div className="min-w-24 border-l pl-4.5 text-center">
        <div className="text-[15px] leading-none font-bold text-foreground/80">{offer.payment}</div>
        <div className="mt-0.75 text-[11px] text-muted-foreground">{t("result.perMonth")}</div>
      </div>
      <div className="min-w-21 border-l pl-4.5 text-center">
        <div className="text-[13.5px] leading-tight font-semibold text-foreground/80">
          {offer.fees === 0 ? t("result.none") : money(offer.fees)}
        </div>
        <div className="mt-0.75 text-[11px] text-muted-foreground">{t("result.fees")}</div>
      </div>
      <Button
        asChild
        variant="outline"
        className="h-11 rounded-full border-[1.5px] px-5 text-[13.5px] font-bold hover:border-primary"
      >
        <Link href="/my-loans">{t("result.select")}</Link>
      </Button>
    </div>
  );
}

// ── Segmented control ──────────────────────────────────────────
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12.5px] font-semibold text-muted-foreground">{label}</span>
      <div className="flex gap-1.25 rounded-full bg-secondary p-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                "h-8 cursor-pointer rounded-full px-3.5 text-[12.5px] transition-colors",
                active
                  ? "bg-card font-bold text-foreground shadow-sm"
                  : "font-semibold text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
