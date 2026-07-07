/** Static option lists & section metadata for the loan application flow. */

export type Option = { value: string; label: string };

const toOptions = (values: string[]): Option[] =>
  values.map((value) => ({ value, label: value }));

export const PROPERTY_TYPES: Option[] = [
  { value: "SingleFamily", label: "Single family" },
  { value: "Condo", label: "Condo" },
  { value: "Townhouse", label: "Townhouse" },
  { value: "MultiFamily", label: "Multi-family (2–4 units)" },
  { value: "Manufactured", label: "Manufactured / mobile" },
  { value: "Cooperative", label: "Cooperative" },
];

export const OCCUPANCY: Option[] = [
  { value: "PrimaryResidence", label: "Owner occupied" },
  { value: "SecondHome", label: "Second home" },
  { value: "Investment", label: "Investment" },
];

export const STATES = [
  "CA", "TX", "FL", "NY", "WA", "AZ", "NV", "CO", "GA", "NC",
  "IL", "OH", "PA", "VA", "NJ", "MA", "OR", "UT", "TN", "MD",
];

export const MARITAL = ["Married", "Unmarried", "Separated"];
export const CITIZEN = ["U.S. citizen", "Permanent resident", "Non-permanent resident"];
export const LOAN_TYPES = ["Conventional", "FHA", "VA", "USDA", "Jumbo"];
export const LOAN_TERMS = [
  "30-year fixed", "20-year fixed", "15-year fixed", "10-year fixed", "5/1 ARM", "7/1 ARM",
];
export const ASSET_TYPES = [
  "Checking account", "Savings account", "Money market", "Retirement (401k / IRA)", "Brokerage", "Gift funds",
];
export const LIAB_TYPES = [
  "Credit card", "Auto loan", "Student loan", "Personal loan", "Installment loan", "Other",
];
export const RE_STATUS = ["Retained", "Pending sale", "Sold"];
export const EMPLOYMENT_STATUSES = [
  "Employed (Permanent, Temporary) - W-2",
  "Employed (Contract) - 1099",
  "Self-Employed - 1099",
  "Employed (Military service) - W-2",
];
export const COUNTRIES = ["United States", "Canada", "Mexico", "Other"];
export const INCOME_SOURCES = [
  "Freelance / self-employment (1099)",
  "Second job",
  "Rental income",
  "Investment / dividends",
  "Retirement / pension",
  "Social Security",
  "Alimony / child support",
  "Other",
];
export const ETHNICITY = ["Hispanic or Latino", "Not Hispanic or Latino", "I do not wish to provide"];
export const RACE = [
  "American Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Native Hawaiian or Pacific Islander",
  "White",
  "I do not wish to provide",
];
export const GENDER = ["Female", "Male", "I do not wish to provide"];

export const STATE_OPTIONS = toOptions(STATES);
export const MARITAL_OPTIONS = toOptions(MARITAL);
export const CITIZEN_OPTIONS = toOptions(CITIZEN);
export const LOAN_TYPE_OPTIONS = toOptions(LOAN_TYPES);
export const LOAN_TERM_OPTIONS = toOptions(LOAN_TERMS);
export const ASSET_TYPE_OPTIONS = toOptions(ASSET_TYPES);
export const LIAB_TYPE_OPTIONS = toOptions(LIAB_TYPES);
export const RE_STATUS_OPTIONS = toOptions(RE_STATUS);
export const EMPLOYMENT_STATUS_OPTIONS = toOptions(EMPLOYMENT_STATUSES);
export const COUNTRY_OPTIONS = toOptions(COUNTRIES);
export const INCOME_SOURCE_OPTIONS = toOptions(INCOME_SOURCES);

export type DocDef = { key: string; label: string; desc: string; required: boolean };

export const DOC_DEFS: DocDef[] = [
  { key: "id", label: "Government-issued ID", desc: "Driver’s license or passport", required: true },
  { key: "paystubs", label: "Recent pay stubs", desc: "Covering the last 30 days", required: true },
  { key: "w2", label: "W-2s or 1099s", desc: "From the past two years", required: true },
  { key: "bank", label: "Bank statements", desc: "Last two months, all pages", required: true },
  { key: "taxreturns", label: "Tax returns", desc: "Past two years, if self-employed", required: false },
];

export type AddressSuggestion = { line1: string; city: string; state: string; zip: string };

export const ADDRESS_SUGGESTIONS: AddressSuggestion[] = [
  { line1: "1420 Maple Grove Ave", city: "Austin", state: "TX", zip: "78704" },
  { line1: "88 Larkspur Lane", city: "San Jose", state: "CA", zip: "95126" },
  { line1: "305 Beacon Hill Rd", city: "Denver", state: "CO", zip: "80211" },
];

export type Group = { key: string; label: string; meta: string };

export const GROUPS: Group[] = [
  { key: "loanInfo", label: "Loan info", meta: "Property & terms" },
  { key: "borrowerInfo", label: "Borrower info", meta: "About you" },
  { key: "realEstateAssets", label: "Real estate & assets", meta: "What you own" },
  { key: "liabilities", label: "Liabilities", meta: "Debts you carry" },
];
