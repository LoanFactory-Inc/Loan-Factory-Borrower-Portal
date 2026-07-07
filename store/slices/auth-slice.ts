import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { IAdminProfile } from "@/app/login/services/types";

export interface AuthState {
  apiToken: string | null;
  profile: IAdminProfile | null;
}

const initialState: AuthState = {
  apiToken: null,
  profile: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setApiToken: (state, action: PayloadAction<string>) => {
      state.apiToken = action.payload;
    },
    setProfile: (state, action: PayloadAction<IAdminProfile>) => {
      state.profile = action.payload;
    },
    clearAuth: (state) => {
      state.apiToken = null;
      state.profile = null;
    },
  },
});

export const { setApiToken, setProfile, clearAuth } = authSlice.actions;
export default authSlice.reducer;
