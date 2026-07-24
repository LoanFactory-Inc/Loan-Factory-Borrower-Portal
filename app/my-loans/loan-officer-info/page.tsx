"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRightIcon, MailIcon, MessageSquareIcon, PhoneIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PortalShell } from "@/components/layouts/portal-page";

interface Review {
  name: string;
  initials: string;
  when: string;
  quote: string;
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

export default function LoanOfficerInfoPage() {
  const router = useRouter();
  const { t } = useTranslation("myLoans");

  const name = t("loanOfficer.name");
  const initials = t("loanOfficer.initials");
  const phone = t("loanOfficerProfile.phoneValue");
  const email = t("loanOfficerProfile.emailValue");
  const goToMessages = () => router.push("/my-loans/messages");

  const reviews = t("loanOfficerProfile.reviews", { returnObjects: true }) as Review[];

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-295 px-4 py-8 sm:px-7">
        {/* ── Contact card ── */}
        <div className="overflow-hidden rounded-[20px] border bg-card">
          <div className="h-24 bg-linear-to-br from-foreground to-foreground/75" />
          <div className="px-7 pb-7 text-center">
            <div className="relative -mt-13 inline-block">
              <div className="flex size-25 items-center justify-center rounded-[26px] border-4 border-card bg-primary text-[34px] font-bold text-primary-foreground shadow-[0_12px_30px_-12px_rgba(243,111,32,0.6)]">
                {initials}
              </div>
              <span className="absolute right-0.5 bottom-0.5 size-5 rounded-full border-[3px] border-card bg-success" />
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{name}</h1>
            <div className="mt-1.25 text-[14px] text-muted-foreground">
              {t("loanOfficerProfile.roleLine")}
            </div>
            <span className="mt-2.5 inline-flex items-center gap-1.25 rounded-md bg-success/12 px-2.5 py-1 text-[11px] font-bold tracking-wide text-success uppercase">
              <span className="size-1.5 rounded-full bg-success" />
              {t("loanOfficerProfile.onlineBadge")}
            </span>

            {/* contact actions */}
            <div className="mt-5.5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={goToMessages}
                className="flex h-12.5 items-center justify-center gap-2.25 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground shadow-[0_12px_26px_-16px_rgba(243,111,32,0.8)] transition-colors hover:bg-primary/85"
              >
                <MessageSquareIcon className="size-4.5" strokeWidth={1.8} />
                {t("loanOfficerProfile.message")}
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border-[1.5px] bg-card text-[14px] font-bold text-foreground transition-colors hover:bg-muted/50"
                >
                  <PhoneIcon className="size-4.25 text-foreground/70" strokeWidth={1.8} />
                  {t("loanOfficerProfile.call")}
                </a>
                <a
                  href={`mailto:${email}`}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border-[1.5px] bg-card text-[14px] font-bold text-foreground transition-colors hover:bg-muted/50"
                >
                  <MailIcon className="size-4.25 text-foreground/70" strokeWidth={1.8} />
                  {t("loanOfficerProfile.email")}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Google reviews ── */}
        <div className="mt-4.5 rounded-[20px] border bg-card p-6.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.25">
              <GoogleGlyph className="size-7.5 shrink-0" aria-hidden />
              <div>
                <div className="text-[14px] font-bold text-foreground">
                  {t("loanOfficerProfile.google.title")}
                </div>
                <div className="mt-0.5 flex items-center gap-1.75">
                  <span className="text-[15px] font-bold text-foreground">
                    {t("loanOfficerProfile.google.rating")}
                  </span>
                  <span className="text-[14px] tracking-[1px] text-amber-500">★★★★★</span>
                  <span className="text-[13px] text-muted-foreground">
                    {t("loanOfficerProfile.google.count")}
                  </span>
                </div>
              </div>
            </div>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="inline-flex h-10 items-center gap-1.75 rounded-[10px] border bg-card px-4 text-[13.5px] font-bold text-foreground transition-colors hover:bg-muted/50"
            >
              {t("loanOfficerProfile.google.view")}
              <ArrowUpRightIcon className="size-3.75" strokeWidth={1.9} />
            </a>
          </div>

          <div className="my-5 h-px bg-border" />

          <div className="flex flex-col gap-4">
            {reviews.map((r) => (
              <div key={r.name}>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-full bg-muted text-[12px] font-bold text-muted-foreground">
                    {r.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-foreground">{r.name}</span>
                      <span className="text-[12px] text-muted-foreground">{r.when}</span>
                    </div>
                    <div className="mt-px text-[13px] tracking-[1.5px] text-amber-500">★★★★★</div>
                  </div>
                </div>
                <p className="mt-2.5 text-[14px] leading-relaxed text-foreground/80">{r.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
