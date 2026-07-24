import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";

import { store } from "@/store";
import i18n from "@/i18n";
import { setAuthTokens } from "@/store/slices/auth-slice";
import { setAuthCookie } from "@/store/auth-token";
import { appErrorFromBody, hasEnvelopeError, showApiError } from "./api-error";

function extractMessage(data: unknown): string | undefined {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.display_message === "string" && d.display_message) return d.display_message;
    if (typeof d.message === "string" && d.message) return d.message;
  }
  return undefined;
}

function isApiError(data: unknown): boolean {
  return (
    !!data &&
    typeof data === "object" &&
    typeof (data as { status?: unknown }).status === "number" &&
    (data as { status: number }).status !== 0
  );
}

export type IApiResponse<TPayload = unknown, TMessage = string> = {
  status: number;
  message: TMessage;
} & TPayload;

export interface IPaginatedList<T> {
  list: T[];
  total: number;
}

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/v9/hpi/";

const defaultConfig: AxiosRequestConfig = {
  baseURL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
};

const instance: AxiosInstance = axios.create(defaultConfig);

const REFRESH_ENDPOINT = "auth-svc/public/api/v1/auth/token/refresh";

// A single in-flight refresh shared by every request that hits 401 at once, so
// a burst of concurrent 401s triggers exactly one token exchange.
let refreshPromise: Promise<string | null> | null = null;

/**
 * Exchange the stored refresh_token for a new access/refresh pair and persist
 * it. Uses a bare axios call (not `instance`) so it bypasses the interceptors —
 * no recursion, and its own failure is handled here rather than toasted.
 * Resolves to the new access token, or null when refresh isn't possible.
 */
async function refreshAccessToken(): Promise<string | null> {
  const token = store.getState().auth.refreshToken;
  if (!token) return null;
  try {
    const res = await axios.post(
      REFRESH_ENDPOINT,
      { token },
      {
        baseURL,
        timeout: 15_000,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      },
    );
    const payload = (res.data as { payload?: { access_token?: string; refresh_token?: string } })
      ?.payload;
    const accessToken = payload?.access_token;
    if (!accessToken) return null;
    store.dispatch(
      setAuthTokens({ accessToken, refreshToken: payload?.refresh_token ?? token }),
    );
    setAuthCookie(accessToken);
    return accessToken;
  } catch {
    return null;
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The acting user's id from the login JWT. tera-be (LOS) runs outside the
 * gateway's network in local dev, so its calls bypass the gateway (which can't
 * reach it — 503) and go same-origin through the Next `/tera-svc` rewrite to
 * :8088. That bypass skips the gateway's identity injection, so we send the
 * real logged-in user's id as `X-User-ID` — decoded here, never hardcoded.
 */
function userIdFromToken(token: string): string | undefined {
  const part = token.split(".")[1];
  if (!part || typeof atob === "undefined") return undefined;
  try {
    const payload = JSON.parse(
      decodeURIComponent(
        atob(part.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join(""),
      ),
    ) as Record<string, unknown>;
    const ids = ["user_id", "userId", "uid", "sub", "id"]
      .map((k) => payload[k])
      .filter((v): v is string => typeof v === "string" && !!v);
    return ids.find((v) => UUID_RE.test(v)) ?? ids[0];
  } catch {
    return undefined;
  }
}

instance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.apiToken;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    // Route tera-be (LOS) calls same-origin (Next /tera-svc rewrite → :8088),
    // bypassing the gateway, and carry the logged-in identity as X-User-ID.
    const url = config.url ?? "";
    if (url.startsWith("tera-svc/") || url.startsWith("/tera-svc/")) {
      config.baseURL = "";
      config.url = url.startsWith("/") ? url : `/${url}`;
      // Prefer the canonical id from GET /profiles/me once resolved; until then
      // (e.g. the /me call itself) fall back to the id decoded from the token.
      const uid =
        store.getState().auth.currentUser?.user_id ??
        (token ? userIdFromToken(token) : undefined);
      if (uid) config.headers["X-User-ID"] = uid;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export type ApiRequestConfig = AxiosRequestConfig & {
  successMessage?: string;
  /** Suppress the error toast for this request (best-effort fetches whose
   * failure the UI already handles). The error is still normalized and rejected. */
  skipErrorToast?: boolean;
};

instance.interceptors.response.use(
  (response) => {
    const data = response.data;
    // tera-core envelope: a non-null `error` even on a 2xx is a real failure —
    // reject (with a toast) so callers reading `.payload` don't consume a bad body.
    if (hasEnvelopeError(data)) {
      const silent = (response.config as ApiRequestConfig)?.skipErrorToast;
      return Promise.reject(showApiError(appErrorFromBody(data, response.status, "api"), { silent }));
    }
    // Legacy admin envelope: success is `status === 0`; anything else is an error
    // the caller still inspects (e.g. login), so toast but return the body.
    if (isApiError(data)) {
      toast.error(extractMessage(data) ?? i18n.t("toast.somethingWentWrong"));
    } else {
      const successMessage = (response.config as ApiRequestConfig)?.successMessage;
      if (successMessage) toast.success(successMessage);
    }
    return data;
  },
  // Transport + HTTP failures: normalize, toast the real backend message
  // (deduped), handle 401, and reject with the richer AppError.
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    // On 401, try a one-time silent token refresh and replay the request before
    // giving up. Skip the auth endpoints themselves and already-retried requests
    // to avoid loops; skip entirely when there's no refresh token to spend.
    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/") &&
      store.getState().auth.refreshToken
    ) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return instance(original);
      }
    }

    return Promise.reject(showApiError(error, { silent: (original as ApiRequestConfig)?.skipErrorToast }));
  },
);

export const apiClient = {
  get: <T>(url: string, config?: ApiRequestConfig) => instance.get<T, T>(url, config),
  post: <T, D = unknown>(url: string, data?: D, config?: ApiRequestConfig) =>
    instance.post<T, T, D>(url, data, config),
  put: <T, D = unknown>(url: string, data?: D, config?: ApiRequestConfig) =>
    instance.put<T, T, D>(url, data, config),
  patch: <T, D = unknown>(url: string, data?: D, config?: ApiRequestConfig) =>
    instance.patch<T, T, D>(url, data, config),
  delete: <T>(url: string, config?: ApiRequestConfig) => instance.delete<T, T>(url, config),
};
