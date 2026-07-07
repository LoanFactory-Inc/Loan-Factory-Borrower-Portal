import { EnableStatus } from "@/lib/enums";

// tera-be: POST /public/api/v1/auth/login – CreateTokenRequest
export interface ILoginRequest {
  username: string;
  password: string;
}

export interface IRegisterRequest {
  email_id: string;
  password: string;
  user_name: string;
}

// tera-be AuthSuccessResponse. MFA (AuthMfaRequiredResponse) chưa xử lý ở luồng này.
// Body có dạng { payload: {...}, response_date: {...} }.
export interface IAuthTokens {
  access_token: string;
  refresh_token: string;
  /** TTL (giây) của access_token */
  expires_time: number;
}

export interface ILoginResponse {
  payload: IAuthTokens;
  response_date?: {
    timestamp: number;
    formatted: string;
    zone: string;
  };
}

export interface ILicenseApp {
  id: string;
  name: string;
  description?: string;
  permission?: number;
}

export type ILicenseMap = Record<string, ILicenseApp>;

export interface IPermissionItem {
  description: string;
  permission: number;
  is_main_only: boolean;
}

export type IPermissionValue = Record<string, IPermissionItem>;
export type IPermissionMap = Record<string, string[]>;
export type IPermissionDescription = Record<string, string>;

export interface ILlmProviderInfo {
  name: string;
  api_base?: string;
  default_model?: string;
  agent_type: string;
  dynamic_region: number;
  chat_path: string;
}

export type ILlmProviderMap = Record<string, ILlmProviderInfo>;

export interface IOauthProviderInfo {
  is_default_for_customer?: boolean;
  display_name?: string;
  [key: string]: unknown;
}

export type IOauthProviderMap = Record<string, IOauthProviderInfo>;

export interface IConfigurationResponse {
  have_account_admin: boolean;
  license_map?: ILicenseMap;
  permission_value?: IPermissionValue;
  permission_map?: IPermissionMap;
  permission_description?: IPermissionDescription;
  llm_provider_map?: ILlmProviderMap;
  oauth_provider_map?: IOauthProviderMap;
  default_oauth_provider?: string;
}

/**
 * The configuration payload may arrive either spread at the top level or nested
 * under `message`, so expose both shapes.
 */
export type IConfigurationApiResponse = {
  status: number;
  message: IConfigurationResponse | string;
} & IConfigurationResponse;

export interface IConfigurationRequest {
  is_full: number;
  need_admin_counter: number;
}

export interface IAdminProfile {
  user_name: string;
  email_id: string;
  password_hash: string;
  created_at: number;
  updated_at: number;
  enable_status: EnableStatus;
  role: number;
  role_permission_number: number;
  menu_permission: number;
  role_name: string;
  api_token: string;
  creator_id: string;
  is_main_domain?: boolean;
}
