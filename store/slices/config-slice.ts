import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type {
  ILicenseMap,
  ILlmProviderMap,
  IOauthProviderMap,
  IPermissionDescription,
  IPermissionMap,
  IPermissionValue,
} from "@/app/login/services/types";

export interface ConfigState {
  haveAccountAdmin: boolean;
  licenses: ILicenseMap;
  permissionValue: IPermissionValue;
  permissionMap: IPermissionMap;
  permissionDescription: IPermissionDescription;
  llmProviderMap: ILlmProviderMap;
  oauthProviderMap: IOauthProviderMap;
  defaultOauthProvider: string;
}

const initialState: ConfigState = {
  haveAccountAdmin: false,
  licenses: {},
  permissionValue: {},
  permissionMap: {},
  permissionDescription: {},
  llmProviderMap: {},
  oauthProviderMap: {},
  defaultOauthProvider: "",
};

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setHaveAccountAdmin: (state, action: PayloadAction<boolean>) => {
      state.haveAccountAdmin = action.payload;
    },
    setLicenses: (state, action: PayloadAction<ILicenseMap>) => {
      state.licenses = action.payload;
    },
    setLlmProviderMap: (state, action: PayloadAction<ILlmProviderMap>) => {
      state.llmProviderMap = action.payload;
    },
    setOauthProviderMap: (state, action: PayloadAction<IOauthProviderMap>) => {
      state.oauthProviderMap = action.payload;
    },
    setDefaultOauthProvider: (state, action: PayloadAction<string>) => {
      state.defaultOauthProvider = action.payload;
    },
    setPermissions: (
      state,
      action: PayloadAction<{
        permissionValue: IPermissionValue;
        permissionMap: IPermissionMap;
        permissionDescription: IPermissionDescription;
      }>,
    ) => {
      state.permissionValue = action.payload.permissionValue;
      state.permissionMap = action.payload.permissionMap;
      state.permissionDescription = action.payload.permissionDescription;
    },
  },
});

export const {
  setHaveAccountAdmin,
  setLicenses,
  setLlmProviderMap,
  setOauthProviderMap,
  setDefaultOauthProvider,
  setPermissions,
} = configSlice.actions;
export default configSlice.reducer;
