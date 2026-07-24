import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { IAdminProfile, MyProfileResponse } from "@/app/login/services/types";

export interface AuthState {
  apiToken: string | null;
  refreshToken: string | null;
  profile: IAdminProfile | null;
  /** The current user from tera-be `GET /profiles/me` — canonical identity. */
  currentUser: MyProfileResponse | null;
}

const initialState: AuthState = {
  apiToken: null,
  refreshToken: null,
  profile: null,
  currentUser: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setApiToken: (state, action: PayloadAction<string>) => {
      state.apiToken = action.payload;
    },
    // Store the full token pair returned by login / token-refresh.
    setAuthTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string | null }>,
    ) => {
      state.apiToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setProfile: (state, action: PayloadAction<IAdminProfile>) => {
      state.profile = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<MyProfileResponse | null>) => {
      state.currentUser = action.payload;
    },
    clearAuth: (state) => {
      state.apiToken = null;
      state.refreshToken = null;
      state.profile = null;
      state.currentUser = null;
    },
  },
});

export const { setApiToken, setAuthTokens, setProfile, setCurrentUser, clearAuth } =
  authSlice.actions;
export default authSlice.reducer;
