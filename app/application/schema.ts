/**
 * Per-screen zod schemas for the loan application flow.
 *
 * Validation runs one screen at a time on "Continue" (see the form's
 * `validateAndContinue`). Error `message`s are i18n keys under the
 * `application` namespace's `validation.*` block — translate them at display
 * time with `t(message)`.
 *
 * Only screens that carry required fields get a non-empty schema; the rest
 * (employment, demographic, assets, liabilities) are optional by design and
 * validate to an empty object. The documents screen is checked separately
 * because it gates on an upload map rather than form fields.
 */

import { z } from "zod";

import type { LoanPurpose, ScreenId } from "./types";

export const V = {
  required: "validation.required",
  email: "validation.email",
  zip: "validation.zip",
  phone: "validation.phone",
  amount: "validation.amount",
  date: "validation.date",
  coBorrower: "validation.coBorrower",
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;
const DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{4}$/;

/** Required, whitespace-trimmed text. */
const text = z.string().trim().min(1, V.required);

/** Required money string — must resolve to a positive number. */
const money = text.refine((v) => Number(v.replace(/[^0-9.]/g, "")) > 0, V.amount);

const subjectProperty = z.object({
  addressLine1: text,
  zip: text.regex(ZIP_RE, V.zip),
  city: text,
  state: text,
  propertyType: text,
});

/** Shared across both purposes; each purpose adds its own money fields below. */
const loanDetailsBase = {
  loanAmount: money,
  loanType: text,
  occupancy: text,
  loanTerm: text,
};

/** Purchase gates on the sale price. */
const loanDetailsPurchase = z.object({
  ...loanDetailsBase,
  purchasePrice: money,
});

/**
 * Refinance gates on the current home value (mortgage balance/rate stay
 * optional, mirroring the mobile app) and there's no purchase price.
 */
const loanDetailsRefi = z.object({
  ...loanDetailsBase,
  homeValue: money,
});

const personalBase = {
  firstName: text,
  lastName: text,
  email: text.regex(EMAIL_RE, V.email),
  cellPhone: text.refine((v) => v.replace(/\D/g, "").length >= 10, V.phone),
  dob: text.regex(DATE_RE, V.date),
};

/** Primary borrower must also answer the co-borrower question. */
const personalPrimary = z.object({
  ...personalBase,
  hasCoBorrower: z.boolean({ error: V.coBorrower }),
});

const personalCo = z.object(personalBase);

/**
 * Demographic questions are HMDA-collected: the borrower must make a choice,
 * but "I do not wish to provide" is always a valid selection.
 */
const demographic = z.object({
  ethnicity: text,
  race: text,
  gender: text,
});

const empty = z.object({});

/** The zod schema that guards a given screen before the user may advance. */
export function stepSchema(
  screen: ScreenId,
  isPrimary: boolean,
  purpose: LoanPurpose,
): z.ZodObject {
  switch (screen) {
    case "subjectProperty":
      return subjectProperty;
    case "loanDetails":
      return purpose === "refi" ? loanDetailsRefi : loanDetailsPurchase;
    case "personal":
      return isPrimary ? personalPrimary : personalCo;
    case "demographic":
      return demographic;
    default:
      return empty;
  }
}

/** The subset of form values a screen's schema validates against. */
export type StepValues = Record<string, unknown>;
