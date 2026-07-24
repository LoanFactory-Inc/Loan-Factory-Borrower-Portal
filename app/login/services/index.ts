import { apiClient, IApiResponse } from "@/repository/axios";
import i18n from "@/i18n";
import {
  IAdminProfile,
  IConfigurationApiResponse,
  IConfigurationRequest,
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
  MyProfileResponse,
} from "./types";

const ENDPOINTS = {
  login: "auth-svc/public/api/v1/auth/login",
  register: "/admin/register",
  configuration: "/configuration",
  current: "/admin/current",
};

const login = (body: ILoginRequest) => {
  return apiClient.post<ILoginResponse>(ENDPOINTS.login, body, {
    successMessage: i18n.t("toast.loginSuccess"),
  });
};

const register = (body: IRegisterRequest) => {
  const requestBody = {
    ...body,
    role: 0,
  };
  return apiClient.post<IApiResponse<ILoginResponse>>(ENDPOINTS.register, requestBody, {
    successMessage: i18n.t("toast.accountCreated"),
  });
};

const getConfiguration = () => {
  const request: IConfigurationRequest = {
    is_full: 1,
    need_admin_counter: 1,
  };
  return apiClient.get<IConfigurationApiResponse>(ENDPOINTS.configuration, {
    params: request,
  });
};

const getCurrentAdmin = () => {
  return apiClient.get<IApiResponse<unknown, IAdminProfile>>(ENDPOINTS.current);
};

/**
 * The current user (tera-be `GET /api/v1/profiles/me`), resolved from the auth
 * context. Returns the unwrapped profile, whose `user_id` scopes the borrower's
 * loans. Routed same-origin (→ tera-be :8088) by the axios interceptor.
 */
const getMe = () =>
  apiClient
    .get<{ payload: MyProfileResponse }>("tera-svc/api/v1/profiles/me")
    .then((r) => r.payload);

export { login, register, getConfiguration, getCurrentAdmin, getMe };
