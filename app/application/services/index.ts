/**
 * tera-be borrower loan-application API — endpoint mapping.
 *
 * One function per REST endpoint in the flow (steps 0–14). Each returns the
 * tera-core envelope; callers read `.payload`. Errors surface as rejected
 * promises and are toasted centrally by the axios response interceptor.
 *
 * Auth: the caller's access_token is attached as `Authorization: Bearer` by
 * the axios request interceptor; the api-gateway validates it and injects
 * `X-User-ID` for tera-be. Login itself lives in `app/login/services`.
 *
 * Orchestration of the whole flow (form → this layer) lives in `./mapper`.
 */
import { apiClient, type ApiRequestConfig } from "@/repository/axios";
import type {
  Application1003Response,
  Application1003UpdateRequest,
  BorrowerCreateRequest,
  BorrowerDeclarationsRequest,
  BorrowerDeclarationsResponse,
  BorrowerDemographicsRequest,
  BorrowerDemographicsResponse,
  BorrowerEmploymentRequest,
  BorrowerEmploymentResponse,
  BorrowerLiabilityRequest,
  BorrowerLiabilityResponse,
  BorrowerOtherIncomeRequest,
  BorrowerOtherIncomeResponse,
  BorrowerResponse,
  BorrowerUpdateRequest,
  EmailCheckResponse,
  MutationPayload,
  PropertyRequest,
  PropertyResponse,
  ProspectRequest,
  ProspectResponse,
  RealEstateOwnedRequest,
  RealEstateOwnedResponse,
  StatusNode,
  TeraResponse,
  TransactionAssetRequest,
  TransactionAssetResponse,
} from "./types";

/**
 * Route prefix for the LOS service (`tera-be`). Must be `tera-svc` so the axios
 * interceptor + Next `/tera-svc` rewrite send these calls same-origin to tera-be
 * (:8088), carrying the logged-in identity as `X-User-ID`. The old `los-svc`
 * prefix had no rewrite and pointed at the gateway (:4000), which can't reach
 * tera-be in local dev — so the whole new-application submit silently failed.
 */
export const LOS_PREFIX = "tera-svc";

const api = (path: string) => `${LOS_PREFIX}/api/v1${path}`;
/** Base for all transaction-scoped sub-resources. */
const tx = (transactionId: string) => api(`/transactions/${transactionId}`);

/* ───────────────── STEP 0 — Check email ──────────────────────── */

/** Does an account already exist for this email? (drives prospect branch A/B) */
export const checkEmail = (email: string) =>
  apiClient.get<TeraResponse<EmailCheckResponse>>(api("/profiles/check-email"), {
    params: { email },
  });

/* ───────────────── STEP 1 — Create prospect ──────────────────── */

/**
 * Create the transaction + create/link the borrower account + link the
 * BORROWER participant. Branch A → pass `borrower_user_id`; branch B → pass
 * `borrower_email` + names. Returns the transaction id used by every
 * subsequent sub-resource call.
 */
export const createProspect = (body: ProspectRequest, config?: ApiRequestConfig) =>
  apiClient.post<TeraResponse<ProspectResponse>, ProspectRequest>(
    api("/transactions/prospects"),
    body,
    config,
  );

/* ───────────────── STEP 2 — Collection reads ─────────────────── */

/** List borrowers on a transaction (to resolve the main borrower_id). */
export const listBorrowers = (transactionId: string) =>
  apiClient.get<TeraResponse<BorrowerResponse[]>>(`${tx(transactionId)}/borrowers`);

/** List properties on a transaction (to resolve the subject property_id). */
export const listProperties = (transactionId: string) =>
  apiClient.get<TeraResponse<PropertyResponse[]>>(`${tx(transactionId)}/properties`);

/* ───────────────── STEP 3 — Application (1003) ───────────────── */

export const getApplication = (transactionId: string, expand?: string) =>
  apiClient.get<TeraResponse<Application1003Response>>(`${tx(transactionId)}/application`, {
    params: expand ? { expand } : undefined,
  });

export const updateApplication = (transactionId: string, body: Application1003UpdateRequest) =>
  apiClient.put<TeraResponse<MutationPayload<Application1003Response>>, Application1003UpdateRequest>(
    `${tx(transactionId)}/application`,
    body,
  );

/* ───────────────── STEP 4 — Properties ───────────────────────── */

export const createProperty = (transactionId: string, body: PropertyRequest) =>
  apiClient.post<TeraResponse<MutationPayload<PropertyResponse>>, PropertyRequest>(
    `${tx(transactionId)}/properties`,
    body,
  );

export const updateProperty = (transactionId: string, propertyId: string, body: PropertyRequest) =>
  apiClient.put<TeraResponse<MutationPayload<PropertyResponse>>, PropertyRequest>(
    `${tx(transactionId)}/properties/${propertyId}`,
    body,
  );

/* ───────────────── STEP 5 — Borrowers ────────────────────────── */

export const createBorrower = (transactionId: string, body: BorrowerCreateRequest) =>
  apiClient.post<TeraResponse<MutationPayload<BorrowerResponse>>, BorrowerCreateRequest>(
    `${tx(transactionId)}/borrowers`,
    body,
  );

export const updateBorrower = (
  transactionId: string,
  borrowerId: string,
  body: BorrowerUpdateRequest,
) =>
  apiClient.put<TeraResponse<MutationPayload<BorrowerResponse>>, BorrowerUpdateRequest>(
    `${tx(transactionId)}/borrowers/${borrowerId}`,
    body,
  );

/* ───────────────── STEP 6 — Employments ──────────────────────── */

export const createEmployment = (
  transactionId: string,
  borrowerId: string,
  body: BorrowerEmploymentRequest,
) =>
  apiClient.post<TeraResponse<MutationPayload<BorrowerEmploymentResponse>>, BorrowerEmploymentRequest>(
    `${tx(transactionId)}/borrowers/${borrowerId}/employments`,
    body,
  );

/* ───────────────── STEP 7 — Other incomes ────────────────────── */

export const createOtherIncome = (
  transactionId: string,
  borrowerId: string,
  body: BorrowerOtherIncomeRequest,
) =>
  apiClient.post<
    TeraResponse<MutationPayload<BorrowerOtherIncomeResponse>>,
    BorrowerOtherIncomeRequest
  >(`${tx(transactionId)}/borrowers/${borrowerId}/other-incomes`, body);

/* ───────────────── STEP 8 — Assets (bare DTO, no wrapper) ────── */

export const listAssets = (transactionId: string) =>
  apiClient.get<TeraResponse<TransactionAssetResponse[]>>(`${tx(transactionId)}/assets`);

export const createAsset = (transactionId: string, body: TransactionAssetRequest) =>
  apiClient.post<TeraResponse<TransactionAssetResponse>, TransactionAssetRequest>(
    `${tx(transactionId)}/assets`,
    body,
  );

/* ───────────────── STEP 9 — Liabilities ──────────────────────── */

export const listLiabilities = (transactionId: string, reoPropertyId?: string) =>
  apiClient.get<TeraResponse<BorrowerLiabilityResponse[]>>(`${tx(transactionId)}/liabilities`, {
    params: reoPropertyId ? { reoPropertyId } : undefined,
  });

export const createLiability = (transactionId: string, body: BorrowerLiabilityRequest) =>
  apiClient.post<TeraResponse<MutationPayload<BorrowerLiabilityResponse>>, BorrowerLiabilityRequest>(
    `${tx(transactionId)}/liabilities`,
    body,
  );

/* ───────────────── STEP 10 — Declarations ────────────────────── */

export const getDeclarations = (transactionId: string, borrowerId: string) =>
  apiClient.get<TeraResponse<BorrowerDeclarationsResponse>>(
    `${tx(transactionId)}/borrowers/${borrowerId}/declarations`,
  );

export const putDeclarations = (
  transactionId: string,
  borrowerId: string,
  body: BorrowerDeclarationsRequest,
) =>
  apiClient.put<
    TeraResponse<MutationPayload<BorrowerDeclarationsResponse>>,
    BorrowerDeclarationsRequest
  >(`${tx(transactionId)}/borrowers/${borrowerId}/declarations`, body);

/* ───────────────── STEP 11 — Demographics ────────────────────── */

export const getDemographics = (transactionId: string, borrowerId: string) =>
  apiClient.get<TeraResponse<BorrowerDemographicsResponse>>(
    `${tx(transactionId)}/borrowers/${borrowerId}/demographics`,
  );

export const putDemographics = (
  transactionId: string,
  borrowerId: string,
  body: BorrowerDemographicsRequest,
) =>
  apiClient.put<
    TeraResponse<MutationPayload<BorrowerDemographicsResponse>>,
    BorrowerDemographicsRequest
  >(`${tx(transactionId)}/borrowers/${borrowerId}/demographics`, body);

/* ───────────────── STEP 12/13 — Real estate owned ────────────── */

export const listRealEstate = (transactionId: string, borrowerId: string) =>
  apiClient.get<TeraResponse<RealEstateOwnedResponse[]>>(
    `${tx(transactionId)}/borrowers/${borrowerId}/real-estate`,
  );

export const createRealEstate = (
  transactionId: string,
  borrowerId: string,
  body: RealEstateOwnedRequest,
) =>
  apiClient.post<TeraResponse<MutationPayload<RealEstateOwnedResponse>>, RealEstateOwnedRequest>(
    `${tx(transactionId)}/borrowers/${borrowerId}/real-estate`,
    body,
  );

/* ───────────────── STEP 14 — Application status (gate) ───────── */

/** Completeness gate — recursive `StatusNode` tree with progress 0–100. */
export const getApplicationStatus = (transactionId: string) =>
  apiClient.get<TeraResponse<StatusNode>>(`${tx(transactionId)}/application-status`);

/* ───────────────── STEP 15 — Submit application ──────────────── */

/**
 * NOTE: tera-be has NO `submit-application` endpoint today. The only
 * transaction-lifecycle mutations that exist are the conversions below.
 * Wire a real submit here once the backend adds it (see flow step 15).
 */
export const convertToLoan = (transactionId: string) =>
  apiClient.post<TeraResponse<ProspectResponse>>(`${tx(transactionId)}/convert-to-loan`);
