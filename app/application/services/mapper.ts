/**
 * Maps the local loan-application form state ({@link ApplicationSnapshot}) onto
 * the tera-be flow and drives the full request sequence (steps 0 → 14).
 *
 * Flow implemented (see the borrower-portal flow spec):
 *   0  check-email                 → decide prospect branch A/B
 *   1  POST /transactions/prospects → create transaction + account + participant
 *   2  GET borrowers / properties   → resolve main borrower_id + subject property
 *   3  PUT application              → loan info (1003)
 *   4  PUT/POST properties          → subject property
 *   5  PUT borrowers/{id}           → main borrower personal info (+ co-borrower)
 *   6  POST employments             → per borrower
 *   7  POST other-incomes           → per borrower
 *   8  POST assets                  → transaction-scoped
 *   9  POST liabilities             → transaction-scoped
 *  10  PUT declarations             → (no form data today — skipped)
 *  11  PUT demographics             → main borrower
 *  12  POST real-estate             → main borrower
 *  14  GET application-status       → completeness gate / progress
 *
 * Step 15 (submit-application) is intentionally absent — tera-be has no such
 * endpoint yet (see {@link ./index}).
 */
import type { ApplicationSnapshot } from "@/store/slices/application-slice";
import type {
  Asset,
  Employment,
  Liability,
  LoanPurpose,
  OtherIncome,
  PersonalInfo,
  RealEstate,
} from "@/app/application/types";

import * as api from "./index";
import { BACKEND_LOAN_PURPOSE } from "./types";
import type {
  Application1003UpdateRequest,
  BackendLoanPurpose,
  BorrowerDemographicsRequest,
  BorrowerEmploymentRequest,
  BorrowerLiabilityRequest,
  BorrowerOtherIncomeRequest,
  BorrowerResponse,
  BorrowerUpdateRequest,
  PropertyRequest,
  ProspectRequest,
  RealEstateOwnedRequest,
  StatusNode,
  TransactionAssetRequest,
} from "./types";

/* ───────────────── Value converters ──────────────────────────── */

/** "300,000" | "$300,000.50" → 300000.5; blank/invalid → undefined. */
function money(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n !== 0 ? n : undefined;
}

/** "(512) 555-0142" → "5125550142". */
function phone(value: string | null | undefined): string | undefined {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits || undefined;
}

/** "MM/DD/YYYY" → ISO "YYYY-MM-DD"; blank/invalid → undefined. */
function isoDate(value: string | null | undefined): string | undefined {
  const m = (value ?? "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return undefined;
  const [, mm, dd, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

/** "MM / YYYY" → ISO first-of-month "YYYY-MM-01"; blank/invalid → undefined. */
function isoMonth(value: string | null | undefined): string | undefined {
  const m = (value ?? "").match(/(\d{1,2})\s*\/\s*(\d{4})/);
  if (!m) return undefined;
  const [, mm, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, "0")}-01`;
}

function int(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const n = parseInt(String(value).replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Loan term label → amortization years, e.g. "30-year fixed" → 30. */
function amortYears(term: string | null | undefined): number | undefined {
  const m = (term ?? "").match(/(\d+)\s*-?\s*year/i);
  return m ? Number(m[1]) : undefined;
}

/** "30-year fixed" → "FIXED"; "5/1 ARM" → "ADJUSTABLE". */
function amortType(term: string | null | undefined): string | undefined {
  if (!term) return undefined;
  return /arm|adjust/i.test(term) ? "ADJUSTABLE" : "FIXED";
}

/** Wizard purpose ("buy" | "refi") → the 1003's canonical value. */
export const toBackendPurpose = (purpose: LoanPurpose): BackendLoanPurpose =>
  BACKEND_LOAN_PURPOSE[purpose];

/* ───────────────── Form → request builders ───────────────────── */

/** STEP 3 — loan info (1003). */
export function toApplicationRequest(snap: ApplicationSnapshot): Application1003UpdateRequest {
  const d = snap.data;
  const isRefi = snap.purpose === "refi";
  return {
    purpose: toBackendPurpose(snap.purpose),
    loan_type: d.loanType || undefined,
    loan_amount: money(d.loanAmount),
    property_value: money(isRefi ? d.homeValue : d.purchasePrice),
    purchase_price: isRefi ? undefined : money(d.purchasePrice),
    property_type: d.propertyType || undefined,
    occupancy: d.occupancy || undefined,
    full_address: d.addressLine1
      ? `${d.addressLine1}${d.unit ? ` ${d.unit}` : ""}, ${d.city} ${d.state} ${d.zip}`.trim()
      : undefined,
    city: d.city || undefined,
    state: d.state || undefined,
    zip: d.zip || undefined,
    amortization_years: amortYears(d.loanTerm),
    amortization_type: amortType(d.loanTerm),
    refinance_type: isRefi ? "Refinance" : undefined,
  };
}

/** STEP 4 — subject property. */
export function toPropertyRequest(
  snap: ApplicationSnapshot,
  borrowerIds: string[],
): PropertyRequest {
  const d = snap.data;
  return {
    borrower_ids: borrowerIds,
    address: {
      line1: d.addressLine1 || undefined,
      unit: d.unit || undefined,
      city: d.city || undefined,
      state: d.state || undefined,
      postal_code: d.zip || undefined,
      country: "US",
    },
    property_type: d.propertyType || undefined,
    property_value: money(snap.purpose === "refi" ? d.homeValue : d.purchasePrice),
    usage_type: d.occupancy || undefined,
    sort_order: 0,
  };
}

/** STEP 5 — full borrower personal info. */
export function toBorrowerUpdate(p: PersonalInfo): BorrowerUpdateRequest {
  return {
    first_name: p.firstName,
    last_name: p.lastName,
    email: p.email,
    cell_phone: phone(p.cellPhone),
    birth_date: isoDate(p.dob),
    marital_status: p.maritalStatus || undefined,
    citizenship: p.citizenship || undefined,
    dependents: int(p.dependents),
  };
}

/**
 * Wizard employment-status labels → tera-be employment-type codes. The labels
 * are display strings (up to 37 chars); the `employment_type` column is
 * varchar(30), so the raw label overflows — send the short code instead.
 */
const EMPLOYMENT_TYPE_CODE: Record<string, string> = {
  "Employed (Permanent, Temporary) - W-2": "EmployedByCompany",
  "Employed (Contract) - 1099": "Contractor",
  "Self-Employed - 1099": "SelfEmployed",
  "Employed (Military service) - W-2": "Military",
};

/**
 * Full country names → ISO-3166 alpha-2 codes. The `addresses.country` column
 * is varchar(10) and stores codes ("US"), so "United States" (13 chars) would
 * overflow. Defaults to "US" when blank.
 */
const COUNTRY_CODE: Record<string, string> = {
  "United States": "US",
  Canada: "CA",
  Mexico: "MX",
  Other: "OTHER",
};

/** STEP 6 — one employment row. */
export function toEmploymentRequest(e: Employment, sortOrder: number): BorrowerEmploymentRequest {
  return {
    employer_name: e.employer,
    position: e.position || undefined,
    employment_type: e.status ? (EMPLOYMENT_TYPE_CODE[e.status] ?? e.status) : undefined,
    is_active: e.current,
    income_amount: money(e.monthlyIncome),
    income_frequency: "MONTHLY",
    start_date: isoMonth(e.startDate),
    end_date: e.current ? undefined : isoMonth(e.endDate),
    is_special_employer_relationship: e.related,
    is_foreign_income: e.foreign,
    sort_order: sortOrder,
    business_address: e.companyAddress
      ? {
          line1: e.companyAddress,
          unit: e.aptUnit || undefined,
          postal_code: e.zip || undefined,
          country: e.country ? (COUNTRY_CODE[e.country] ?? e.country) : "US",
        }
      : undefined,
  };
}

/** STEP 7 — one supplemental income row. */
export function toOtherIncomeRequest(o: OtherIncome, sortOrder: number): BorrowerOtherIncomeRequest {
  return {
    income_type: o.source,
    amount: money(o.amount),
    frequency: "MONTHLY",
    sort_order: sortOrder,
  };
}

/** Wizard asset-type labels → tera-be's MISMO asset-type codes (validated enum). */
const ASSET_TYPE_CODE: Record<string, string> = {
  "Checking account": "CheckingAccount",
  "Savings account": "SavingsAccount",
  "Money market": "MoneyMarketFund",
  "Retirement (401k / IRA)": "RetirementFund",
  Brokerage: "MutualFund",
  "Gift funds": "GiftOfCash",
};

/** STEP 8 — one asset row. */
export function toAssetRequest(
  a: Asset,
  borrowerIds: string[],
  sortOrder: number,
): TransactionAssetRequest {
  return {
    borrower_ids: borrowerIds,
    asset_type: ASSET_TYPE_CODE[a.assetType] ?? a.assetType,
    financial_institution: a.institution || undefined,
    cash_market_value: money(a.balance),
    sort_order: sortOrder,
  };
}

/** Wizard liability-type labels → tera-be's MISMO liability-type codes (validated
 *  enum). Without this the raw label (e.g. "Credit card") is rejected and the row
 *  is dropped, so liabilities never persist. */
const LIABILITY_TYPE_CODE: Record<string, string> = {
  "Credit card": "Revolving",
  "Auto loan": "Installment",
  "Student loan": "Installment",
  "Personal loan": "Installment",
  "Installment loan": "Installment",
  Other: "Other",
};

/** STEP 9 — one liability row. */
export function toLiabilityRequest(
  l: Liability,
  borrowerIds: string[],
  sortOrder: number,
): BorrowerLiabilityRequest {
  return {
    borrower_ids: borrowerIds,
    liability_type: LIABILITY_TYPE_CODE[l.liabType] ?? l.liabType,
    creditor_name: l.creditor || undefined,
    unpaid_balance: money(l.balance),
    monthly_payment: money(l.payment),
    sort_order: sortOrder,
  };
}

/** STEP 11 — demographics (HMDA). */
export function toDemographicsRequest(p: PersonalInfo): BorrowerDemographicsRequest {
  return {
    application_taken_method: "Internet",
    ethnicity: p.ethnicity || undefined,
    ethnicity_consent: Boolean(p.ethnicity),
    race: p.race ? [p.race] : undefined,
    race_consent: Boolean(p.race),
    gender: p.gender ? [p.gender] : undefined,
    gender_consent: Boolean(p.gender),
  };
}

/** STEP 12/13 — one real-estate-owned row. */
export function toRealEstateRequest(r: RealEstate, sortOrder: number): RealEstateOwnedRequest {
  return {
    property_address: r.address ? { line1: r.address } : undefined,
    property_status: r.reStatus || undefined,
    market_value: money(r.value),
    mortgage_balance: money(r.mortgageBalance),
    sort_order: sortOrder,
  };
}

/* ───────────────── Orchestrator ──────────────────────────────── */

export interface SubmitResult {
  transactionId: string;
  applicationId: string;
  borrowerId: string;
  coBorrowerId?: string;
  /** 0–100 completeness from the application-status gate. */
  progress: number;
  status: StatusNode;
}

const hasName = (p: PersonalInfo) => Boolean(p.firstName && p.lastName);

/**
 * Runs the entire borrower-apply flow against tera-be and returns the created
 * transaction id + completeness. Calls are sequential so ordering is
 * deterministic; any HTTP error rejects (and is toasted by the interceptor).
 */
export async function submitApplicationToBackend(
  snap: ApplicationSnapshot,
  existingTransactionId?: string | null,
): Promise<SubmitResult> {
  const primary = snap.data; // PersonalInfo is embedded in ApplicationData
  const purpose = toBackendPurpose(snap.purpose);

  let transactionId: string;
  let applicationId: string;

  if (existingTransactionId) {
    // STEP 0/1 — the prospect (transaction + borrower account) was already
    // created upstream by the landing register step (?tx=), so reuse it and
    // skip check-email + create-prospect. applicationId is not read by callers.
    transactionId = existingTransactionId;
    applicationId = existingTransactionId;
  } else {
    // STEP 0 — does the borrower already have an account?
    const check = (await api.checkEmail(primary.email)).payload;

    // STEP 1 — create the prospect (branch A: existing account, B: new borrower).
    const prospectBody: ProspectRequest =
      check.exists && check.user_id
        ? { borrower_user_id: check.user_id, purpose }
        : {
            borrower_first_name: primary.firstName,
            borrower_last_name: primary.lastName,
            borrower_email: primary.email,
            borrower_cell_phone: phone(primary.cellPhone),
            purpose,
          };
    const prospect = (await api.createProspect(prospectBody)).payload;
    transactionId = prospect.transaction_id;
    applicationId = prospect.id;
  }

  // STEP 2 — resolve the main borrower id.
  const borrowers = (await api.listBorrowers(transactionId)).payload;
  const main: BorrowerResponse | undefined =
    borrowers.find((b) => b.is_main_borrower) ?? borrowers[0];
  if (!main) {
    throw new Error("No borrower was created for the transaction");
  }
  const borrowerId = main.id;

  // STEP 3 — loan info.
  await api.updateApplication(transactionId, toApplicationRequest(snap));

  // STEP 4 — subject property (update the auto-created one, else create).
  const properties = (await api.listProperties(transactionId)).payload;
  const propertyReq = toPropertyRequest(snap, [borrowerId]);
  if (properties[0]) {
    await api.updateProperty(transactionId, properties[0].id, propertyReq);
  } else {
    await api.createProperty(transactionId, propertyReq);
  }

  // STEP 5 — main borrower personal info.
  await api.updateBorrower(transactionId, borrowerId, toBorrowerUpdate(primary));

  // STEP 5b — co-borrower (optional).
  let coBorrowerId: string | undefined;
  if (snap.data.hasCoBorrower && hasName(snap.coData)) {
    const co = (
      await api.createBorrower(transactionId, {
        first_name: snap.coData.firstName,
        last_name: snap.coData.lastName,
        email: snap.coData.email,
        cell_phone: phone(snap.coData.cellPhone),
      })
    ).payload;
    coBorrowerId = co.id;
    await api.updateBorrower(transactionId, coBorrowerId, toBorrowerUpdate(snap.coData));
  }

  // STEP 6 — employments per borrower.
  await sequence(snap.employments.filter((e) => e.employer), (e, i) =>
    api.createEmployment(transactionId, borrowerId, toEmploymentRequest(e, i)),
  );
  if (coBorrowerId) {
    await sequence(snap.coEmployments.filter((e) => e.employer), (e, i) =>
      api.createEmployment(transactionId, coBorrowerId!, toEmploymentRequest(e, i)),
    );
  }

  // STEP 7 — other incomes per borrower.
  await sequence(snap.otherIncome.filter((o) => o.source), (o, i) =>
    api.createOtherIncome(transactionId, borrowerId, toOtherIncomeRequest(o, i)),
  );
  if (coBorrowerId) {
    await sequence(snap.coOtherIncome.filter((o) => o.source), (o, i) =>
      api.createOtherIncome(transactionId, coBorrowerId!, toOtherIncomeRequest(o, i)),
    );
  }

  // STEP 8 — assets (transaction-scoped, attributed to the main borrower).
  await sequence(snap.assets.filter((a) => a.assetType), (a, i) =>
    api.createAsset(transactionId, toAssetRequest(a, [borrowerId], i)),
  );

  // STEP 9 — liabilities (transaction-scoped).
  await sequence(snap.liabilities.filter((l) => l.liabType), (l, i) =>
    api.createLiability(transactionId, toLiabilityRequest(l, [borrowerId], i)),
  );

  // STEP 11 — demographics.
  await api.putDemographics(transactionId, borrowerId, toDemographicsRequest(primary));

  // STEP 12/13 — real estate owned.
  await sequence(snap.realEstate.filter((r) => r.address), (r, i) =>
    api.createRealEstate(transactionId, borrowerId, toRealEstateRequest(r, i)),
  );

  // STEP 14 — completeness gate.
  const status = (await api.getApplicationStatus(transactionId)).payload;

  return {
    transactionId,
    applicationId,
    borrowerId,
    coBorrowerId,
    progress: status.progress ?? 0,
    status,
  };
}

/** Await a list of side-effecting requests in order. */
async function sequence<T>(items: T[], run: (item: T, index: number) => Promise<unknown>) {
  for (let i = 0; i < items.length; i++) {
    await run(items[i], i);
  }
}
