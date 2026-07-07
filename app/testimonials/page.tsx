"use client";

import * as React from "react";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  DownloadIcon,
  MessageSquareIcon,
  PhoneIcon,
  StarIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/helpers";
import { PortalShell } from "../components/portal-page";

const PHONE = "(660) 333-3333";
const TOTAL_REVIEWS = 19_893;
const AVG_RATING = 5.0;

/** Share of reviews per star bucket, highest first. */
const DISTRIBUTION = [
  { stars: 5, pct: 97 },
  { stars: 4, pct: 2 },
  { stars: 3, pct: 1 },
  { stars: 2, pct: 0 },
  { stars: 1, pct: 0 },
];

interface Review {
  id: number;
  name: string;
  time: string;
  rating: number;
  text: string;
}

/** Featured reviews — the freshest ones, shown up top. */
const FEATURED: Review[] = [
  {
    id: 1,
    name: "Bas N",
    time: "about 6 hours ago",
    rating: 5,
    text: "The Loan Factory team (Mahi and Max) were really helpful in putting together all of the documentation and approvals for my loan. They were quick to respond and always available whenever I had a question. The whole process felt smooth and stress-free, and I closed on time without any surprises.",
  },
  {
    id: 2,
    name: "Huyen N",
    time: "about 7 hours ago",
    rating: 5,
    text: "Bao (Loan Officer) and Sophie (Loan Processor) helped me through my loan application and closing process. Although the process wasn't perfect or smooth from start to finish due to a few third-party delays, they kept me informed every step of the way and worked hard to get everything back on track. I truly appreciate their dedication.",
  },
  {
    id: 3,
    name: "McKenna Ismond",
    time: "about 11 hours ago",
    rating: 5,
    text: "We worked with Dennis from Loan Factory and had a great experience from start to finish. Dennis talked us through our options, answered all of our questions, and secured a no cost refinance that saved us hundreds every month. Highly recommend him and the whole team.",
  },
];

/** The rest of the wall — revealed progressively via "Show more". */
const MORE: Review[] = [
  {
    id: 4,
    name: "Bob Ishere",
    time: "about 14 hours ago",
    rating: 5,
    text: "Loan Factory was very helpful and got us through the process painlessly.",
  },
  {
    id: 5,
    name: "Kim L Vu",
    time: "about 15 hours ago",
    rating: 5,
    text: "Working with Thanh and Nami was awesome. They jumped on the deal and got it wrapped up fast—like, really fast. Super dedicated and always there even on the weekend, to answer my (many) questions. I couldn't have asked for a better team.",
  },
  {
    id: 6,
    name: "Lonnie Witt",
    time: "1 day ago",
    rating: 5,
    text: "Loan Factory did an amazing job during the loan process. David Rosenthal & Wade Ho were both great to work with, keeping me informed during the process. Would use them again in the future. Highly recommend.",
  },
  {
    id: 7,
    name: "Gladys Cristancho",
    time: "1 day ago",
    rating: 5,
    text: "Working with Ryan and Terri was an amazing experience from start to finish. The entire transaction went incredibly smoothly, communication was always clear and timely, and they were genuinely invested in getting me the best possible outcome.",
  },
  {
    id: 8,
    name: "Toan Luong",
    time: "1 day ago",
    rating: 5,
    text: "Excellent service and unbeatable rates. Thank you Loan Factory!",
  },
  {
    id: 9,
    name: "Kyle Vo",
    time: "1 day ago",
    rating: 5,
    text: "Great people at all times.",
  },
  {
    id: 10,
    name: "Priya Shah",
    time: "2 days ago",
    rating: 5,
    text: "First-time homebuyer here and I was nervous about the whole thing. My loan officer walked me through every document and made sure I understood each step. Closed early and under budget on fees.",
  },
  {
    id: 11,
    name: "Marcus Reed",
    time: "2 days ago",
    rating: 5,
    text: "Shopped around with three lenders and Loan Factory beat them all on rate and closing costs. No games, no last-minute changes. Exactly what they quoted.",
  },
];

/** Rotating tint palette so avatars aren't a wall of grey. */
const AVATAR_TINTS = [
  "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Multi-colour Google "G" so review provenance reads at a glance. */
function GoogleGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3 0-5.6-2-6.5-4.8H1.5v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.5 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.5a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.5 6.7l4 3.1C6.4 6.8 9 4.8 12 4.8Z"
      />
    </svg>
  );
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  const { t } = useTranslation("testimonials");
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={t("stars.aria", { count: rating })}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          className={cn(
            "size-4",
            i <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted",
            className,
          )}
          strokeWidth={0}
        />
      ))}
    </span>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const { t } = useTranslation("testimonials");
  const [expanded, setExpanded] = React.useState(false);
  const isLong = review.text.length > 150;
  const tint = AVATAR_TINTS[index % AVATAR_TINTS.length];

  return (
    <div className="flex h-full flex-col rounded-[18px] border bg-card p-5.5 transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            tint,
          )}
        >
          {initialsOf(review.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold text-foreground">{review.name}</span>
            <BadgeCheckIcon className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
          </div>
          <div className="text-xs text-muted-foreground">{review.time}</div>
        </div>
        <GoogleGlyph className="size-4.5 shrink-0" aria-hidden />
      </div>

      <div className="mt-3.5">
        <Stars rating={review.rating} />
      </div>

      <p
        className={cn(
          "mt-2.5 text-[13.5px] leading-relaxed text-foreground/80",
          !expanded && isLong && "line-clamp-4",
        )}
      >
        {review.text}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 self-start text-[13px] font-semibold text-primary hover:underline"
        >
          {expanded ? t("review.less") : t("review.more")}
        </button>
      )}
    </div>
  );
}

function DistributionBar({ stars, pct }: { stars: number; pct: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex w-9 items-center gap-1 text-xs font-semibold text-muted-foreground">
        {stars}
        <StarIcon className="size-3 fill-amber-400 text-amber-400" strokeWidth={0} />
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

export default function TestimonialsPage() {
  const { t } = useTranslation("testimonials");
  const [visible, setVisible] = React.useState(4);

  const shownMore = MORE.slice(0, visible);
  const hasMore = visible < MORE.length;

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-295 px-4 sm:px-7 py-9">
        {/* ── Hero ── */}
        <section className="overflow-hidden rounded-[26px] border bg-gradient-to-b from-accent/60 to-card px-6 py-12 text-center sm:px-10 sm:py-14">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card/70 px-3.5 py-1.5 text-xs font-bold tracking-wide text-primary uppercase">
            <StarIcon className="size-3.5 fill-primary text-primary" strokeWidth={0} />
            {t("badge")}
          </span>

          <p className="mt-5 text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
            {t("hero.eyebrow")}
          </p>
          <h1 className="mx-auto mt-2 max-w-2xl text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-3.5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {t("hero.subtitle")}
          </p>

          {/* rating showcase */}
          <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 rounded-2xl border bg-card/80 px-6 py-6 backdrop-blur-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-foreground">{AVG_RATING.toFixed(1)}</span>
              <div className="flex flex-col items-start">
                <Stars rating={5} className="size-5" />
                <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <GoogleGlyph className="size-3.5" aria-hidden />
                  {t("hero.ratingLabel")}
                </span>
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {t("hero.reviewsBadge", { count: TOTAL_REVIEWS.toLocaleString() })}
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="gap-2 rounded-md px-6 text-[15px] shadow-lg shadow-primary/25"
            >
              {t("hero.quoteCta")}
              <ArrowRightIcon className="size-4" strokeWidth={2} />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 rounded-md px-6 text-[15px]">
              <DownloadIcon className="size-4" strokeWidth={2} />
              {t("hero.appCta")}
            </Button>
          </div>
        </section>

        {/* ── What our customers say ── */}
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {t("customers.title")}
              </h2>
              <p className="mt-1.5 text-[15px] text-muted-foreground">{t("customers.subtitle")}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            {FEATURED.map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} />
            ))}
          </div>
        </section>

        {/* ── More proof from Google reviews ── */}
        <section className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] lg:items-start">
          {/* summary panel */}
          <div className="rounded-[22px] border bg-card p-7 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <GoogleGlyph className="size-5" aria-hidden />
              {t("proof.title")}
            </div>
            <div className="mt-5 flex items-end gap-3">
              <span className="text-5xl font-bold text-foreground">{AVG_RATING.toFixed(1)}</span>
              <div className="pb-1.5">
                <Stars rating={5} className="size-5" />
                <div className="mt-1 text-xs text-muted-foreground">{t("proof.outOf")}</div>
              </div>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("proof.reviewsCount", { count: TOTAL_REVIEWS.toLocaleString() })}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {DISTRIBUTION.map((d) => (
                <DistributionBar key={d.stars} stars={d.stars} pct={d.pct} />
              ))}
            </div>
          </div>

          {/* review wall */}
          <div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {shownMore.map((review, i) => (
                <ReviewCard key={review.id} review={review} index={i + 3} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setVisible((v) => v + 4)}
                  className="rounded-md px-6 text-[15px]"
                >
                  {t("loadMore")}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ── Submit feedback ── */}
        <section className="mt-12 overflow-hidden rounded-[22px] border bg-gradient-to-br from-card to-accent/40 px-6 py-9 sm:px-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <MessageSquareIcon className="size-6" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {t("feedback.title")}
                </h2>
                <p className="mt-1.5 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
                  {t("feedback.description")}
                </p>
                <p className="mt-3 inline-flex items-center gap-2 text-[13.5px] text-foreground/70">
                  <PhoneIcon className="size-4 text-primary" strokeWidth={1.9} />
                  {t("feedback.phone", { phone: PHONE })}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="shrink-0 gap-2 rounded-md px-6 text-[15px] shadow-lg shadow-primary/25"
            >
              {t("feedback.cta")}
              <ArrowRightIcon className="size-4" strokeWidth={2} />
            </Button>
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
