import type { LoanPurpose } from "@/app/application/types";
import { apiClient } from "@/repository/axios";

/** Flattened loan row for the My-loans page. */
export interface BorrowerLoan {
  /** transaction_id (falls back to the response id). */
  id: string;
  purpose: LoanPurpose | "";
  status: "in_progress" | "submitted";
  /** Raw loan amount digits, for display. */
  loanAmount: string;
  loanNumber: string;
  borrowerName: string;
  /** Epoch (seconds) of last modification, for sorting most-recent-first. */
  modifiedAt: number;
}

/** Instant serialized as an object by the platform. */
interface TeraInstant {
  timestamp?: number | null;
}

/** A borrower_names entry — tolerate snake_case or camelCase inner keys. */
interface RawBorrowerName {
  first_name?: string | null;
  firstName?: string | null;
  last_name?: string | null;
  lastName?: string | null;
  is_main_borrower?: boolean;
  isMainBorrower?: boolean;
}

/** LoanResponse as serialized by BorrowerLoanController (snake_case). */
interface RawLoan {
  id: string;
  transaction_id?: string | null;
  loan_number?: string | null;
  loan_amount?: number | string | null;
  purpose?: string | null;
  status?: string | null;
  created_at?: TeraInstant | null;
  modified_at?: TeraInstant | null;
  borrower_names?: RawBorrowerName[] | null;
}

/**
 * Pull the loan array out of the response. The platform envelope puts it under
 * `payload`; we also tolerate a raw Spring `Page` (`{ content }`) or a bare
 * array so a change in the gateway wrapper won't break the read.
 */
function extractLoans(data: unknown): RawLoan[] {
  if (Array.isArray(data)) return data as RawLoan[];
  const obj = (data ?? {}) as Record<string, unknown>;
  if (Array.isArray(obj.payload)) return obj.payload as RawLoan[];
  if (Array.isArray(obj.content)) return obj.content as RawLoan[];
  const payload = obj.payload as Record<string, unknown> | undefined;
  if (payload && Array.isArray(payload.content)) return payload.content as RawLoan[];
  return [];
}

function mapPurpose(p: string | null | undefined): LoanPurpose | "" {
  const t = (p ?? "").toLowerCase();
  if (t.includes("refi")) return "refi";
  if (t.includes("purchase") || t.includes("buy")) return "buy";
  return "";
}

// Loans still being filled out read as in-progress; anything further along
// (submitted → funded) shows as an active, submitted deal.
function mapStatus(s: string | null | undefined): BorrowerLoan["status"] {
  return /progress|draft|prospect|application|incomplete|new/i.test(s ?? "")
    ? "in_progress"
    : "submitted";
}

function mainBorrowerName(names: RawBorrowerName[] | null | undefined): string {
  if (!names || names.length === 0) return "";
  const b = names.find((x) => x.is_main_borrower ?? x.isMainBorrower) ?? names[0];
  const first = b.first_name ?? b.firstName ?? "";
  const last = b.last_name ?? b.lastName ?? "";
  return `${first} ${last}`.trim();
}

/**
 * The current borrower's loans, most-recent first. Throws on network/HTTP
 * failure so the caller can fall back to local (Redux) state.
 */
export async function listBorrowerLoans(): Promise<BorrowerLoan[]> {
  // Borrower-safe list: BorrowerLoanController GET /api/v1/applications, scoped
  // by construction to loans where the caller is the BORROWER. Goes through the
  // gateway (apiClient attaches the logged-in Bearer token; the gateway injects
  // the caller identity) — no caller-supplied user id. extractLoans unwraps the
  // tera-core envelope; the page still catches to render its fallback UI.
  const data = await apiClient.get<unknown>("tera-svc/api/v1/applications");
  return extractLoans(data)
    .map((l) => ({
      id: l.transaction_id || l.id,
      purpose: mapPurpose(l.purpose),
      status: mapStatus(l.status),
      loanAmount: l.loan_amount != null ? String(l.loan_amount).replace(/[^\d]/g, "") : "",
      loanNumber: l.loan_number ?? "",
      borrowerName: mainBorrowerName(l.borrower_names),
      modifiedAt: l.modified_at?.timestamp ?? l.created_at?.timestamp ?? 0,
    }))
    .sort((a, b) => b.modifiedAt - a.modifiedAt);
}
