/**
 * Shared domain model for the Get Quote form and the Quote Result page.
 *
 * The form persists its inputs to `localStorage` under STORAGE_KEY and routes
 * to /quote/result, which reloads them and prices the lender offers. Pricing is
 * a deterministic mock built from today's mock base rates plus scenario
 * adjustments — it mirrors the design's client-side model.
 */

export type DocMode = "full" | "noinc";

export interface QuoteForm {
  loanAmount: string;
  propertyValue: string;
  purpose: string;
  zip: string;
  occupancy: string;
  loanType: string;
  fico: string;
}

export interface StoredQuote {
  form: QuoteForm;
  docMode: DocMode;
}

export const STORAGE_KEY = "lf_quote";

export const PURPOSE_OPTS = ["Purchase", "Refinance", "Cash-out refinance"];
export const OCCUPANCY_OPTS = ["Owner Occupied", "Second Home", "Investment"];
export const LOAN_TYPE_OPTS = ["Conventional", "FHA", "VA", "USDA", "Jumbo"];
export const FICO_OPTS = [
  "780+ (Excellent)",
  "760 - 779 (Very Good)",
  "740 - 759 (Good)",
  "720 - 739 (Good)",
  "700 - 719 (Fair)",
  "680 - 699 (Fair)",
  "660 - 679 (Below)",
];

export const ZIP_CITY: Record<string, string> = {
  "95122": "San Jose, CA",
  "95126": "San Jose, CA",
  "90001": "Los Angeles, CA",
  "78704": "Austin, TX",
  "80211": "Denver, CO",
  "10001": "New York, NY",
  "33101": "Miami, FL",
  "75201": "Dallas, TX",
};

const FICO_ADJ: Record<string, number> = {
  "760 - 779 (Very Good)": -0.125,
  "780+ (Excellent)": -0.25,
  "740 - 759 (Good)": 0,
  "720 - 739 (Good)": 0.125,
  "700 - 719 (Fair)": 0.25,
  "680 - 699 (Fair)": 0.5,
  "660 - 679 (Below)": 0.875,
};

const TYPE_BASE: Record<string, number> = {
  Conventional: 6.375,
  FHA: 6.125,
  VA: 6.0,
  USDA: 6.25,
  Jumbo: 6.625,
};

export const INITIAL_FORM: QuoteForm = {
  loanAmount: "400,000",
  propertyValue: "500,000",
  purpose: "Purchase",
  zip: "95122",
  occupancy: "Owner Occupied",
  loanType: "Conventional",
  fico: "760 - 779 (Very Good)",
};

// ── Helpers ────────────────────────────────────────────────────
export const num = (v: string) => {
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return Number.isNaN(n) ? 0 : n;
};

export const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Amortized monthly payment over `months` (defaults to a 30-year term). */
export function monthlyPayment(principal: number, annualRate: number, months = 360) {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

/** Two-letter initials for a lender's avatar mark. */
export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ── Offer pricing ──────────────────────────────────────────────
type ProductKey = "30f" | "20f" | "15f" | "arm56" | "arm71";

interface Product {
  labelKey: string;
  term: number;
  months: number;
  delta: number;
  termLabelKey: string;
}

const PRODUCTS: Record<ProductKey, Product> = {
  "30f": { labelKey: "fixed30", term: 30, months: 360, delta: 0, termLabelKey: "fixed30" },
  "20f": { labelKey: "fixed20", term: 20, months: 240, delta: -0.25, termLabelKey: "fixed20" },
  "15f": { labelKey: "fixed15", term: 15, months: 180, delta: -0.625, termLabelKey: "fixed15" },
  arm56: { labelKey: "arm56", term: 30, months: 360, delta: -0.5, termLabelKey: "arm56" },
  arm71: { labelKey: "arm71", term: 30, months: 360, delta: -0.375, termLabelKey: "arm71" },
};

interface RawOffer {
  lender: string;
  prod: ProductKey;
  add: number;
  points: number;
  fees: number;
}

const OFFERS: RawOffer[] = [
  { lender: "Summit Home Lending", prod: "30f", add: 0.0, points: 0.0, fees: 995 },
  { lender: "Meridian Mortgage", prod: "30f", add: 0.05, points: 0.5, fees: 1150 },
  { lender: "Evergreen Lending", prod: "30f", add: 0.15, points: 0.0, fees: 1495 },
  { lender: "Northgate Mortgage", prod: "20f", add: 0.02, points: 0.5, fees: 1050 },
  { lender: "Coastal Capital", prod: "15f", add: 0.0, points: 1.0, fees: 0 },
  { lender: "Beacon Financial", prod: "15f", add: 0.06, points: 0.25, fees: 1295 },
  { lender: "Summit Home Lending", prod: "15f", add: 0.09, points: 0.0, fees: 995 },
  { lender: "Cardinal Home Loans", prod: "arm56", add: 0.0, points: 0.75, fees: 800 },
  { lender: "Harbor Bank", prod: "arm71", add: 0.03, points: 0.0, fees: 1095 },
];

export type SortKey = "rate" | "payment" | "apr";
export type TermFilter = "all" | "30" | "20" | "15";

export interface Offer {
  lender: string;
  mark: string;
  productKey: string;
  term: number;
  isArm: boolean;
  points: number;
  fees: number;
  rateNum: number;
  aprNum: number;
  payNum: number;
  rate: string;
  apr: string;
  payment: string;
}

/** Base scenario rate before per-offer product/lender adjustments. */
function baseRate(form: QuoteForm, docMode: DocMode) {
  const noInc = docMode !== "full";
  return (
    (TYPE_BASE[form.loanType] ?? 6.375) +
    (FICO_ADJ[form.fico] ?? 0) +
    (form.purpose !== "Purchase" ? 0.125 : 0) +
    (form.occupancy === "Investment" ? 0.5 : form.occupancy === "Second Home" ? 0.25 : 0) +
    (noInc ? 0.75 : 0)
  );
}

/** Price, filter (by term) and sort the lender offers for a scenario. */
export function computeOffers(
  form: QuoteForm,
  docMode: DocMode,
  opts: { term: TermFilter; sort: SortKey },
): Offer[] {
  const loan = num(form.loanAmount);
  const base = baseRate(form, docMode);

  let offers: Offer[] = OFFERS.map((o) => {
    const p = PRODUCTS[o.prod];
    const rate = base + p.delta + o.add;
    const apr = rate + 0.08 + o.fees / 22000;
    const pay = monthlyPayment(loan, rate, p.months);
    return {
      lender: o.lender,
      mark: initials(o.lender),
      productKey: p.labelKey,
      term: p.term,
      isArm: o.prod.startsWith("arm"),
      points: o.points,
      fees: o.fees,
      rateNum: rate,
      aprNum: apr,
      payNum: pay,
      rate: `${rate.toFixed(3)}%`,
      apr: `${apr.toFixed(3)}%`,
      payment: money(pay),
    };
  });

  if (opts.term !== "all") offers = offers.filter((o) => String(o.term) === opts.term);

  const key = opts.sort === "payment" ? "payNum" : opts.sort === "apr" ? "aprNum" : "rateNum";
  return offers.slice().sort((a, b) => a[key] - b[key]);
}

/** Persist the quote scenario for the result page to reload. */
export function saveQuote(quote: StoredQuote) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quote));
  } catch {
    // Ignore storage failures (private mode, quota) — the result page falls
    // back to the default scenario.
  }
}

/** Reload a persisted quote scenario, falling back to sensible defaults. */
export function loadQuote(): StoredQuote {
  const fallback: StoredQuote = { form: INITIAL_FORM, docMode: "full" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as StoredQuote;
    if (parsed && parsed.form) return { form: parsed.form, docMode: parsed.docMode ?? "full" };
  } catch {
    // Ignore parse/storage errors and use the fallback.
  }
  return fallback;
}
