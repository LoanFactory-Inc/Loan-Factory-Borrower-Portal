/** Form-state shapes for the loan application flow. */

/** Which product the borrower is applying for — set on the loan-purpose screen. */
export type LoanPurpose = "buy" | "refi";

export type PersonalInfo = {
  firstName: string;
  lastName: string;
  email: string;
  cellPhone: string;
  dob: string;
  maritalStatus: string;
  dependents: string;
  citizenship: string;
  ethnicity: string;
  race: string;
  gender: string;
};

export type ApplicationData = {
  addressLine1: string;
  unit: string;
  zip: string;
  city: string;
  state: string;
  propertyType: string;
  occupancy: string;
  loanType: string;
  loanTerm: string;
  /** Purchase-only: agreed sale price of the home. */
  purchasePrice: string;
  loanAmount: string;
  /** Refinance-only: borrower's estimate of the current home value. */
  homeValue: string;
  /** Refinance-only: approximate balance remaining on the current mortgage. */
  mortgageBalance: string;
  /** Refinance-only: rate on the current mortgage (optional). */
  mortgageRate: string;
  /** Refinance-only: is there a second lien (e.g. HELOC) on the property? */
  hasSecondLien: boolean | null;
  /** Refinance-only: credit limit of the HELOC / second lien. */
  helocLimit: string;
  /** Refinance-only: roll the second lien into the new loan? */
  combineIntoNewLoan: boolean;
  hasCoBorrower: boolean | null;
  ownsRealEstate: boolean | null;
} & PersonalInfo;

export type Employment = {
  employer: string;
  position: string;
  status: string;
  country: string;
  companyAddress: string;
  aptUnit: string;
  zip: string;
  startDate: string;
  endDate: string;
  monthlyIncome: string;
  current: boolean;
  /** Employed by a party to the transaction (family, seller, agent, etc.). */
  related: boolean;
  /** Income earned through a foreign entity and paid in foreign currency. */
  foreign: boolean;
};

/** A supplemental income stream (second job, rental, retirement, etc.). */
export type OtherIncome = {
  source: string;
  amount: string;
};

export type Asset = { assetType: string; institution: string; balance: string };

export type RealEstate = {
  address: string;
  value: string;
  mortgageBalance: string;
  reStatus: string;
};

export type Liability = {
  liabType: string;
  creditor: string;
  balance: string;
  payment: string;
};

export type ScreenId =
  | "subjectProperty"
  | "loanDetails"
  | "personal"
  | "employment"
  | "demographic"
  | "assets"
  | "liabilities"
  | "documents"
  | "review";

export type Role = "primary" | "co";

export type Page = {
  group: number;
  screen: ScreenId;
  role?: Role;
  sub?: string;
};

export const BLANK_PERSONAL: PersonalInfo = {
  firstName: "",
  lastName: "",
  email: "",
  cellPhone: "",
  dob: "",
  maritalStatus: "",
  dependents: "",
  citizenship: "",
  ethnicity: "",
  race: "",
  gender: "",
};

export const BLANK_EMPLOYMENT: Employment = {
  employer: "",
  position: "",
  status: "Employed (Permanent, Temporary) - W-2",
  country: "United States",
  companyAddress: "",
  aptUnit: "",
  zip: "",
  startDate: "",
  endDate: "",
  monthlyIncome: "",
  current: false,
  related: false,
  foreign: false,
};

export const BLANK_OTHER_INCOME: OtherIncome = {
  source: "",
  amount: "",
};
