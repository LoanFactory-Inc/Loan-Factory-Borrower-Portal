import { apiClient, IApiResponse } from "@/repository/axios";
import i18n from "@/i18n";
import {
  IAdminProfile,
  IConfigurationApiResponse,
  IConfigurationRequest,
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
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

export { login, register, getConfiguration, getCurrentAdmin };
