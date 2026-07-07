import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  type ApplicationData,
  type Asset,
  type Employment,
  type Liability,
  type LoanPurpose,
  type OtherIncome,
  type PersonalInfo,
  type RealEstate,
} from "@/app/application/types";

export type LoanApplicationStatus = "in_progress" | "submitted";

/**
 * Full form state for one application, persisted so the borrower can reopen a
 * loan from "My loans" and land back in the flow with every field pre-filled.
 */
export interface ApplicationSnapshot {
  purpose: LoanPurpose;
  data: ApplicationData;
  coData: PersonalInfo;
  employments: Employment[];
  coEmployments: Employment[];
  otherIncome: OtherIncome[];
  coOtherIncome: OtherIncome[];
  assets: Asset[];
  realEstate: RealEstate[];
  liabilities: Liability[];
}

export interface LoanApplication {
  /** Reference id, e.g. "TR-84920". */
  id: string;
  purpose: LoanPurpose;
  propertyAddress: string;
  loanType: string;
  /** Raw loan amount as entered (unformatted digits), for display on the card. */
  loanAmount: string;
  loanTerm: string;
  status: LoanApplicationStatus;
  /** Completion percent 0–100. */
  progress: number;
  /** Label of the next section to complete. */
  nextSection: string;
  /** ISO timestamp of the last submit/save. */
  submittedAt: string;
  /** Full form data, used to re-populate the flow in edit mode. */
  form: ApplicationSnapshot;
}

export interface ApplicationState {
  applications: LoanApplication[];
}

// Start with no loans so the borrower walks the flow from scratch; a submitted
// application is what populates "My loans".
const initialState: ApplicationState = {
  applications: [],
};

const applicationSlice = createSlice({
  name: "application",
  initialState,
  reducers: {
    setApplications: (state, action: PayloadAction<LoanApplication[]>) => {
      state.applications = action.payload;
    },
    upsertApplication: (state, action: PayloadAction<LoanApplication>) => {
      const index = state.applications.findIndex((a) => a.id === action.payload.id);
      if (index >= 0) state.applications[index] = action.payload;
      else state.applications.push(action.payload);
    },
    clearApplications: (state) => {
      state.applications = [];
    },
  },
});

export const { setApplications, upsertApplication, clearApplications } = applicationSlice.actions;
export default applicationSlice.reducer;
