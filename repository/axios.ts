import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { toast } from "sonner";

import { store } from "@/store";
import i18n from "@/i18n";

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

instance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.apiToken;
    if (token) {
      config.headers["X-Admin-Token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export type ApiRequestConfig = AxiosRequestConfig & {
  /** Toast message hiển thị khi request thành công (status === 0). */
  successMessage?: string;
};

instance.interceptors.response.use(
  (response) => {
    const successMessage = (response.config as ApiRequestConfig)?.successMessage;
    if (isApiError(response.data)) {
      toast.error(extractMessage(response.data) ?? i18n.t("toast.somethingWentWrong"));
    } else if (successMessage) {
      toast.success(successMessage);
    }
    return response.data;
  },
  (error) => {
    toast.error(
      extractMessage(error?.response?.data) ?? error?.message ?? i18n.t("toast.requestFailed"),
    );
    return Promise.reject(error);
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
