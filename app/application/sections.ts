/**
 * Application structure, identified by stable numeric enums rather than loose
 * strings, and shared by the flow and the My-loans card so both agree on
 * identity, ordering, completion rules and where to resume.
 *
 * Two granularities:
 *  - {@link Section} — the 4 progress-rail groups (used for the % complete).
 *  - {@link FlowStep} — the individual screens (used for the "next step" CTA),
 *    so a borrower who's done "The property" is pointed at "Loan terms" next
 *    rather than a whole section.
 */

/* ── Section level (progress rail) ─────────────────────────────── */

export enum Section {
  YourLoan = 0,
  AboutYou = 1,
  WhatYouOwn = 2,
  WhatYouOwe = 3,
}

export const SECTION_COUNT = 4;

/** The three data-bearing sections drive completion. */
export interface SectionSignals {
  yourLoan: boolean;
  aboutYou: boolean;
  whatYouOwn: boolean;
}

/**
 * Per-section done flags, indexed by {@link Section}. "What you owe"
 * (liabilities) is optional — a borrower may have none — so it counts as done
 * once every other section is complete (an empty list then reads as "no debts").
 */
export function sectionsDone(s: SectionSignals): boolean[] {
  const owe = s.yourLoan && s.aboutYou && s.whatYouOwn;
  return [s.yourLoan, s.aboutYou, s.whatYouOwn, owe];
}

/* ── Step level (individual screens / "next step") ─────────────── */

export enum FlowStep {
  Property = 0,
  LoanTerms = 1,
  Personal = 2,
  Employment = 3,
  Demographic = 4,
  Assets = 5,
  Liabilities = 6,
}

/**
 * i18n key (application namespace) for each step's label — the same "sub"
 * labels the flow's rail shows, so the card and flow read identically.
 */
export const STEP_LABEL_KEY: Record<FlowStep, string> = {
  [FlowStep.Property]: "subs.subjectProperty",
  [FlowStep.LoanTerms]: "subs.loanDetails",
  [FlowStep.Personal]: "subs.personalDetails",
  [FlowStep.Employment]: "subs.employment",
  [FlowStep.Demographic]: "subs.demographicInfo",
  [FlowStep.Assets]: "subs.realEstateAssets",
  [FlowStep.Liabilities]: "subs.liabilities",
};

/**
 * Friendly lower-case step names (myLoans namespace) that read naturally after
 * "Add your …" in the My-loans next-step nudge — e.g. "Add your employment &
 * income". Distinct from {@link STEP_LABEL_KEY}, which mirrors the flow's rail.
 */
export const STEP_TITLE_KEY: Record<FlowStep, string> = {
  [FlowStep.Property]: "stepTitles.property",
  [FlowStep.LoanTerms]: "stepTitles.loanTerms",
  [FlowStep.Personal]: "stepTitles.personal",
  [FlowStep.Employment]: "stepTitles.employment",
  [FlowStep.Demographic]: "stepTitles.demographic",
  [FlowStep.Assets]: "stepTitles.assets",
  [FlowStep.Liabilities]: "stepTitles.liabilities",
};

// The FlowStep value IS the flow page index (no-co-borrower baseline). Used to
// deep-link a resume via `?step=`; edit mode unlocks every step so a
// co-borrower's extra pages only nudge the later steps.
export const stepPage = (step: FlowStep): number => step;

/** Which data each screen needs to count as filled (in flow order). */
export interface StepSignals {
  property: boolean;
  loanTerms: boolean;
  personal: boolean;
  employment: boolean;
  demographic: boolean;
  assets: boolean;
}

/**
 * First screen the borrower still needs to complete, in flow order. Liabilities
 * is optional, so it's the fallback once everything else is done.
 */
export function firstIncompleteStep(s: StepSignals): FlowStep {
  if (!s.property) return FlowStep.Property;
  if (!s.loanTerms) return FlowStep.LoanTerms;
  if (!s.personal) return FlowStep.Personal;
  if (!s.employment) return FlowStep.Employment;
  if (!s.demographic) return FlowStep.Demographic;
  if (!s.assets) return FlowStep.Assets;
  return FlowStep.Liabilities;
}

/**
 * Every required section is filled. Liabilities is optional (a borrower may have
 * no debts), so it doesn't gate completion — an application is "complete" once
 * property, loan terms, personal, employment, demographics and assets are in.
 */
export function isApplicationComplete(s: StepSignals): boolean {
  return (
    s.property && s.loanTerms && s.personal && s.employment && s.demographic && s.assets
  );
}

/**
 * Derive {@link StepSignals} from the backend reads that back the My-loans card
 * and the Documents-nav gate, so both agree on "complete":
 *  - `detail`   — the 1003 core (property, loan terms, borrowers). snake_case on
 *                 the wire, but tolerate camelCase too.
 *  - `sections` — the non-1003 sub-resources (employments, assets, demographics),
 *                 which live on a SEPARATE endpoint and are absent from `detail`.
 */
export function stepSignalsFrom(
  detail: Record<string, unknown> | null | undefined,
  sections:
    | { employments?: unknown[]; assets?: unknown[]; demographics?: unknown }
    | null
    | undefined,
): StepSignals {
  const d = (detail ?? {}) as Record<string, unknown>;
  const str = (snake: string, camel: string): string | undefined => {
    const v = d[snake] ?? d[camel];
    return typeof v === "string" && v.trim() ? v : undefined;
  };
  const num = (snake: string, camel: string): number | undefined => {
    const v = d[snake] ?? d[camel];
    return typeof v === "number" ? v : undefined;
  };
  const hasRealAddress = !!(
    str("full_address", "fullAddress") ||
    (str("city", "city") && str("state", "state") && str("zip", "zip"))
  );
  const borrowers = Array.isArray(d.borrowers)
    ? (d.borrowers as Array<{ email?: string | null }>)
    : [];
  return {
    property: hasRealAddress,
    loanTerms: num("loan_amount", "loanAmount") != null,
    personal: borrowers.some((b) => !!b?.email),
    employment: (sections?.employments?.length ?? 0) > 0,
    demographic: sections?.demographics != null,
    assets: (sections?.assets?.length ?? 0) > 0,
  };
}
