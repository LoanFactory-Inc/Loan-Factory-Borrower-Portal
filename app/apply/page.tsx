"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  LockIcon,
  PaperclipIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";

import { cn } from "@/lib/helpers";
import { ApplicationHeader } from "@/components/layouts/app-header";

/**
 * Short Application — ported from the Claude Design project
 * (Portal/Short Application.dc.html). A full-screen, AI-chat loan intake reached
 * from "Start with AI" on the my-loans empty state: the borrower answers a short
 * scripted intake in plain English and the assistant assembles a loan file,
 * then hands off to the real `/application` flow. Self-contained mock — the "AI"
 * replies are scripted, document attachments are simulated. English-only,
 * matching the design.
 */

type Msg = { role: "ai" | "user"; text: string; file?: boolean };
type Field = "purpose" | "value" | "amount" | "location" | "credit" | "income";

const APPLICATION_HREF = "/application";

const STEPS: {
  field: Field;
  placeholder: string;
  dollar?: boolean;
  q: (v: string) => string | null;
}[] = [
  { field: "purpose", placeholder: "e.g. I want to buy my first home", q: (v) => `Got it, a ${v.toLowerCase()} loan. Roughly, what’s the value of the property?` },
  { field: "value", placeholder: "e.g. $500,000", dollar: true, q: () => "And how much are you looking to borrow?" },
  { field: "amount", placeholder: "e.g. $400,000", dollar: true, q: () => "Where is the property located? A city or ZIP is fine." },
  { field: "location", placeholder: "City or ZIP code", q: () => "Thanks. About where does your credit score land?" },
  { field: "credit", placeholder: 'e.g. 740 or "excellent"', q: () => "Last one, what’s your approximate annual income?" },
  { field: "income", placeholder: "e.g. $120,000", dollar: true, q: () => null },
];

const ORDER: Field[] = ["purpose", "value", "amount", "location", "credit", "income"];
const LABELS: Record<Field, string> = {
  purpose: "Purpose",
  value: "Home value",
  amount: "Loan amount",
  location: "Location",
  credit: "Credit",
  income: "Income",
};

const DOC_CHIPS = ["W-2.pdf", "Pay stub.pdf", "Bank statement.pdf", "Tax return.pdf"];

const GREETING =
  "Hi! To start, tell me in your own words what you’re looking to do — buying a home, refinancing, or something else?";

function parsePurpose(v: string): string {
  const t = v.toLowerCase();
  if (/(refi|refinanc)/.test(t)) return "Refinance";
  if (/(cash[\s-]?out|equity|heloc)/.test(t)) return "Cash-out refinance";
  if (/(invest|rental|second home|vacation)/.test(t)) return "Investment property";
  if (/(buy|buying|purchase|first home|new home|house)/.test(t)) return "Purchase";
  return v;
}
function dollar(v: string): string {
  const n = parseInt(v.replace(/\D/g, ""), 10);
  return n ? "$" + n.toLocaleString("en-US") : v;
}

export default function ApplyPage() {
  const [step, setStep] = React.useState(0);
  const [messages, setMessages] = React.useState<Msg[]>([{ role: "ai", text: GREETING }]);
  const [summary, setSummary] = React.useState<Partial<Record<Field, string>>>({});
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const threadRef = React.useRef<HTMLDivElement>(null);
  const timers = React.useRef<number[]>([]);

  // Keep the thread pinned to the latest message.
  React.useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, done]);
  React.useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  const answer = (value: string) => {
    if (typing || done) return;
    const s = STEPS[step];
    if (!s) return;
    const disp = s.field === "purpose" ? parsePurpose(value) : s.dollar ? dollar(value) : value;
    const nextSummary = { ...summary, [s.field]: disp };
    const nextIdx = step + 1;
    setSummary(nextSummary);
    setMessages((m) => [...m, { role: "user", text: disp }]);
    setDraft("");
    setTyping(true);
    timers.current.push(
      window.setTimeout(() => {
        setTyping(false);
        setStep(nextIdx);
        if (nextIdx < STEPS.length) {
          setMessages((m) => [...m, { role: "ai", text: s.q(disp) ?? "" }]);
        } else {
          const wrap = `Perfect, that’s everything I need. Here’s your file: a ${(nextSummary.purpose || "").toLowerCase()} loan of ${nextSummary.amount || ""} on a ${nextSummary.value || ""} home in ${nextSummary.location || ""}. I’ve started your application — let’s finish the details.`;
          setDone(true);
          setMessages((m) => [...m, { role: "ai", text: wrap }]);
        }
      }, 650),
    );
  };

  const attach = (fileName: string) => {
    if (typing || done) return;
    setMessages((m) => [...m, { role: "user", file: true, text: fileName }]);
    setTyping(true);
    timers.current.push(
      window.setTimeout(() => {
        setTyping(false);
        setMessages((m) => [
          ...m,
          {
            role: "ai",
            text: `Got it, I saved your ${fileName.replace(".pdf", "")}. This lets me pre-fill more of your details automatically.`,
          },
        ]);
      }, 700),
    );
  };

  const send = () => {
    const d = draft.trim();
    if (d) answer(d);
  };

  const cur = STEPS[step];
  const filled = ORDER.filter((k) => summary[k]).length;
  const progressPct = Math.round((filled / ORDER.length) * 100);

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-page">
      <ApplicationHeader />

      {/* chat frame */}
      <div className="flex min-h-0 flex-1 flex-col bg-card">
        {/* progress */}
        <div className="h-0.75 shrink-0 bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* thread */}
        <div
          ref={threadRef}
          className="min-h-0 flex-1 overflow-y-auto bg-page px-4 py-7.5 sm:px-6"
        >
          <div className="mx-auto flex w-full max-w-190 flex-col gap-3.5">
            {/* intro */}
            <div className="mx-auto mt-1.5 mb-6 max-w-135 text-center">
              <h2 className="text-[22px] font-bold tracking-tight text-foreground">
                Let’s build your application
              </h2>
              <p className="mx-auto mt-2 max-w-110 text-[14.5px] leading-relaxed text-muted-foreground">
                Answer a few quick questions in plain English and I’ll turn them into your loan file
                — no forms, no jargon.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <TrustChip>
                  <ClockIcon className="size-3.25 text-primary" strokeWidth={2} />
                  About 3 minutes
                </TrustChip>
                <TrustChip>
                  <CheckIcon className="size-3.25 text-success" strokeWidth={2.4} />
                  No credit impact
                </TrustChip>
                <TrustChip>
                  <LockIcon className="size-3.25 text-muted-foreground" strokeWidth={1.9} />
                  Encrypted
                </TrustChip>
              </div>
            </div>

            {messages.map((m, i) =>
              m.role === "ai" ? (
                <div key={i} className="flex max-w-[82%] items-end gap-2.25">
                  <AiAvatar />
                  <div className="rounded-[18px] rounded-bl-[5px] border bg-card px-4.25 py-3.25 text-[14.5px] leading-relaxed text-foreground shadow-[0_6px_18px_-12px_rgba(16,24,40,0.18)]">
                    {m.text}
                  </div>
                </div>
              ) : m.file ? (
                <div key={i} className="flex justify-end">
                  <span className="ml-auto inline-flex max-w-[82%] items-center gap-2 rounded-[14px] rounded-br-lg border border-primary/40 bg-card px-3.75 py-2.75 text-[13.5px] font-semibold text-accent-foreground">
                    <PaperclipIcon className="size-3.5" strokeWidth={1.8} />
                    {m.text}
                  </span>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="ml-auto max-w-[82%] rounded-[18px] rounded-br-[5px] bg-linear-to-br from-primary to-accent-foreground px-4.25 py-3.25 text-[14.5px] leading-relaxed font-medium text-primary-foreground shadow-[0_10px_24px_-12px_rgba(243,111,32,0.6)]">
                    {m.text}
                  </div>
                </div>
              ),
            )}

            {typing && (
              <div className="flex items-end gap-2.25">
                <AiAvatar />
                <div className="flex gap-1 rounded-2xl rounded-bl-lg bg-muted px-4 py-3.75">
                  {[0, 0.2, 0.4].map((d) => (
                    <span
                      key={d}
                      className="size-1.75 animate-bounce rounded-full bg-muted-foreground/50"
                      style={{ animationDelay: `${d}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {done && (
              <div className="rounded-2xl border bg-muted/50 px-5.5 py-5">
                <div className="flex items-center gap-2.25">
                  <span className="flex size-6.5 items-center justify-center rounded-full bg-success/15 text-success">
                    <CheckIcon className="size-3.75" strokeWidth={2.6} />
                  </span>
                  <span className="text-[15px] font-bold text-foreground">Your file is ready</span>
                </div>
                <div className="mt-3.5 flex flex-col">
                  {ORDER.map((k) => {
                    const val = summary[k];
                    return (
                      <div
                        key={k}
                        className="flex items-center justify-between gap-3 border-b border-border/70 py-2 last:border-b-0"
                      >
                        <span className="text-[13px] text-muted-foreground">{LABELS[k]}</span>
                        <span
                          className={cn(
                            val
                              ? "text-[13.5px] font-bold text-foreground"
                              : "text-[13px] text-muted-foreground/60",
                          )}
                        >
                          {val ?? "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* composer */}
        <div className="shrink-0 border-t bg-card px-4 pt-3.5 pb-4 sm:px-6">
          <div className="mx-auto w-full max-w-190">
            {done ? (
              <Link
                href={APPLICATION_HREF}
                className="flex h-12.5 items-center justify-center gap-2.25 rounded-[14px] bg-primary text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Continue full application
                <ArrowRightIcon className="size-4.25" strokeWidth={2.1} />
              </Link>
            ) : (
              <>
                {/* attach a document */}
                <div className="mb-2.75 flex flex-wrap items-center gap-2">
                  <span className="text-[11.5px] font-semibold text-muted-foreground/70">
                    Attach a document
                  </span>
                  {DOC_CHIPS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => attach(d)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border bg-card px-3 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
                    >
                      <PaperclipIcon className="size-3.25" strokeWidth={1.8} />
                      {d.replace(".pdf", "")}
                    </button>
                  ))}
                </div>

                {/* input row */}
                <div className="flex h-13 items-center gap-2 rounded-[14px] border bg-muted/50 px-2">
                  <button
                    type="button"
                    onClick={() => attach("Document.pdf")}
                    title="Upload a PDF"
                    aria-label="Upload a PDF"
                    className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-accent-foreground"
                  >
                    <PaperclipIcon className="size-4.5" strokeWidth={1.8} />
                  </button>
                  <input
                    type="text"
                    placeholder={cur?.placeholder ?? "Type your answer"}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        send();
                      }
                    }}
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70"
                  />
                  <button
                    type="button"
                    onClick={send}
                    aria-label="Send"
                    className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <SendIcon className="size-4.5" strokeWidth={1.9} />
                  </button>
                </div>

                {/* footer note */}
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11.5px] font-semibold text-muted-foreground/70">
                  <LockIcon className="size-3.25" strokeWidth={1.9} />
                  Encrypted · a soft rate check never affects your credit
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border bg-card px-3 text-xs font-semibold text-muted-foreground">
      {children}
    </span>
  );
}

function AiAvatar() {
  return (
    <span className="flex size-7.5 shrink-0 items-center justify-center self-end rounded-full bg-linear-to-br from-primary to-accent-foreground text-primary-foreground">
      <SparklesIcon className="size-4" strokeWidth={1.9} />
    </span>
  );
}
