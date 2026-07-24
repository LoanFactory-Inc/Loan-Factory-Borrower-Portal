/**
 * TypeScript contract for the tera-be borrower loan-application flow.
 *
 * Source of truth: the LOS backend (`tera-be`) Spring Boot controllers under
 * `com.loanfactory.tera.transaction` / `.profile` / `.applicationstatus`.
 *
 * Conventions carried over from the backend:
 * - JSON is snake_case globally (the ObjectMapper is configured snake_case), so
 *   Java `firstName` serializes as `first_name`.
 * - Every response is wrapped in the tera-core envelope `{ payload, error,
 *   response_date }` (see {@link TeraResponse}).
 * - All IDs are String UUIDs.
 * - "enum-like" fields (occupancy, loan_type, property_type, marital_status…)
 *   are plain strings on the wire — modelled here as `string`.
 */

/* ─────────────────────────── Envelope ─────────────────────────── */

/**
 * tera-core error object (present only on failures; success omits it). The
 * user-facing text is `messages[0]` (falling back to `context`); `type` is the
 * HttpStatus enum name (e.g. "BAD_REQUEST", "FORBIDDEN"). `stack_trace` /
 * `class_exception` are diagnostic and must not be surfaced.
 */
export interface TeraError {
  path?: string;
  type?: string;
  context?: string;
  messages?: string[];
  binding_args?: Record<string, string>;
  class_exception?: string;
  stack_trace?: string[];
}

/** tera-core response envelope: `{ payload, error, response_date }`. */
export interface TeraResponse<T> {
  payload: T;
  error: TeraError | null;
  response_date?: {
    timestamp: number;
    formatted: string;
    zone: string;
  };
}

/**
 * Mutation responses on the 1003 sub-resources carry the updated
 * completeness tree alongside the payload as a top-level `applicationStatus`
 * field (deliberately camelCase on the backend). It is omitted when null.
 */
export type MutationPayload<T> = T & { applicationStatus?: StatusNode };

/* ────────────────── STEP 0 — Check email ─────────────────────── */

/** `GET /api/v1/profiles/check-email?email=` → EmailCheckResponse */
export interface EmailCheckResponse {
  exists: boolean;
  user_id: string | null;
  profile_type: string | null;
}

/* ─────────────── STEP 1 — Create prospect (transaction) ───────── */

/**
 * `POST /api/v1/transactions/prospects`.
 * Branch A (existing account): send `borrower_user_id`.
 * Branch B (new borrower): send `borrower_email` + name/phone strings.
 * The two branches are enforced by the facade, not by bean validation.
 */
export interface ProspectRequest {
  borrower_first_name?: string;
  borrower_last_name?: string;
  borrower_email?: string;
  borrower_cell_phone?: string;
  /** Branch A: link an existing user-service account by id. */
  borrower_user_id?: string;
  purpose?: string;
  loa_id?: string;
  processor_id?: string;
  realtor_referral_id?: string;
  status?: string;
  owner_id?: string;
}

export interface BorrowerNameEntry {
  id: string;
  first_name: string;
  last_name: string;
  is_main_borrower: boolean;
  is_hidden: boolean;
}

export type BorrowerAccountStatus = "CREATED" | "LINKED_EXISTING" | "FAILED" | null;

export interface ProspectResponse {
  id: string;
  transaction_id: string;
  lead_id: string | null;
  loan_number: string | null;
  status: string;
  transaction_source: string;
  purpose: string | null;
  borrower_names: BorrowerNameEntry[];
  borrower_account_status: BorrowerAccountStatus;
  borrower_account_error: string | null;
  loan_amount: number | null;
  closing_date: string | null;
  created_at: string;
  modified_at: string;
  version: number;
}

/* ───── Borrower-facing application (BorrowerLoanController) ────── */

/**
 * Loan purpose exactly as tera-be's 1003 stores and matches it — the canonical
 * strings `"Purchase"` / `"Refinance"` (see BE `TodoWorkflowAdapter`
 * `PURPOSE_PURCHASE` / `PURPOSE_REFINANCE`, compared case-sensitively via
 * `Applicability.Op.EQ`, mirroring tera-fe `loanOptions.ts`). The borrower
 * wizard's `"buy"` / `"refi"` map onto these — never send the wizard value.
 */
export const BACKEND_LOAN_PURPOSE = {
  buy: "Purchase",
  refi: "Refinance",
} as const;

export type BackendLoanPurpose = (typeof BACKEND_LOAN_PURPOSE)[keyof typeof BACKEND_LOAN_PURPOSE];

/**
 * `POST /api/v1/application` body. Borrower self-application: the borrower is
 * resolved from the authenticated identity, so the payload is just the purpose
 * chosen in the wizard (plus an optional realtor referral).
 */
export interface CreateApplicationRequest {
  purpose?: BackendLoanPurpose;
  realtor_referral_id?: string;
}

/**
 * `GET /api/v1/applications` row — the borrower's own loans (`LoanResponse`),
 * a denormalized pipeline summary. Full 1003 detail is not returned here.
 */
export interface LoanSummaryResponse {
  id: string;
  transaction_id: string;
  loan_number: string | null;
  status: string;
  purpose: string | null;
  loan_amount: number | null;
  closing_date: string | null;
  borrower_names: BorrowerNameEntry[];
  created_at: string;
  modified_at: string;
}

/** Spring `Page<T>` as serialized on the wire (content + paging metadata). */
export interface SpringPage<T> {
  content: T[];
  total_elements?: number;
  total_pages?: number;
  number?: number;
  size?: number;
}

/* ─────────────── Shared address DTO ──────────────────────────── */

export interface AddressRequest {
  line1?: string;
  line2?: string;
  unit?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  county_name?: string;
  county_fips?: string;
}

export type AddressResponse = AddressRequest & { id: string };

/* ─────────────── STEP 3 — Application (1003 loan info) ────────── */

/** `PUT /api/v1/transactions/{transactionId}/application` body. */
export interface Application1003UpdateRequest {
  purpose?: BackendLoanPurpose;
  loan_type?: string;
  loan_amount?: number;
  property_value?: number;
  property_type?: string;
  occupancy?: string;
  loan_program?: string;
  purchase_price?: number;
  full_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  county_name?: string;
  closing_date?: string;
  mortgage_type?: string;
  interest_rate?: number;
  amortization_years?: number;
  amortization_type?: string;
  lien_priority?: string;
  discount_points_percent?: number;
  estimated_closing_costs?: number;
  prepaid_items_amount?: number;
  seller_credits_amount?: number;
  lender_credits_amount?: number;
  other_credits_amount?: number;
  earnest_money_deposits?: number;
  projected_reserves?: number;
  rate_type?: string;
  refinance_type?: string;
  number_of_units?: number;
  down_payment_amount?: number;
  county_fips?: string;
}

export interface Application1003Response extends Application1003UpdateRequest {
  id: string;
  transaction_id: string;
  subject_property_id: string | null;
  borrowers?: BorrowerResponse[];
  created_date: string;
  last_modified_date: string;
}

/* ─────────────── STEP 4 — Property ───────────────────────────── */

export interface PropertyRequest {
  borrower_ids?: string[];
  address?: AddressRequest;
  is_address_tbd?: boolean;
  disposition_status?: string;
  property_value?: number;
  appraised_property_value?: number;
  usage_type?: string;
  current_usage_type?: string;
  property_type?: string;
  attachment_type?: string;
  financed_unit_count?: number;
  construction_method_type?: string;
  construction_status_type?: string;
  structure_built_year?: number;
  estate_type?: string;
  is_fha_secondary_residence?: boolean;
  is_mixed_use?: boolean;
  is_clean_energy_lien?: boolean;
  is_in_project?: boolean;
  is_pud?: boolean;
  mortgaged?: boolean;
  rental_income?: number;
  rental_income_net?: number;
  rental_income_net_overridden?: boolean;
  has_subordinate_lien?: boolean;
  sort_order?: number;
}

export interface PropertyResponse extends PropertyRequest {
  id: string;
  transaction_id: string;
  address?: AddressResponse;
  expenses_monthly_amount?: number;
  created_date: string;
  last_modified_date: string;
}

/* ─────────────── STEP 5 — Borrower ───────────────────────────── */

/** `POST .../borrowers` — minimal create. */
export interface BorrowerCreateRequest {
  first_name: string;
  last_name: string;
  email: string;
  cell_phone?: string;
}

/** `PUT .../borrowers/{borrowerId}` — full personal info. */
export interface BorrowerUpdateRequest {
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  email: string;
  cell_phone?: string;
  work_phone?: string;
  home_phone?: string;
  birth_date?: string;
  ssn_encrypted?: string;
  marital_status?: string;
  citizenship?: string;
  dependents?: number;
  dependents_ages?: string;
  credit_score_rating?: string;
  has_military_service?: boolean;
  military_branch?: string;
  military_service_status?: string;
  military_service_completion_date?: string;
  is_military_surviving_spouse?: boolean;
  is_married_to_main_borrower?: boolean;
  alternate_names_json?: string;
  borrower_pair_id?: string;
}

export interface BorrowerResponse {
  id: string;
  application_id: string;
  sort_order: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  email: string;
  phone: string | null;
  cell_phone: string | null;
  work_phone: string | null;
  home_phone: string | null;
  birth_date: string | null;
  marital_status: string | null;
  citizenship: string | null;
  dependents: number | null;
  credit_score_rating: string | null;
  is_main_borrower: boolean;
  is_hidden: boolean;
  is_married_to_main_borrower: boolean;
  borrower_pair_id: string | null;
  spouse_id: string | null;
  created_date: string;
  last_modified_date: string;
}

/* ─────────────── STEP 6 — Employment ─────────────────────────── */

export interface BorrowerEmploymentRequest {
  employer_name: string;
  employer_phone?: string;
  position?: string;
  income_amount?: number;
  start_date?: string;
  end_date?: string;
  employment_type?: string;
  is_active?: boolean;
  income_frequency?: string;
  time_in_industry_years?: number;
  time_in_industry_months?: number;
  receives_additional_incomes?: boolean;
  is_special_employer_relationship?: boolean;
  is_seasonal?: boolean;
  sort_order?: number;
  business_address?: AddressRequest;
  base_income?: number;
  bonus_income?: number;
  overtime_income?: number;
  commission_income?: number;
  ownership_share?: string;
  business_phone?: string;
  is_foreign_income?: boolean;
  business_name?: string;
  business_type?: string;
}

export interface BorrowerEmploymentResponse extends BorrowerEmploymentRequest {
  id: string;
  borrower_id: string;
  business_address?: AddressResponse;
}

/* ─────────────── STEP 7 — Other income ───────────────────────── */

export interface BorrowerOtherIncomeRequest {
  income_type: string;
  amount?: number;
  frequency?: string;
  sort_order?: number;
}

export interface BorrowerOtherIncomeResponse extends BorrowerOtherIncomeRequest {
  id: string;
  borrower_id: string;
  created_date: string;
  last_modified_date: string;
}

/* ─────────────── STEP 8 — Asset (transaction-scoped) ─────────── */

export interface TransactionAssetRequest {
  borrower_ids: string[];
  asset_type: string;
  financial_institution?: string;
  account_number?: string;
  cash_market_value?: number;
  deposited?: boolean;
  gift_source?: string;
  sort_order?: number;
}

export interface TransactionAssetResponse {
  id: string;
  borrower_ids: string[];
  borrower_names: string[];
  asset_type: string;
  financial_institution: string | null;
  account_number: string | null;
  cash_market_value: number | null;
  deposited: boolean | null;
  gift_source: string | null;
  sort_order: number;
  created_date: string;
  last_modified_date: string;
}

/* ─────────────── STEP 9 — Liability (transaction-scoped) ─────── */

export interface BorrowerLiabilityRequest {
  liability_type?: string;
  creditor_name?: string;
  account_number?: string;
  unpaid_balance?: number;
  monthly_payment?: number;
  months_remaining?: number;
  will_be_paid_off?: boolean;
  sort_order?: number;
  borrower_ids?: string[];
  exclude_from_dti?: boolean;
  exclude_from_dti_reason?: string;
  reo_property_id?: string;
}

export interface BorrowerLiabilityResponse extends BorrowerLiabilityRequest {
  id: string;
  borrower_names: string[];
  source: string | null;
  needs_review_reason: string | null;
  created_date: string;
  last_modified_date: string;
}

/* ─────────────── STEP 10 — Declarations ──────────────────────── */

/** The 15 URLA declaration booleans (`.../borrowers/{id}/declarations`). */
export interface BorrowerDeclarationsRequest {
  primary_residence?: boolean;
  ownership_interest?: boolean;
  family_relationship_with_seller?: boolean;
  undisclosed_borrowed_funds?: boolean;
  undisclosed_mortgage?: boolean;
  undisclosed_new_credit?: boolean;
  priority_lien?: boolean;
  co_signer_or_guarantor?: boolean;
  unpaid_judgments?: boolean;
  delinquent_on_debt?: boolean;
  party_to_lawsuit?: boolean;
  transferred_title?: boolean;
  pre_foreclosure_sale?: boolean;
  foreclosure?: boolean;
  bankruptcy?: boolean;
}

export interface BorrowerDeclarationsResponse extends BorrowerDeclarationsRequest {
  id: string;
  borrower_id: string;
}

/* ─────────────── STEP 11 — Demographics ──────────────────────── */

export interface BorrowerDemographicsRequest {
  application_taken_method?: string;
  ethnicity_consent?: boolean;
  ethnicity?: string;
  race_consent?: boolean;
  race?: string[];
  gender_consent?: boolean;
  gender?: string[];
}

export interface BorrowerDemographicsResponse extends BorrowerDemographicsRequest {
  id: string;
  borrower_id: string;
}

/* ─────────────── STEP 12/13 — Real estate owned ──────────────── */

export interface RealEstateOwnedRequest {
  property_address?: AddressRequest;
  property_type?: string;
  property_status?: string;
  market_value?: number;
  mortgage_balance?: number;
  monthly_mortgage_payment?: number;
  monthly_insurance?: number;
  monthly_taxes?: number;
  monthly_hoa?: number;
  rental_income?: number;
  intended_occupancy?: string;
  sort_order?: number;
}

export interface RealEstateOwnedResponse extends RealEstateOwnedRequest {
  id: string;
  borrower_id: string;
  property_address?: AddressResponse;
  created_date: string;
  last_modified_date: string;
}

/* ─────────────── STEP 14 — Application status (gate) ─────────── */

export interface StatusError {
  path: string;
  message: string;
  severity: "ERROR" | "WARNING";
}

/**
 * Recursive completeness tree. Field names are camelCase here (the backend
 * type is a Java record whose component names are emitted verbatim).
 */
export interface StatusNode {
  complete: boolean;
  errorCount: number;
  incompleteCount: number;
  progress: number;
  completeness?: { total: number; filled: number };
  errors?: StatusError[];
  incompleteFields?: string[];
  requiredFields?: string[];
  children?: Record<string, StatusNode>;
}
