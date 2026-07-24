/**
 * Borrower-facing loan-application API (tera-be `BorrowerLoanController`).
 *
 * Goes through the axios `apiClient` like every other authenticated call: the
 * request interceptor attaches the logged-in user's `Authorization: Bearer`
 * token, the api-gateway validates it and injects the caller identity, and
 * tera-be resolves the current borrower from that — so these are always scoped
 * to whoever is logged in (no caller-supplied user id). Returns the unwrapped
 * `payload`; failures are toasted + thrown by the interceptor.
 *
 *   POST /api/v1/application                → create after purpose is chosen
 *   PUT  /api/v1/application/{transactionId} → per-step cumulative 1003 save
 *   GET  /api/v1/applications                → the borrower's loans (resume)
 */
import { apiClient } from "@/repository/axios";

import type {
  Application1003Response,
  Application1003UpdateRequest,
  BorrowerDemographicsRequest,
  BorrowerEmploymentRequest,
  BorrowerLiabilityRequest,
  BorrowerOtherIncomeRequest,
  BorrowerResponse,
  BorrowerUpdateRequest,
  CreateApplicationRequest,
  LoanSummaryResponse,
  ProspectResponse,
  SpringPage,
  TeraResponse,
  TransactionAssetRequest,
} from "./types";

/** Gateway route prefix for tera-be (LOS). */
const TERA = "tera-svc/api/v1";

/** Create the borrower's application; the returned `transaction_id` keys saves. */
export const createApplication = (body: CreateApplicationRequest): Promise<ProspectResponse> =>
  apiClient
    .post<TeraResponse<ProspectResponse>, CreateApplicationRequest>(`${TERA}/application`, body)
    .then((r) => r.payload);

/**
 * Deep snake_case → camelCase key conversion (recurses objects + arrays). The
 * borrower application DTOs (1003, borrower, employment, asset, …) (de)serialize
 * camelCase — unlike the snake_case list/create endpoints — so a snake_case body
 * would silently drop every multi-word field (incl. nested ones like
 * `business_address.postal_code`). The FE mappers emit snake_case, so convert here.
 */
const toCamel = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(toCamel);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())] = toCamel(v);
    }
    return out;
  }
  return value;
};
const toCamelKeys = (obj: Record<string, unknown>): Record<string, unknown> =>
  toCamel(obj) as Record<string, unknown>;

/**
 * Save the whole 1003 by transaction id. The backend overwrites every field, so
 * the caller must pass the cumulative payload each step, not just the delta.
 */
export const saveApplicationStep = (
  transactionId: string,
  body: Application1003UpdateRequest,
): Promise<Application1003Response> =>
  apiClient
    .put<TeraResponse<Application1003Response>, Record<string, unknown>>(
      `${TERA}/application/${transactionId}`,
      toCamelKeys(body as unknown as Record<string, unknown>),
    )
    .then((r) => r.payload);

/** Read the borrower's saved 1003 by transaction id — to repopulate on resume/reload. */
export const getApplicationDetail = (transactionId: string): Promise<Application1003Response> =>
  apiClient
    // Best-effort enrichment (My loans card / resume prefill): the UI renders
    // fine without it, so a missing/invalid transaction shouldn't toast.
    .get<TeraResponse<Application1003Response>>(`${TERA}/application/${transactionId}`, {
      skipErrorToast: true,
    })
    .then((r) => r.payload);

/**
 * Save the MAIN borrower's personal details (Personal-details step). The backend
 * resolves the borrower from the transaction; this DTO also round-trips camelCase.
 */
export const saveBorrowerPersonal = (
  transactionId: string,
  body: BorrowerUpdateRequest,
): Promise<BorrowerResponse> =>
  apiClient
    .put<TeraResponse<BorrowerResponse>, Record<string, unknown>>(
      `${TERA}/application/${transactionId}/borrower`,
      toCamelKeys(body as unknown as Record<string, unknown>),
    )
    .then((r) => r.payload);

/** Replace the main borrower's employments (Employment step). */
export const saveEmployments = (
  transactionId: string,
  employments: BorrowerEmploymentRequest[],
): Promise<void> =>
  apiClient
    .put<TeraResponse<unknown>, unknown>(
      `${TERA}/application/${transactionId}/employments`,
      toCamel(employments),
    )
    .then(() => undefined);

/** Replace the main borrower's other incomes (Employment step). */
export const saveOtherIncomes = (
  transactionId: string,
  incomes: BorrowerOtherIncomeRequest[],
): Promise<void> =>
  apiClient
    .put<TeraResponse<unknown>, unknown>(
      `${TERA}/application/${transactionId}/other-incomes`,
      toCamel(incomes),
    )
    .then(() => undefined);

/** Replace the transaction's assets (Assets step). */
export const saveAssets = (
  transactionId: string,
  assets: TransactionAssetRequest[],
): Promise<void> =>
  apiClient
    .put<TeraResponse<unknown>, unknown>(`${TERA}/application/${transactionId}/assets`, toCamel(assets))
    .then(() => undefined);

/** Replace the transaction's liabilities (Liabilities step). */
export const saveLiabilities = (
  transactionId: string,
  liabilities: BorrowerLiabilityRequest[],
): Promise<void> =>
  apiClient
    .put<TeraResponse<unknown>, unknown>(
      `${TERA}/application/${transactionId}/liabilities`,
      toCamel(liabilities),
    )
    .then(() => undefined);

/** Upsert the main borrower's demographics (Demographic step). */
export const saveDemographics = (
  transactionId: string,
  demographics: BorrowerDemographicsRequest,
): Promise<void> =>
  apiClient
    .put<TeraResponse<unknown>, Record<string, unknown>>(
      `${TERA}/application/${transactionId}/demographics`,
      toCamelKeys(demographics as unknown as Record<string, unknown>),
    )
    .then(() => undefined);

/** Non-1003 sections read back for resume/reload (responses are camelCase). */
export interface ApplicationSections {
  employments?: Array<Record<string, unknown>>;
  otherIncomes?: Array<Record<string, unknown>>;
  assets?: Array<Record<string, unknown>>;
  liabilities?: Array<Record<string, unknown>>;
  demographics?: Record<string, unknown> | null;
}

/**
 * Composite read of the borrower's non-1003 sections, for step hydration. Pass
 * `skipErrorToast` for best-effort reads (My-loans card, Documents-nav gate)
 * where a missing/invalid transaction shouldn't surface a toast.
 */
export const getApplicationSections = (
  transactionId: string,
  { skipErrorToast = false }: { skipErrorToast?: boolean } = {},
): Promise<ApplicationSections> =>
  apiClient
    .get<TeraResponse<ApplicationSections>>(`${TERA}/application/${transactionId}/sections`, {
      skipErrorToast,
    })
    .then((r) => r.payload);

/** The borrower's applications (most-recent first), tolerating Page/array shapes. */
export const listMyApplications = (): Promise<LoanSummaryResponse[]> =>
  apiClient
    .get<TeraResponse<SpringPage<LoanSummaryResponse> | LoanSummaryResponse[]>>(`${TERA}/applications`)
    .then((r) => (Array.isArray(r.payload) ? r.payload : (r.payload?.content ?? [])));
