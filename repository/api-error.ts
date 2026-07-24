import axios, { type AxiosError } from "axios";
import { toast } from "sonner";

import i18n from "@/i18n";
import { store } from "@/store";
import { clearAuth } from "@/store/slices/auth-slice";
import { clearAuthCookie } from "@/store/auth-token";

/**
 * Application-level API error handling.
 *
 * Every failure — transport-level or HTTP — is normalized into a single
 * {@link AppError} carrying a localized, user-facing `message`, a machine
 * `code`, the HTTP `status`, and a coarse `kind`. {@link showApiError} turns
 * that into a de-duplicated toast (and, on 401, clears the session and routes
 * to login). The axios interceptor in `./axios` delegates to it.
 *
 * Two backend envelopes are supported:
 *  - tera-core: `{ payload, error, response_date }`. On failure the user-facing
 *    text lives in `error.messages[0]` (→ `error.context`), and the machine
 *    code in `error.type` (an HttpStatus enum name). Success omits `error`.
 *  - legacy admin: `{ status, message, display_message, ...payload }`, where the
 *    message fields carry the text. Used by login/config endpoints.
 * `stack_trace` / `class_exception` are diagnostic and never surfaced.
 */

export type AppErrorKind = "network" | "timeout" | "canceled" | "http" | "api" | "unknown";

export class AppError extends Error {
  readonly code: string;
  readonly status: number | null;
  readonly kind: AppErrorKind;

  constructor(message: string, opts: { code: string; status?: number | null; kind: AppErrorKind }) {
    super(message);
    this.name = "AppError";
    this.code = opts.code;
    this.status = opts.status ?? null;
    this.kind = opts.kind;
  }
}

const t = (key: string) => i18n.t(key);

/** A localized fallback message for an HTTP status when the body carries none. */
function messageForStatus(status: number | null): string {
  switch (status) {
    case 400:
      return t("error.badRequest");
    case 401:
      return t("error.unauthorized");
    case 403:
      return t("error.forbidden");
    case 404:
      return t("error.notFound");
    case 409:
      return t("error.conflict");
    case 422:
      return t("error.validation");
    case 429:
      return t("error.tooManyRequests");
    case 503:
      return t("error.unavailable");
    case 500:
    case 502:
    case 504:
      return t("error.server");
    default:
      return t("error.unknown");
  }
}

/**
 * Best user-facing message from a response body, across both envelopes:
 * tera-core `error.messages[0]` → `error.context`, then legacy
 * `display_message` → `message`. Returns undefined when none is usable.
 */
export function extractApiMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;

  const err = d.error as Record<string, unknown> | null | undefined;
  if (err && typeof err === "object") {
    const messages = err.messages;
    if (Array.isArray(messages)) {
      const first = messages.find((m) => typeof m === "string" && m.trim());
      if (typeof first === "string") return first;
    }
    if (typeof err.context === "string" && err.context.trim()) return err.context;
  }

  if (typeof d.display_message === "string" && d.display_message.trim()) return d.display_message;
  if (typeof d.message === "string" && d.message.trim()) return d.message;
  return undefined;
}

/** Machine code for a body: tera-core `error.type` (HttpStatus enum name). */
function codeFromData(data: unknown): string | undefined {
  if (data && typeof data === "object") {
    const err = (data as Record<string, unknown>).error as Record<string, unknown> | undefined;
    if (err && typeof err.type === "string" && err.type) return err.type;
  }
  return undefined;
}

/** True when a 2xx body still carries a tera-core `error` (defensive). */
export function hasEnvelopeError(data: unknown): boolean {
  return !!(data && typeof data === "object" && (data as Record<string, unknown>).error);
}

/** Build an {@link AppError} from a response body + status (both transports). */
export function appErrorFromBody(
  body: unknown,
  status: number,
  kind: AppErrorKind = "http",
): AppError {
  return new AppError(extractApiMessage(body) ?? messageForStatus(status), {
    code: codeFromData(body) ?? (kind === "api" ? "API_ERROR" : `HTTP_${status}`),
    status,
    kind,
  });
}

/** Normalize anything thrown/rejected into an {@link AppError}. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (axios.isCancel(err)) {
    return new AppError("", { code: "CANCELED", kind: "canceled" });
  }

  const ax = err as AxiosError | undefined;
  if (ax && (ax.isAxiosError || ax.code || ax.config)) {
    if (ax.code === "ECONNABORTED" || /timeout/i.test(ax.message ?? "")) {
      return new AppError(t("error.timeout"), { code: "TIMEOUT", kind: "timeout" });
    }
    if (ax.response) {
      const status = ax.response.status;
      const data = ax.response.data;
      return new AppError(extractApiMessage(data) ?? messageForStatus(status), {
        code: codeFromData(data) ?? `HTTP_${status}`,
        status,
        kind: "http",
      });
    }
    // Request left the app but no response came back → connectivity.
    if (ax.request || ax.code === "ERR_NETWORK") {
      return new AppError(t("error.network"), { code: "NETWORK", kind: "network" });
    }
  }

  if (err instanceof Error && err.message) {
    return new AppError(err.message, { code: "UNKNOWN", kind: "unknown" });
  }
  return new AppError(t("error.unknown"), { code: "UNKNOWN", kind: "unknown" });
}

let redirectingToLogin = false;

/** On 401: drop the session and route to login (guarding against a loop). */
function handleUnauthorized(): void {
  try {
    store.dispatch(clearAuth());
    clearAuthCookie();
  } catch {
    // ignore — best effort
  }
  if (typeof window === "undefined" || redirectingToLogin) return;
  const loginPath = "/borrower-portal/login";
  if (window.location.pathname.startsWith(loginPath)) return;
  redirectingToLogin = true;
  window.location.assign(loginPath);
}

/**
 * Normalize, toast (deduped by code so a burst collapses to one), and — on 401 —
 * clear the session and redirect. Canceled requests are silent. Returns the
 * {@link AppError} so callers can still branch on `.status` / `.code`.
 */
export function showApiError(err: unknown, opts?: { silent?: boolean }): AppError {
  const e = toAppError(err);
  if (e.kind === "canceled") return e;
  // `silent` requests still get 401 handling and the normalized error, just no
  // toast — for best-effort fetches whose failure the UI already absorbs.
  if (!opts?.silent) toast.error(e.message, { id: `api:${e.code}` });
  if (e.status === 401) handleUnauthorized();
  return e;
}
