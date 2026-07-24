"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, CheckIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/helpers";

/**
 * Loan Intake Modal — ported from the Claude Design project
 * (Portal/Loan Intake Modal.dc.html). A two-step intake wizard shown over the
 * "My loans" empty state when the borrower opens the classic application: pick a
 * purpose, then a goal/stage. A left rail tracks progress across the two stages.
 * Both steps auto-advance on selection; choosing a goal hands straight off to
 * the real /application flow. English-only, matching the design and the sibling
 * ShortApplication.
 */

type Purpose = "buy" | "refi";
type Sub = "lower" | "cash" | "preapproval" | "offer";

const AUTO_ADVANCE_MS = 240;
const APPLICATION_HREF = "/application";

/**
 * Rendered only while the wizard is open (mounted fresh each time by the parent),
 * so state starts clean without a reset effect.
 */
export function LoanIntakeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [purpose, setPurpose] = React.useState<Purpose | null>(null);
  const [sub, setSub] = React.useState<Sub | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lock body scroll + close on Escape while mounted.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const advance = () => setStep((s) => Math.min(s + 1, 1));
  const scheduleAdvance = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(advance, AUTO_ADVANCE_MS);
  };

  // Picking a goal is the last choice — hand straight off to the full
  // application (there's no separate "how to fill it out" step anymore).
  const startManual = (p: Purpose) => {
    onClose();
    router.push(`${APPLICATION_HREF}?purpose=${p}`);
  };

  const pickPurpose = (p: Purpose) => {
    setPurpose(p);
    setSub(null);
    scheduleAdvance();
  };
  const pickSub = (v: Sub) => {
    setSub(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => startManual(purpose ?? "buy"), 300);
  };
  const back = () => {
    if (timer.current) clearTimeout(timer.current);
    setSub(null);
    setStep(0);
  };

  const purposeLabel = purpose === "buy" ? "Buy a home" : purpose === "refi" ? "Refinance" : "";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Set up your loan"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[92vh] w-full max-w-180 overflow-y-auto rounded-[22px] bg-card px-8 pt-9 pb-8 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.5)] sm:px-10">
        <button
          type="button"
          onClick={onClose}
          title="Skip for now"
          aria-label="Close"
          className="absolute top-5 right-5.5 z-2 flex size-8.5 items-center justify-center rounded-[10px] bg-muted text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
        >
          <XIcon className="size-4.25" strokeWidth={1.9} />
        </button>

        {/* Title */}
        <div className="mb-7 text-center">
          <h2 className="text-[25px] font-bold tracking-tight text-foreground">
            Let&rsquo;s set up your loan
          </h2>
          <p className="mt-2.25 text-[14.5px] text-muted-foreground">
            Three quick choices and we&rsquo;ll tailor everything to you.
          </p>
        </div>

        {/* ─── Pipeline ─── */}
        {/* Stage 1 · purpose */}
        <Stage
          index={1}
          node={step > 0 ? "done" : "active"}
          connector={step > 0 ? "on" : "off"}
        >
          {step > 0 ? (
            <SummaryRow label="Purpose" value={purposeLabel} onChange={() => setStep(0)} />
          ) : (
            <StepBody step={1} title="What brings you here today?">
              <Tile
                title="Buy a home"
                desc="Finance a new purchase, whether shopping or under contract."
                selected={purpose === "buy"}
                onSelect={() => pickPurpose("buy")}
              />
              <Tile
                title="Refinance"
                desc="Replace your current mortgage or take cash out of equity."
                selected={purpose === "refi"}
                onSelect={() => pickPurpose("refi")}
              />
            </StepBody>
          )}
        </Stage>

        {/* Stage 2 · goal / stage */}
        <Stage index={2} node={step === 1 ? "active" : "pending"} connector="none">
          {step < 1 ? (
            <PendingRow label="Tell us your goal" />
          ) : purpose === "refi" ? (
            <StepBody step={2} title="What’s your refinance goal?">
              <Tile
                title="Lower rate or payment"
                desc="Reduce your monthly cost or lock a lower rate."
                selected={sub === "lower"}
                onSelect={() => pickSub("lower")}
              />
              <Tile
                title="Cash out equity"
                desc="Tap into your home’s value and take cash at closing."
                selected={sub === "cash"}
                onSelect={() => pickSub("cash")}
              />
            </StepBody>
          ) : (
            <StepBody step={2} title="Where are you in the process?">
              <Tile
                title="I need a pre-approval"
                desc="Still shopping and want to know your budget."
                selected={sub === "preapproval"}
                onSelect={() => pickSub("preapproval")}
              />
              <Tile
                title="My offer was accepted"
                desc="You’re under contract and ready to move forward."
                selected={sub === "offer"}
                onSelect={() => pickSub("offer")}
              />
            </StepBody>
          )}
        </Stage>

        {/* Footer */}
        <div className="mt-7.5 flex items-center justify-center gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              className="inline-flex h-12 items-center gap-2 rounded-[14px] border-[1.5px] bg-card px-5.5 text-[14.5px] font-semibold text-foreground/80 transition-colors hover:bg-muted"
            >
              <ArrowLeftIcon className="size-4" strokeWidth={1.9} />
              Back
            </button>
          ) : (
            <span className="text-[12.5px] text-muted-foreground">Select an option to continue</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function Stage({
  index,
  node,
  connector,
  children,
}: {
  index: number;
  node: "done" | "active" | "pending";
  connector: "on" | "off" | "none";
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex size-7.5 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
            node === "done" && "bg-primary text-primary-foreground",
            node === "active" && "bg-primary text-primary-foreground ring-4 ring-accent",
            node === "pending" && "bg-muted text-muted-foreground",
          )}
        >
          {node === "done" ? <CheckIcon className="size-3.75" strokeWidth={3} /> : index}
        </span>
        {connector !== "none" && (
          <span
            className={cn(
              "my-1.75 min-h-4 w-0.5 flex-1 self-stretch",
              connector === "on" ? "bg-primary/40" : "bg-border",
            )}
          />
        )}
      </div>
      <div className="min-w-0 flex-1 pb-5.5">{children}</div>
    </div>
  );
}

function StepBody({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mt-0.5 mb-1 text-[11px] font-bold tracking-wide text-primary uppercase">
        Step {step} of 2
      </div>
      <h3 className="mb-4 text-[19px] font-bold text-foreground">{title}</h3>
      <div className="grid grid-cols-1 items-stretch gap-3.5 sm:grid-cols-2">{children}</div>
    </>
  );
}

function SummaryRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </div>
        <div className="mt-0.5 text-base font-bold text-foreground">{value}</div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="px-2 py-1.5 text-[13px] font-semibold text-accent-foreground hover:underline"
      >
        Change
      </button>
    </div>
  );
}

function PendingRow({ label }: { label: string }) {
  return <div className="py-1 text-base font-semibold text-muted-foreground/60">{label}</div>;
}

function Radio({ selected }: { selected: boolean }) {
  return selected ? (
    <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full border-2 border-primary">
      <span className="size-2.75 rounded-full bg-primary" />
    </span>
  ) : (
    <span className="size-5.5 shrink-0 rounded-full border-2 border-input" />
  );
}

function Tile({
  title,
  desc,
  badge,
  selected,
  onSelect,
}: {
  title: string;
  desc: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative flex w-full flex-col items-start rounded-[18px] border-[1.5px] bg-card px-6 pt-5 pb-6 text-left transition-all",
        selected
          ? "border-primary"
          : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_16px_36px_-22px_rgba(35,31,26,0.28)]",
      )}
    >
      <div className="flex w-full justify-end">
        <Radio selected={selected} />
      </div>
      <div className="mt-2 flex items-center gap-2.25">
        <span className="text-lg font-bold text-foreground">{title}</span>
        {badge && (
          <span className="inline-flex h-5 items-center rounded-full bg-accent px-2.25 text-[10px] font-bold tracking-wide text-accent-foreground uppercase">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-1.25 text-[13px] leading-normal text-muted-foreground">{desc}</div>
    </button>
  );
}
