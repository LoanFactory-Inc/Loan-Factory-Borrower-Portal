"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  CheckIcon,
  InfoIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  MapPinIcon,
} from "lucide-react";

import { cn, formatUsPhone, groupDigits } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { stepSchema, V } from "./schema";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setApplications,
  upsertApplication,
  type ApplicationSnapshot,
  type LoanApplication,
} from "@/store/slices/application-slice";
import {
  submitApplicationToBackend,
  toApplicationRequest,
  toAssetRequest,
  toBackendPurpose,
  toBorrowerUpdate,
  toDemographicsRequest,
  toEmploymentRequest,
  toLiabilityRequest,
  toOtherIncomeRequest,
} from "./services/mapper";
import * as applicationApi from "./services/borrower-application";
import type { Application1003Response, LoanSummaryResponse } from "./services/types";

import { AppFooterPortal } from "@/components/layouts/app-footer-portal";
import { ApplicationHeader } from "@/components/layouts/app-header";
import { ProgressRail, type RailStep } from "./components/progress-rail";
import { sectionsDone as computeSectionsDone } from "./sections";
import {
  ChoiceButton,
  DateField,
  FieldError,
  FieldLabel,
  MoneyField,
  Pill,
  RadioCard,
  SelectField,
  TextField,
} from "@/components/form-primitives";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import {
  ADDRESS_SUGGESTIONS,
  ASSET_TYPE_OPTIONS,
  CITIZEN_OPTIONS,
  COUNTRY_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  ETHNICITY,
  GENDER,
  GROUPS,
  INCOME_SOURCE_OPTIONS,
  LIAB_TYPE_OPTIONS,
  LOAN_TERM_OPTIONS,
  LOAN_TYPE_OPTIONS,
  MARITAL_OPTIONS,
  OCCUPANCY,
  PROPERTY_TYPES,
  RACE,
  RE_STATUS_OPTIONS,
  STATE_OPTIONS,
  type Option,
} from "./constants";
import {
  BLANK_EMPLOYMENT,
  BLANK_OTHER_INCOME,
  BLANK_PERSONAL,
  type ApplicationData,
  type Asset,
  type Employment,
  type Liability,
  type LoanPurpose,
  type OtherIncome,
  type Page,
  type PersonalInfo,
  type RealEstate,
} from "./types";

/** A backend transaction id is a UUID; a locally-created loan id is `TR-#####`. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ISO "YYYY-MM-DD" → the form's "MM/DD/YYYY"; passes anything else through. */
const isoToUsDate = (iso: string): string => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : iso;
};

/** ISO "YYYY-MM-DD" → the form's "MM / YYYY" month input. */
const isoToMonthYear = (iso: string): string => {
  const m = iso.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[2]} / ${m[1]}` : iso;
};

/** tera-be MISMO asset-type codes → the wizard's labels (inverse of ASSET_TYPE_CODE). */
const ASSET_LABEL_FROM_CODE: Record<string, string> = {
  CheckingAccount: "Checking account",
  SavingsAccount: "Savings account",
  MoneyMarketFund: "Money market",
  RetirementFund: "Retirement (401k / IRA)",
  MutualFund: "Brokerage",
  Stock: "Brokerage",
  GiftOfCash: "Gift funds",
};

/** tera-be MISMO liability-type codes → the wizard's labels (inverse of
 *  LIABILITY_TYPE_CODE). The label→code map is lossy — Auto/Student/Personal all
 *  collapse to "Installment" — so a resumed row shows the generic label. */
const LIABILITY_LABEL_FROM_CODE: Record<string, string> = {
  Revolving: "Credit card",
  Installment: "Installment loan",
  Other: "Other",
};

/** tera-be employment-type codes → the wizard's status labels (inverse of EMPLOYMENT_TYPE_CODE). */
const EMPLOYMENT_STATUS_FROM_CODE: Record<string, string> = {
  EmployedByCompany: "Employed (Permanent, Temporary) - W-2",
  Contractor: "Employed (Contract) - 1099",
  SelfEmployed: "Self-Employed - 1099",
  Military: "Employed (Military service) - W-2",
};

/** ISO country codes → the wizard's country labels (inverse of COUNTRY_CODE). */
const COUNTRY_FROM_CODE: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  OTHER: "Other",
};

/** Small helper for managing an editable list of rows. */
function useList<T>(initial: T[]) {
  const [items, setItems] = React.useState<T[]>(initial);
  const update = (index: number, patch: Partial<T>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  const add = (blank: T) => setItems((prev) => [...prev, blank]);
  const remove = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));
  return { items, setItems, update, add, remove };
}

const money = (value: string, notProvided: string) =>
  value ? `$${String(value).replace(/[^0-9.,]/g, "")}` : notProvided;

/** Lenders require a 2-year work history. */
const REQUIRED_HISTORY_MONTHS = 24;

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Absolute month index for an "MM / YYYY" string, or null if unparseable. */
function monthIndex(mmYYYY: string): number | null {
  const m = mmYYYY?.match(/(\d{1,2})\s*\/\s*(\d{4})/);
  if (!m) return null;
  return Number(m[2]) * 12 + (Number(m[1]) - 1);
}

/** "MM / YYYY" → "Mon YYYY" for display; falls back to the raw value. */
function formatMonthYear(mmYYYY: string): string {
  const m = mmYYYY?.match(/(\d{1,2})\s*\/\s*(\d{4})/);
  if (!m) return mmYYYY ?? "";
  const month = MONTH_ABBR[Number(m[1]) - 1];
  return month ? `${month} ${m[2]}` : mmYYYY;
}

/**
 * Months a single job spans — a current job runs to today, a past job spans
 * start→end. 0 when the start date is missing/unparseable.
 */
function jobMonths(e: Employment): number {
  const start = monthIndex(e.startDate);
  if (start === null) return 0;
  const now = new Date();
  const nowIdx = now.getFullYear() * 12 + now.getMonth();
  const end = e.current ? nowIdx : (monthIndex(e.endDate) ?? nowIdx);
  return Math.max(0, end - start);
}

/**
 * Total months of verifiable work history across every job. Lenders want this
 * to add up to 2 years, whether from one job or several.
 */
function totalHistoryMonths(items: Employment[]): number {
  return items.reduce((sum, e) => sum + jobMonths(e), 0);
}

/** Compact coverage label, e.g. 14 → "1 yr 2 mo", 8 → "8 mo". */
function coverageLabel(months: number): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
  if (rem || !years) parts.push(`${rem} mo`);
  return parts.join(" ");
}

function ApplicationForm() {
  const { t } = useTranslation("application");
  /** Translate an option list's display labels, keyed by their stable value. */
  const tOptions = (options: readonly Option[], group: string): Option[] =>
    options.map((o) => ({ value: o.value, label: t(`options.${group}.${o.value}`) }));
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("mode") === "edit";
  // In edit mode we reopen a saved loan by its ?id= and re-populate the whole
  // flow from the snapshot Redux persisted at submit time.
  const editId = searchParams.get("id");
  const existing = useAppSelector((s) =>
    editId ? s.application.applications.find((a) => a.id === editId) : undefined,
  );
  const seed = isEdit ? existing?.form : undefined;
  // A stable id for this session: the edited loan's id, or a fresh reference for
  // a brand-new application.
  const [appId] = React.useState(
    () => editId ?? `TR-${Math.floor(10000 + Math.random() * 89999)}`,
  );
  // Which product this application is for. In edit mode it comes from the saved
  // snapshot; otherwise it's carried through in ?purpose= from the loan intake
  // modal and drives the purpose-specific loan detail fields.
  const purpose: LoanPurpose =
    seed?.purpose ?? (searchParams.get("purpose") === "refi" ? "refi" : "buy");
  const isRefi = purpose === "refi";
  // The landing register step creates the prospect (transaction + borrower
  // account) up front and hands off the id via ?tx=. When present, the submit
  // reuses that transaction instead of creating a second prospect.
  const seededTransactionId = searchParams.get("tx");
  // Seed the step from ?step= so a refresh keeps the borrower where they were
  // instead of dropping them back on the first screen.
  const stepParam = Number(searchParams.get("step"));
  const initialStep = Number.isInteger(stepParam) && stepParam > 0 ? stepParam : 0;
  const [pageIndex, setPageIndex] = React.useState(initialStep);
  // Furthest page the borrower has unlocked. You may jump back to any reached
  // step from the rail, but you can only move forward one big step at a time by
  // completing the current one (via "Continue", which validates first). Edit
  // mode arrives fully populated, so every step is already unlocked.
  const [maxReached, setMaxReached] = React.useState(() =>
    isEdit ? Number.MAX_SAFE_INTEGER : initialStep,
  );
  // An already-filled application (opened via edit, or resumed from a saved
  // backend prospect): every section is unlocked and shown complete, and the
  // borrower can jump to any step from the rail. Fresh applications unlock
  // step-by-step. Set on resume in ensureTransaction below.
  const [existingApp, setExistingApp] = React.useState(isEdit);
  const [autofillOpen, setAutofillOpen] = React.useState(false);
  // Whether list-screen errors (employment, assets, liabilities) have been
  // surfaced yet. Set on a failed "Continue"; the errors themselves are derived.
  const [listErrorsShown, setListErrorsShown] = React.useState(false);
  // tera-be transaction id for this application. Seeded from ?tx= (landing
  // created the prospect), otherwise filled once we create the application on
  // entry. Every per-step save is keyed by it.
  const [txId, setTxId] = React.useState<string | null>(
    // In edit mode the loan id IS the transaction id — but only when it's a real
    // backend tx (UUID); a locally-created loan (TR-#####) has no backend row.
    seededTransactionId ?? (isEdit && editId && UUID_RE.test(editId) ? editId : null),
  );
  const didInitBackend = React.useRef(false);

  const [data, setData] = React.useState<ApplicationData>(
    () =>
      seed?.data ?? {
        addressLine1: "",
        unit: "",
        zip: "",
        city: "",
        state: "",
        propertyType: "SingleFamily",
        occupancy: "",
        loanType: "Conventional",
        loanTerm: "",
        purchasePrice: "",
        loanAmount: "",
        homeValue: "",
        mortgageBalance: "",
        mortgageRate: "",
        hasSecondLien: null,
        helocLimit: "",
        combineIntoNewLoan: false,
        hasCoBorrower: null,
        ownsRealEstate: null,
        ...BLANK_PERSONAL,
      },
  );
  const [coData, setCoData] = React.useState<PersonalInfo>(() => seed?.coData ?? { ...BLANK_PERSONAL });

  // The signed-in borrower (tera-be GET /profiles/me), loaded once by AppShell.
  // Used to prefill the primary borrower's identity on a brand-new application.
  const currentUser = useAppSelector((s) => s.auth.currentUser);

  const employments = useList<Employment>(
    seed?.employments ?? [{ ...BLANK_EMPLOYMENT, current: true }],
  );
  const coEmployments = useList<Employment>(
    seed?.coEmployments ?? [{ ...BLANK_EMPLOYMENT, current: true }],
  );
  const otherIncome = useList<OtherIncome>(seed?.otherIncome ?? []);
  const coOtherIncome = useList<OtherIncome>(seed?.coOtherIncome ?? []);
  const assets = useList<Asset>(
    seed?.assets ?? [{ assetType: "Checking account", institution: "", balance: "" }],
  );
  const realEstate = useList<RealEstate>(seed?.realEstate ?? []);
  const liabilities = useList<Liability>(
    seed?.liabilities ?? [{ liabType: "Credit card", creditor: "", balance: "", payment: "" }],
  );

  // Dev-only flag — gates the per-step "Auto fill" button used while building
  // the flow. The fill handler itself lives below, once `screen`/`role` and the
  // active list helpers are in scope.
  const isDev = process.env.NODE_ENV !== "production";

  // ── Page model ────────────────────────────────────────────────
  const pages = React.useMemo<Page[]>(() => {
    const list: Page[] = [
      { group: 0, screen: "subjectProperty", sub: t("subs.subjectProperty") },
      { group: 0, screen: "loanDetails", sub: t("subs.loanDetails") },
      { group: 1, screen: "personal", role: "primary", sub: t("subs.personalDetails") },
      { group: 1, screen: "employment", role: "primary", sub: t("subs.employment") },
      { group: 1, screen: "demographic", role: "primary", sub: t("subs.demographicInfo") },
    ];
    if (data.hasCoBorrower === true) {
      // Labels stay short — the rail groups them under a "Co-borrower" heading.
      list.push({ group: 1, screen: "personal", role: "co", sub: t("subs.personalDetails") });
      list.push({ group: 1, screen: "employment", role: "co", sub: t("subs.employment") });
      list.push({ group: 1, screen: "demographic", role: "co", sub: t("subs.demographicInfo") });
    }
    list.push({ group: 2, screen: "assets", sub: t("subs.realEstateAssets") });
    list.push({ group: 3, screen: "liabilities", sub: t("subs.liabilities") });
    // No separate review step — the last section (liabilities) submits directly.
    return list;
  }, [data.hasCoBorrower, t]);

  const idx = Math.min(pageIndex, pages.length - 1);
  const current = pages[idx];
  const { screen, role } = current;
  const curGroup = current.group;
  const totalGroups = GROUPS.length;

  // ── Validation (react-hook-form + zod, one screen at a time) ──
  const isPrimary = role !== "co";

  // The active screen's schema, read lazily by the resolver at validation time.
  const stepSchemaRef = React.useRef(stepSchema(screen, isPrimary, purpose));
  React.useEffect(() => {
    stepSchemaRef.current = stepSchema(screen, isPrimary, purpose);
  }, [screen, isPrimary, purpose]);

  // Only the fields the current screen's schema cares about, mirrored into RHF.
  const stepValues = React.useMemo<Record<string, unknown>>(() => {
    switch (screen) {
      case "subjectProperty":
        return {
          addressLine1: data.addressLine1,
          zip: data.zip,
          city: data.city,
          state: data.state,
          propertyType: data.propertyType,
        };
      case "loanDetails": {
        const base = {
          loanAmount: data.loanAmount,
          loanType: data.loanType,
          occupancy: data.occupancy,
          loanTerm: data.loanTerm,
        };
        return isRefi
          ? { ...base, homeValue: data.homeValue }
          : { ...base, purchasePrice: data.purchasePrice };
      }
      case "personal": {
        const p = role === "co" ? coData : data;
        const base = {
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          cellPhone: p.cellPhone,
          dob: p.dob,
        };
        return isPrimary ? { ...base, hasCoBorrower: data.hasCoBorrower } : base;
      }
      case "demographic": {
        const p = role === "co" ? coData : data;
        return { ethnicity: p.ethnicity, race: p.race, gender: p.gender };
      }
      default:
        return {};
    }
  }, [screen, role, isPrimary, isRefi, data, coData]);

  const resolver = React.useMemo<Resolver<Record<string, unknown>>>(
    () => (values, context, options) =>
      (zodResolver(stepSchemaRef.current) as Resolver<Record<string, unknown>>)(
        values,
        context,
        options,
      ),
    [],
  );
  const form = useForm<Record<string, unknown>>({
    resolver,
    values: stepValues,
    mode: "onSubmit",
    // Our useState is the source of truth — always sync incoming values, but
    // keep any errors from the last failed attempt visible until re-validated.
    resetOptions: { keepErrors: true },
  });
  const err = (name: string): string | undefined => {
    const message = form.formState.errors[name]?.message;
    return typeof message === "string" ? t(message) : undefined;
  };
  /** Translated error for a list-screen field, keyed "prefix:index:field". */
  const lerr = (key: string): string | undefined =>
    listErrors[key] ? t(listErrors[key]) : undefined;

  // After a failed attempt, re-validate as the user edits so errors clear live.
  const showingErrors = Object.keys(form.formState.errors).length > 0;
  React.useEffect(() => {
    if (showingErrors) void form.trigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepValues]);

  const scrollTop = () => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goPage = (i: number, force = false) => {
    const n = Math.max(0, Math.min(i, pages.length - 1));
    // Block forward jumps to steps that haven't been unlocked yet — those must
    // be reached by completing the current step via "Continue" (force = true).
    if (!force && !existingApp && n > maxReached) return;
    if (force) setMaxReached((prev) => Math.max(prev, n));
    setPageIndex(n);
    setAutofillOpen(false);
    form.clearErrors();
    setListErrorsShown(false);
    // Reflect the step in the URL (preserving other params, e.g. mode=edit) so
    // it survives a refresh. history.replaceState keeps it shallow — no RSC
    // refetch and no reset of the in-progress form state.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("step", String(n));
      window.history.replaceState(null, "", `?${params.toString()}`);
    }
    scrollTop();
  };
  const firstOfGroup = (group: number) => pages.findIndex((p) => p.group === group);
  const goGroup = (group: number) => {
    const first = firstOfGroup(group);
    if (first >= 0) goPage(first);
  };

  const setField = <K extends keyof ApplicationData>(name: K, value: ApplicationData[K]) =>
    setData((prev) => ({ ...prev, [name]: value }));

  // active personal object (co-borrower screens read/write coData)
  const active: PersonalInfo | ApplicationData = role === "co" ? coData : data;
  const setActive = (name: keyof PersonalInfo, value: string) => {
    if (role === "co") setCoData((prev) => ({ ...prev, [name]: value }));
    else setField(name, value);
  };
  const activeEmployments = role === "co" ? coEmployments : employments;
  const activeOtherIncome = role === "co" ? coOtherIncome : otherIncome;

  // ── tera-be persistence (BorrowerLoanController) ──────────────
  // Snapshot of the whole form as it stands right now — the source for both
  // the per-step 1003 save and the final submit.
  const buildSnapshot = React.useCallback(
    (): ApplicationSnapshot => ({
      purpose,
      data,
      coData,
      employments: employments.items,
      coEmployments: coEmployments.items,
      otherIncome: otherIncome.items,
      coOtherIncome: coOtherIncome.items,
      assets: assets.items,
      realEstate: realEstate.items,
      liabilities: liabilities.items,
    }),
    [
      purpose,
      data,
      coData,
      employments.items,
      coEmployments.items,
      otherIncome.items,
      coOtherIncome.items,
      assets.items,
      realEstate.items,
      liabilities.items,
    ],
  );

  // Keep ?tx= in the URL so a reload resumes the same transaction (the created
  // prospect isn't returned by GET /applications until it converts to a loan).
  const reflectTxInUrl = (tx: string) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("tx", tx);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  // Prefill from the loan summary we can read back on reload.
  const hydrateFromSummary = (a: LoanSummaryResponse) => {
    if (a.loan_amount != null) setField("loanAmount", groupDigits(String(Math.round(a.loan_amount))));
  };

  // Repopulate the loan/property steps from the saved 1003 (resume/reload). The
  // inverse of `toApplicationRequest` — only the fields the 1003 persists. Null
  // fields are left as-is, so an empty (just-created) application is a no-op.
  const applyApplicationToForm = React.useCallback(
    (raw: Application1003Response) => {
      // This endpoint serializes camelCase (others are snake_case), so read both.
      const r = raw as unknown as Record<string, unknown>;
      const str = (snake: string, camel: string): string | undefined => {
        const v = r[snake] ?? r[camel];
        return typeof v === "string" && v ? v : undefined;
      };
      const num = (snake: string, camel: string): number | undefined => {
        const v = r[snake] ?? r[camel];
        return typeof v === "number" ? v : undefined;
      };
      const dollars = (n?: number) => (n != null ? groupDigits(String(Math.round(n))) : undefined);
      setData((prev) => {
        const next = { ...prev };
        const loanType = str("loan_type", "loanType");
        if (loanType) next.loanType = loanType;
        const occupancy = str("occupancy", "occupancy");
        if (occupancy) next.occupancy = occupancy;
        const propertyType = str("property_type", "propertyType");
        if (propertyType) next.propertyType = propertyType;
        const city = str("city", "city");
        if (city) next.city = city;
        const state = str("state", "state");
        if (state) next.state = state;
        const zip = str("zip", "zip");
        if (zip) next.zip = zip;
        const fullAddress = str("full_address", "fullAddress");
        if (fullAddress) next.addressLine1 = fullAddress.split(",")[0].trim();
        const amount = dollars(num("loan_amount", "loanAmount"));
        if (amount) next.loanAmount = amount;
        if (isRefi) {
          const hv = dollars(num("property_value", "propertyValue"));
          if (hv) next.homeValue = hv;
        } else {
          const pp = dollars(num("purchase_price", "purchasePrice") ?? num("property_value", "propertyValue"));
          if (pp) next.purchasePrice = pp;
        }
        // Only fixed terms round-trip cleanly (ARM years aren't stored).
        const years = num("amortization_years", "amortizationYears");
        if (years && str("amortization_type", "amortizationType") !== "ADJUSTABLE") {
          next.loanTerm = `${years}-year fixed`;
        }

        // Personal details come back nested under the main borrower.
        const borrowers = r["borrowers"];
        if (Array.isArray(borrowers) && borrowers.length) {
          const b = (borrowers.find(
            (x) => (x as Record<string, unknown>).isMainBorrower ?? (x as Record<string, unknown>).is_main_borrower,
          ) ?? borrowers[0]) as Record<string, unknown>;
          const bstr = (snake: string, camel: string): string | undefined => {
            const v = b[snake] ?? b[camel];
            return typeof v === "string" && v ? v : undefined;
          };
          const firstName = bstr("first_name", "firstName");
          if (firstName) next.firstName = firstName;
          const lastName = bstr("last_name", "lastName");
          if (lastName) next.lastName = lastName;
          const email = bstr("email", "email");
          if (email) next.email = email;
          const cell = bstr("cell_phone", "cellPhone");
          if (cell) next.cellPhone = formatUsPhone(cell);
          const marital = bstr("marital_status", "maritalStatus");
          if (marital) next.maritalStatus = marital;
          const citizenship = bstr("citizenship", "citizenship");
          if (citizenship) next.citizenship = citizenship;
          const birth = bstr("birth_date", "birthDate");
          if (birth) next.dob = isoToUsDate(birth);
          const dependents = b["dependents"];
          if (typeof dependents === "number") next.dependents = String(dependents);
        }
        return next;
      });
    },
    [isRefi],
  );

  // Repopulate the collection steps (employment / income / assets / liabilities /
  // demographics) from the saved sections on resume. Responses are camelCase.
  const applySectionsToForm = React.useCallback(
    (s: import("./services/borrower-application").ApplicationSections) => {
      const gstr = (o: Record<string, unknown>, ...keys: string[]): string | undefined => {
        for (const k of keys) {
          const v = o[k];
          if (typeof v === "string" && v) return v;
        }
        return undefined;
      };
      const gnum = (o: Record<string, unknown>, ...keys: string[]): number | undefined => {
        for (const k of keys) {
          const v = o[k];
          if (typeof v === "number") return v;
        }
        return undefined;
      };
      const gbool = (o: Record<string, unknown>, ...keys: string[]): boolean =>
        keys.some((k) => o[k] === true);
      const money = (n?: number) => (n != null ? groupDigits(String(Math.round(n))) : "");

      if (Array.isArray(s.employments) && s.employments.length) {
        employments.setItems(
          s.employments.map((e) => {
            const addr = (e.businessAddress ?? e.business_address) as Record<string, unknown> | undefined;
            const start = gstr(e, "startDate", "start_date");
            const end = gstr(e, "endDate", "end_date");
            const statusCode = gstr(e, "employmentType", "employment_type") ?? "";
            const countryCode = addr ? (gstr(addr, "country") ?? "") : "";
            return {
              ...BLANK_EMPLOYMENT,
              employer: gstr(e, "employerName", "employer_name") ?? "",
              position: gstr(e, "position") ?? "",
              status: EMPLOYMENT_STATUS_FROM_CODE[statusCode] ?? statusCode,
              current: gbool(e, "isActive", "is_active"),
              monthlyIncome: money(gnum(e, "incomeAmount", "income_amount")),
              startDate: start ? isoToMonthYear(start) : "",
              endDate: end ? isoToMonthYear(end) : "",
              companyAddress: addr ? (gstr(addr, "line1") ?? "") : "",
              aptUnit: addr ? (gstr(addr, "unit") ?? "") : "",
              zip: addr ? (gstr(addr, "postalCode", "postal_code") ?? "") : "",
              country: COUNTRY_FROM_CODE[countryCode] ?? countryCode,
              related: gbool(e, "isSpecialEmployerRelationship", "is_special_employer_relationship"),
              foreign: gbool(e, "isForeignIncome", "is_foreign_income"),
            };
          }),
        );
      }
      if (Array.isArray(s.otherIncomes) && s.otherIncomes.length) {
        otherIncome.setItems(
          s.otherIncomes.map((o) => ({
            ...BLANK_OTHER_INCOME,
            source: gstr(o, "incomeType", "income_type") ?? "",
            amount: money(gnum(o, "amount")),
          })),
        );
      }
      if (Array.isArray(s.assets) && s.assets.length) {
        assets.setItems(
          s.assets.map((a) => {
            const code = gstr(a, "assetType", "asset_type") ?? "";
            return {
              assetType: ASSET_LABEL_FROM_CODE[code] ?? code,
              institution: gstr(a, "financialInstitution", "financial_institution") ?? "",
              balance: money(gnum(a, "cashMarketValue", "cash_market_value")),
            };
          }),
        );
      }
      if (Array.isArray(s.liabilities) && s.liabilities.length) {
        liabilities.setItems(
          s.liabilities.map((l) => {
            const code = gstr(l, "liabilityType", "liability_type") ?? "";
            return {
              liabType: LIABILITY_LABEL_FROM_CODE[code] ?? code,
              creditor: gstr(l, "creditorName", "creditor_name") ?? "",
              balance: money(gnum(l, "unpaidBalance", "unpaid_balance")),
              payment: money(gnum(l, "monthlyPayment", "monthly_payment")),
            };
          }),
        );
      }
      const demo = s.demographics;
      if (demo) {
        const race = (demo.race ?? []) as unknown[];
        const gender = (demo.gender ?? []) as unknown[];
        setData((prev) => ({
          ...prev,
          ethnicity: gstr(demo, "ethnicity") ?? prev.ethnicity,
          race: typeof race[0] === "string" ? (race[0] as string) : prev.race,
          gender: typeof gender[0] === "string" ? (gender[0] as string) : prev.gender,
        }));
      }
    },
    // setItems / setData are stable; the useList wrappers are recreated each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Resolve the transaction id for this flow, creating the application the first
  // time it's needed. Shared by the mount effect and every step save through a
  // single in-flight promise, so we never create twice. Reuses an existing
  // prospect/loan when the borrower already has one (resume), else creates a
  // fresh prospect. Returns null only on failure (then retries next time).
  const txPromise = React.useRef<Promise<string | null> | null>(null);
  const ensureTransaction = React.useCallback((): Promise<string | null> => {
    if (txId) return Promise.resolve(txId);
    // Edit mode without a resolved backend tx (local-only loan) → nothing to save to.
    if (isEdit) return Promise.resolve(null);
    if (seededTransactionId) return Promise.resolve(seededTransactionId);
    if (!txPromise.current) {
      txPromise.current = (async () => {
        const rows = await applicationApi.listMyApplications();
        const existing = rows[0];
        if (existing) {
          hydrateFromSummary(existing);
          setExistingApp(true); // resumed a saved application → unlock all steps
          return existing.transaction_id;
        }
        const created = await applicationApi.createApplication({
          purpose: toBackendPurpose(purpose),
        });
        return created.transaction_id;
      })().catch(() => null); // toasted centrally; local state keeps the form usable
    }
    return txPromise.current.then((id) => {
      if (id) {
        setTxId(id);
        reflectTxInUrl(id);
      } else {
        txPromise.current = null; // allow a retry after a failure
      }
      return id;
    });
    // hydrateFromSummary / reflectTxInUrl close over stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, txId, seededTransactionId, purpose]);

  // On entry: resolve/create the application so it exists (and resumes on reload).
  React.useEffect(() => {
    if (isEdit || didInitBackend.current) return;
    didInitBackend.current = true;
    void ensureTransaction();
  }, [isEdit, ensureTransaction]);

  // Once we have a transaction id, pull the saved 1003 back into the form so
  // navigating steps / reloading shows what was persisted (once per flow).
  const hydratedRef = React.useRef(false);
  React.useEffect(() => {
    // Skip when a rich Redux snapshot already seeded the form (edit on this
    // device); otherwise pull the saved 1003 back — covers fresh resume, reload,
    // and editing a backend loan with no local snapshot.
    if (!txId || hydratedRef.current || seed) return;
    hydratedRef.current = true;
    applicationApi
      .getApplicationDetail(txId)
      .then(applyApplicationToForm)
      .catch(() => {
        /* toasted centrally; local state stays usable */
      });
    applicationApi
      .getApplicationSections(txId)
      .then(applySectionsToForm)
      .catch(() => {
        /* toasted centrally */
      });
  }, [txId, seed, applyApplicationToForm, applySectionsToForm]);

  // Prefill the primary borrower's identity from the signed-in user's profile
  // when starting a fresh application. Only fills fields still blank, so any
  // value loaded back from a saved 1003 (applyApplicationToForm above) or typed
  // by the borrower always wins — the profile is just the default seed. Skipped
  // in edit mode, where the snapshot already carries the borrower.
  const profileSeededRef = React.useRef(false);
  React.useEffect(() => {
    if (profileSeededRef.current || seed || !currentUser) return;
    profileSeededRef.current = true;
    setData((prev) => {
      const next = { ...prev };
      if (!next.firstName && currentUser.first_name) next.firstName = currentUser.first_name;
      if (!next.lastName && currentUser.last_name) next.lastName = currentUser.last_name;
      if (!next.email && currentUser.email) next.email = currentUser.email;
      if (!next.cellPhone && currentUser.phone) next.cellPhone = formatUsPhone(currentUser.phone);
      return next;
    });
  }, [currentUser, seed]);

  // Save the current step: PUT the cumulative 1003 by transaction id, ensuring
  // the transaction exists first so "Continue" always persists. Best-effort — a
  // failure is toasted centrally and never blocks navigation.
  const persistStep = async () => {
    const id = txId ?? (await ensureTransaction());
    if (!id) return;
    try {
      // The 1003 (loan + property) is cheap + cumulative — always keep it fresh.
      await applicationApi.saveApplicationStep(id, toApplicationRequest(buildSnapshot()));

      // Co-borrower sections are a follow-up (they need their own borrower id).
      if (role === "co") return;

      switch (screen) {
        case "personal":
          await applicationApi.saveBorrowerPersonal(id, toBorrowerUpdate(data));
          break;
        case "employment":
          await applicationApi.saveEmployments(
            id,
            employments.items.filter((e) => e.employer).map((e, i) => toEmploymentRequest(e, i)),
          );
          await applicationApi.saveOtherIncomes(
            id,
            otherIncome.items.filter((o) => o.source).map((o, i) => toOtherIncomeRequest(o, i)),
          );
          break;
        case "demographic":
          await applicationApi.saveDemographics(id, toDemographicsRequest(data));
          break;
        case "assets":
          await applicationApi.saveAssets(
            id,
            assets.items.filter((a) => a.assetType).map((a, i) => toAssetRequest(a, [], i)),
          );
          break;
        case "liabilities":
          await applicationApi.saveLiabilities(
            id,
            liabilities.items.filter((l) => l.liabType).map((l, i) => toLiabilityRequest(l, [], i)),
          );
          break;
      }
    } catch {
      // toasted by the axios interceptor
    }
  };

  // Dev-only: fill just the CURRENT step with valid demo data. Writes to the
  // active borrower (primary vs co-borrower) for the per-person screens.
  const autoFillStep = () => {
    switch (screen) {
      case "subjectProperty":
        setData((p) => ({
          ...p,
          addressLine1: "1600 Amphitheatre Pkwy",
          unit: "4B",
          zip: "94043",
          city: "Mountain View",
          state: "CA",
          propertyType: "SingleFamily",
        }));
        break;
      case "loanDetails":
        setData((p) => ({
          ...p,
          loanAmount: "520,000",
          loanType: "Conventional",
          occupancy: "PrimaryResidence",
          loanTerm: "30-year fixed",
          purchasePrice: "650,000",
          homeValue: "700,000",
          mortgageBalance: "300,000",
          mortgageRate: "6.5",
          hasSecondLien: false,
          combineIntoNewLoan: false,
        }));
        break;
      case "personal": {
        const info = {
          firstName: role === "co" ? "Jamie" : "Alex",
          lastName: "Vu",
          email: role === "co" ? "jamie.vu@email.com" : "alex.vu@email.com",
          cellPhone: "(415) 555-0142",
          dob: "01/15/1990",
          maritalStatus: "Married",
          dependents: "0",
          citizenship: "U.S. citizen",
        };
        if (role === "co") setCoData((p) => ({ ...p, ...info }));
        else setData((p) => ({ ...p, ...info, hasCoBorrower: false }));
        break;
      }
      case "employment":
        activeEmployments.setItems([
          {
            ...BLANK_EMPLOYMENT,
            current: true,
            employer: "Acme Corp",
            position: "Senior Engineer",
            companyAddress: "500 Market St",
            zip: "94103",
            startDate: "01/2018",
            monthlyIncome: "12,000",
          },
        ]);
        break;
      case "demographic": {
        const demo = { ethnicity: "Not Hispanic or Latino", race: "Asian", gender: "Male" };
        if (role === "co") setCoData((p) => ({ ...p, ...demo }));
        else setData((p) => ({ ...p, ...demo }));
        break;
      }
      case "assets":
        assets.setItems([{ assetType: "Checking account", institution: "Chase", balance: "45,000" }]);
        break;
      case "liabilities":
        liabilities.setItems([
          { liabType: "Credit card", creditor: "American Express", balance: "3,200", payment: "150" },
        ]);
        break;
    }
  };

  // Work-history coverage — summed across every job, toward the required 2 years.
  const coveredMonths = totalHistoryMonths(activeEmployments.items);
  const historyCovered = coveredMonths >= REQUIRED_HISTORY_MONTHS;
  const coveragePct = Math.min(100, Math.round((coveredMonths / REQUIRED_HISTORY_MONTHS) * 100));
  // "Add a previous job" only appears once the current job has a start date and
  // that span alone falls short of 2 years — while it's blank, or already spans
  // 2+ years on its own, no earlier jobs are prompted.
  const currentJob = activeEmployments.items.find((e) => e.current) ?? activeEmployments.items[0];
  const currentJobStarted = currentJob ? monthIndex(currentJob.startDate) !== null : false;
  const showAddPreviousJob = currentJobStarted && jobMonths(currentJob) < REQUIRED_HISTORY_MONTHS;

  // ── List-screen validation ────────────────────────────────────
  // Employment / assets / liabilities hold arrays of rows, so they can't ride
  // react-hook-form's single flat object. Validate them by hand into an error
  // map the row fields read back via lerr().
  const validateListScreen = (): Record<string, string> => {
    const e: Record<string, string> = {};
    const blank = (v: string) => !v || !v.trim();
    const notPositive = (v: string) => !(Number(String(v).replace(/[^0-9.]/g, "")) > 0);
    const badMonthYear = (v: string) => !/^\d{1,2}\s*\/\s*\d{4}$/.test(v.trim());

    if (screen === "employment") {
      activeEmployments.items.forEach((row, i) => {
        if (blank(row.employer)) e[`emp:${i}:employer`] = V.required;
        if (blank(row.startDate)) e[`emp:${i}:startDate`] = V.required;
        else if (badMonthYear(row.startDate)) e[`emp:${i}:startDate`] = V.date;
        if (blank(row.monthlyIncome)) e[`emp:${i}:monthlyIncome`] = V.required;
        else if (notPositive(row.monthlyIncome)) e[`emp:${i}:monthlyIncome`] = V.amount;
      });
      // Extra income rows are optional, but a partially filled row must be completed.
      activeOtherIncome.items.forEach((row, i) => {
        if (!blank(row.amount) && notPositive(row.amount)) e[`oi:${i}:amount`] = V.amount;
        if (!blank(row.source) && blank(row.amount)) e[`oi:${i}:amount`] = V.required;
        if (!blank(row.amount) && blank(row.source)) e[`oi:${i}:source`] = V.required;
      });
    }

    if (screen === "assets") {
      assets.items.forEach((row, i) => {
        if (blank(row.institution)) e[`asset:${i}:institution`] = V.required;
        if (blank(row.balance)) e[`asset:${i}:balance`] = V.required;
        else if (notPositive(row.balance)) e[`asset:${i}:balance`] = V.amount;
      });
      if (data.ownsRealEstate === null) e["ownsRealEstate"] = V.coBorrower;
      if (data.ownsRealEstate === true) {
        realEstate.items.forEach((row, i) => {
          if (blank(row.address)) e[`re:${i}:address`] = V.required;
          if (blank(row.value)) e[`re:${i}:value`] = V.required;
          else if (notPositive(row.value)) e[`re:${i}:value`] = V.amount;
        });
      }
    }

    if (screen === "liabilities") {
      liabilities.items.forEach((row, i) => {
        // An untouched row (no creditor/balance/payment) counts as "no debt" —
        // skip it so borrowers with no liabilities can still submit. Partially
        // filled rows are still validated.
        if (blank(row.creditor) && blank(row.balance) && blank(row.payment)) return;
        if (blank(row.creditor)) e[`liab:${i}:creditor`] = V.required;
        if (blank(row.balance)) e[`liab:${i}:balance`] = V.required;
        else if (notPositive(row.balance)) e[`liab:${i}:balance`] = V.amount;
        if (blank(row.payment)) e[`liab:${i}:payment`] = V.required;
        else if (notPositive(row.payment)) e[`liab:${i}:payment`] = V.amount;
      });
    }

    return e;
  };

  // Derived once surfaced: recomputes as the user edits, so errors clear live.
  const listErrors: Record<string, string> = listErrorsShown ? validateListScreen() : {};

  // ── Progress ──────────────────────────────────────────────────
  // A section counts as done only when its data is actually filled, so a
  // resumed/edited application that's still missing sections never reads as
  // 100%. Groups: 0 Your loan · 1 About you · 2 What you own · 3 What you owe.
  const hasText = (v?: string | null) => typeof v === "string" && v.trim().length > 0;
  const hasAmount = (v?: string | null) =>
    hasText(v) && Number(String(v).replace(/[^0-9.]/g, "")) > 0;

  // A step counts toward progress only once it's been *submitted* — completed
  // via "Continue" (which validates + persists), not merely typed into or
  // navigated to. `maxReached` only advances on a successful "Continue", so
  // `maxReached > i` means page i was submitted. Resumed/edited applications
  // (existingApp) arrive fully submitted, so every step already counts.
  const submitted = (pageIdx: number) => existingApp || maxReached > pageIdx;
  const lastPageOfGroup = (g: number) =>
    pages.reduce((last, p, i) => (p.group === g ? i : last), -1);
  const groupSubmitted = (g: number) => submitted(lastPageOfGroup(g));

  const g0Done =
    groupSubmitted(0) &&
    hasText(data.addressLine1) &&
    hasText(data.city) &&
    hasText(data.state) &&
    hasText(data.zip) &&
    hasText(data.propertyType) &&
    hasText(data.loanType) &&
    hasText(data.occupancy) &&
    hasText(data.loanTerm) &&
    hasAmount(data.loanAmount) &&
    (isRefi ? hasAmount(data.homeValue) : hasAmount(data.purchasePrice));

  const emp = employments.items[0];
  const g1Done =
    groupSubmitted(1) &&
    hasText(data.firstName) &&
    hasText(data.lastName) &&
    hasText(data.email) &&
    hasText(data.cellPhone) &&
    hasText(data.dob) &&
    hasText(data.ethnicity) &&
    hasText(data.race) &&
    hasText(data.gender) &&
    !!emp &&
    hasText(emp.employer) &&
    hasText(emp.startDate) &&
    hasAmount(emp.monthlyIncome) &&
    (data.hasCoBorrower !== true ||
      (hasText(coData.firstName) && hasText(coData.lastName) && hasText(coData.email)));

  const g2Done =
    groupSubmitted(2) && assets.items.some((a) => hasText(a.institution) && hasAmount(a.balance));

  const groupDone = computeSectionsDone({
    yourLoan: g0Done,
    aboutYou: g1Done,
    whatYouOwn: g2Done,
  });
  const sectionsDone = groupDone.filter(Boolean).length;
  const pct = Math.round((sectionsDone / totalGroups) * 100);

  // Per-sub-page completeness, so a filled sub-step (e.g. Personal details)
  // reads as done/green in the rail even while its parent group is still current.
  const empCo = coEmployments.items[0];
  const pageDone = (screen: string, role?: string): boolean => {
    switch (screen) {
      case "subjectProperty":
        return (
          hasText(data.addressLine1) &&
          hasText(data.city) &&
          hasText(data.state) &&
          hasText(data.zip) &&
          hasText(data.propertyType) &&
          hasText(data.occupancy)
        );
      case "loanDetails":
        return (
          hasText(data.loanType) &&
          hasText(data.loanTerm) &&
          hasAmount(data.loanAmount) &&
          (isRefi ? hasAmount(data.homeValue) : hasAmount(data.purchasePrice))
        );
      case "personal":
        return role === "co"
          ? hasText(coData.firstName) && hasText(coData.lastName) && hasText(coData.email)
          : hasText(data.firstName) &&
              hasText(data.lastName) &&
              hasText(data.email) &&
              hasText(data.cellPhone) &&
              hasText(data.dob);
      case "employment": {
        const e = role === "co" ? empCo : emp;
        return !!e && hasText(e.employer) && hasText(e.startDate) && hasAmount(e.monthlyIncome);
      }
      case "demographic": {
        const d = role === "co" ? coData : data;
        return hasText(d.ethnicity) && hasText(d.race) && hasText(d.gender);
      }
      case "assets":
        return assets.items.some((a) => hasText(a.institution) && hasAmount(a.balance));
      default:
        return false;
    }
  };

  const railSteps: RailStep[] = GROUPS.map((_, g) => {
    const status: RailStep["status"] =
      curGroup === g ? "current" : groupDone[g] ? "done" : "todo";
    const groupPages = pages.map((p, i) => ({ p, i })).filter((x) => x.p.group === g && x.p.sub);
    const toItem = (x: { p: Page; i: number }) => ({
      label: x.p.sub as string,
      active: x.i === idx,
      // Only a submitted (not merely filled) sub-page reads as done.
      done: submitted(x.i) && pageDone(x.p.screen, x.p.role),
      pageIndex: x.i,
    });
    // With a co-borrower, split Borrower info into "You" / "Co-borrower" groups.
    const hasCo = groupPages.some((x) => x.p.role === "co");
    const subGroups = hasCo
      ? [
          {
            heading: t("rail.you"),
            items: groupPages.filter((x) => x.p.role === "primary").map(toItem),
          },
          {
            heading: t("rail.coBorrower"),
            items: groupPages.filter((x) => x.p.role === "co").map(toItem),
          },
        ]
      : [{ heading: null, items: groupPages.map(toItem) }];
    return { group: g, status, subGroups };
  });

  // ── Copy ──────────────────────────────────────────────────────
  const isCo = role === "co";

  // The final section submits straight away — there is no review screen.
  const isLastPage = idx === pages.length - 1;
  const continueLabel = isLastPage
    ? isEdit
      ? t("actions.saveChanges")
      : t("actions.submitApplication")
    : t("actions.continue");

  const onContinue = async () => {
    // Validate the current screen; block navigation while it's invalid. Scalar
    // screens ride react-hook-form; list screens use the manual validator.
    stepSchemaRef.current = stepSchema(screen, isPrimary, purpose);
    const rhfValid = await form.trigger();
    const listIssues = validateListScreen();
    setListErrorsShown(true);
    if (!rhfValid || Object.keys(listIssues).length > 0) {
      scrollTop();
      return;
    }

    if (isLastPage) {
      const propertyAddress = data.addressLine1
        ? `${data.addressLine1}, ${data.city} ${data.state} ${data.zip}`.trim()
        : t("store.yourApplication");
      // Persist the full form so the borrower can reopen this loan from
      // "My loans" and land back in the flow with every field pre-filled.
      const snapshot: ApplicationSnapshot = {
        purpose,
        data,
        coData,
        employments: employments.items,
        coEmployments: coEmployments.items,
        otherIncome: otherIncome.items,
        coOtherIncome: coOtherIncome.items,
        assets: assets.items,
        realEstate: realEstate.items,
        liabilities: liabilities.items,
      };
      // Drive the tera-be borrower-apply flow (check-email → prospect → 1003
      // sub-resources → application-status). Best-effort: on failure the axios
      // interceptor has already toasted, and we fall back to the local id so
      // the borrower keeps their progress in "My loans".
      let backendId = appId;
      let backendProgress = 100;
      if (!isEdit) {
        try {
          const result = await submitApplicationToBackend(snapshot, txId ?? seededTransactionId);
          backendId = result.transactionId;
          backendProgress = result.progress || 100;
        } catch {
          // handled via toast in the axios interceptor
        }
      } else {
        // Edit mode skips the full submit flow above, and the last step
        // (liabilities) is the one screen whose "Continue" never fires
        // persistStep — so persist it here, otherwise the final section is
        // never sent and comes back empty.
        await persistStep();
      }

      const application: LoanApplication = {
        id: isEdit ? appId : backendId,
        purpose,
        propertyAddress,
        loanType: data.loanType,
        loanAmount: data.loanAmount,
        loanTerm: data.loanTerm,
        status: isEdit ? "in_progress" : "submitted",
        progress: backendProgress,
        nextSection: isEdit ? t("store.reviewYourChanges") : t("store.underReview"),
        submittedAt: new Date().toISOString(),
        form: snapshot,
      };
      // Only one loan is active at a time: a brand-new application replaces any
      // existing one, while an edit updates the loan in place.
      dispatch(isEdit ? upsertApplication(application) : setApplications([application]));
      // Done — land back on My loans, which now shows the submitted loan card
      // plus document collection, and fires a celebratory modal + confetti
      // based on this flag.
      router.push(`/my-loans?celebrate=${isEdit ? "edited" : "created"}`);
    } else {
      // Save this step's data (cumulative 1003) before advancing.
      await persistStep();
      goPage(idx + 1, true);
    }
  };

  return (
    <div className="flex h-svh flex-col bg-page">
      <ApplicationHeader />

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="mx-auto grid w-full max-w-295 grid-cols-1 items-start gap-8 px-4 sm:px-7 pt-9 pb-24 lg:grid-cols-[296px_1fr]">
          <div className="hidden lg:block lg:sticky lg:top-9 lg:self-start">
            <ProgressRail
              steps={railSteps}
              pct={pct}
              sectionsDone={sectionsDone}
              totalGroups={totalGroups}
              onGoGroup={goGroup}
              onGoPage={goPage}
            />
          </div>

          <main className="relative rounded-2xl border bg-card p-7 shadow-xs sm:px-11 sm:py-10">
            {/* Auto fill controls — top-right of the form card */}
            <div className="absolute top-8 right-8 z-20 flex items-center gap-2 sm:top-10 sm:right-10">
              {/* Subject property: suggested-address picker */}
              {screen === "subjectProperty" && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 rounded-md border-accent bg-accent px-4 text-[13px] text-accent-foreground hover:bg-accent/70"
                    onClick={() => setAutofillOpen((v) => !v)}
                  >
                    <SparklesIcon className="size-4" />
                    {t("autofill.button")}
                  </Button>
                  {autofillOpen && (
                    <div className="absolute top-12 right-0 w-80 rounded-xl border bg-popover p-2 shadow-lg">
                      <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                        {t("autofill.suggestedAddresses")}
                      </div>
                      {ADDRESS_SUGGESTIONS.map((a) => (
                        <button
                          key={a.line1}
                          type="button"
                          onClick={() => {
                            setData((prev) => ({
                              ...prev,
                              addressLine1: a.line1,
                              city: a.city,
                              state: a.state,
                              zip: a.zip,
                            }));
                            setAutofillOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted"
                        >
                          <MapPinIcon className="size-[18px] text-primary" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">{a.line1}</div>
                            <div className="text-[12.5px] text-muted-foreground">
                              {a.city}, {a.state} {a.zip}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Dev only: fill just this step. Subject property already has its
                  own autofill above, so skip it there (and on the review step). */}
              {isDev && screen !== "subjectProperty" && screen !== "review" && (
                <Button
                  variant="outline"
                  size="lg"
                  title="Fill this step with demo data (dev only)"
                  className="gap-2 rounded-md border-accent bg-accent px-4 text-[13px] text-accent-foreground hover:bg-accent/70"
                  onClick={autoFillStep}
                >
                  <SparklesIcon className="size-4" />
                  Auto fill
                </Button>
              )}
            </div>

            {/* ── Subject property ── */}
            {screen === "subjectProperty" && (
              <ScreenShell title={t("subjectProperty.title")} subtitle="">
                <div className="mb-5">
                  <FieldLabel required>{t("subjectProperty.streetAddress")}</FieldLabel>
                  <AddressAutocomplete
                    placeholder={t("subjectProperty.streetAddressPlaceholder")}
                    value={data.addressLine1}
                    onChange={(v) => setField("addressLine1", v)}
                    onSelect={(p) =>
                      setData((prev) => ({
                        ...prev,
                        addressLine1: p.line1 || prev.addressLine1,
                        city: p.city || prev.city,
                        state: p.state || prev.state,
                        zip: p.zip || prev.zip,
                      }))
                    }
                    error={err("addressLine1")}
                  />
                </div>
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel optional>{t("subjectProperty.aptUnit")}</FieldLabel>
                    <TextField
                      placeholder={t("subjectProperty.aptUnitPlaceholder")}
                      value={data.unit}
                      onChange={(e) => setField("unit", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel required>{t("subjectProperty.zip")}</FieldLabel>
                    <TextField
                      inputMode="numeric"
                      placeholder={t("subjectProperty.zipPlaceholder")}
                      value={data.zip}
                      onChange={(e) => setField("zip", e.target.value)}
                      error={err("zip")}
                    />
                  </div>
                </div>
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_160px]">
                  <div>
                    <FieldLabel required>{t("subjectProperty.city")}</FieldLabel>
                    <TextField
                      placeholder={t("subjectProperty.cityPlaceholder")}
                      value={data.city}
                      onChange={(e) => setField("city", e.target.value)}
                      error={err("city")}
                    />
                  </div>
                  <div>
                    <FieldLabel required>{t("subjectProperty.state")}</FieldLabel>
                    <SelectField
                      value={data.state}
                      onValueChange={(v) => setField("state", v)}
                      options={STATE_OPTIONS}
                      placeholder={t("field.selectPlaceholder")}
                      error={err("state")}
                    />
                  </div>
                </div>

                <FieldLabel required className="mb-3">
                  {t("subjectProperty.propertyTypeQuestion")}
                </FieldLabel>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PROPERTY_TYPES.map((p) => (
                    <RadioCard
                      key={p.value}
                      label={t(`options.propertyType.${p.value}`)}
                      selected={data.propertyType === p.value}
                      onSelect={() => setField("propertyType", p.value)}
                    />
                  ))}
                </div>
              </ScreenShell>
            )}

            {/* ── Loan details ── */}
            {screen === "loanDetails" && (
              <ScreenShell title={t("loanDetails.title")} subtitle={t("loanDetails.subtitle")}>
                <div className="mb-5">
                  <FieldLabel required>{t("loanDetails.loanAmount")}</FieldLabel>
                  <MoneyField
                    placeholder={t("loanDetails.loanAmountPlaceholder")}
                    value={data.loanAmount}
                    onChange={(e) => setField("loanAmount", e.target.value)}
                    error={err("loanAmount")}
                  />
                </div>
                <div className="mb-5">
                  <FieldLabel required>{t("loanDetails.loanType")}</FieldLabel>
                  <SelectField
                    value={data.loanType}
                    onValueChange={(v) => setField("loanType", v)}
                    options={tOptions(LOAN_TYPE_OPTIONS, "loanType")}
                    placeholder={t("field.selectPlaceholder")}
                    error={err("loanType")}
                  />
                </div>
                <div className="mb-6">
                  <FieldLabel required className="mb-3">
                    {t("loanDetails.occupancy")}
                  </FieldLabel>
                  <div className="flex flex-wrap gap-2.5">
                    {OCCUPANCY.map((o) => (
                      <Pill
                        key={o.value}
                        label={t(`options.occupancy.${o.value}`)}
                        selected={data.occupancy === o.value}
                        onSelect={() => setField("occupancy", o.value)}
                      />
                    ))}
                  </div>
                  <FieldError message={err("occupancy")} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel required>{t("loanDetails.loanTerm")}</FieldLabel>
                    <SelectField
                      value={data.loanTerm}
                      onValueChange={(v) => setField("loanTerm", v)}
                      options={tOptions(LOAN_TERM_OPTIONS, "loanTerm")}
                      placeholder={t("field.selectPlaceholder")}
                      error={err("loanTerm")}
                    />
                  </div>
                  {/* Purchase gates on the sale price; refinance replaces it with
                      the current home value (see the refinance block below). */}
                  {!isRefi && (
                    <div>
                      <FieldLabel required>{t("loanDetails.purchasePrice")}</FieldLabel>
                      <MoneyField
                        placeholder={t("loanDetails.purchasePricePlaceholder")}
                        value={data.purchasePrice}
                        onChange={(e) => setField("purchasePrice", e.target.value)}
                        error={err("purchasePrice")}
                      />
                    </div>
                  )}
                  {isRefi && (
                    <div>
                      <FieldLabel required>{t("loanDetails.homeValue")}</FieldLabel>
                      <MoneyField
                        placeholder={t("loanDetails.homeValuePlaceholder")}
                        value={data.homeValue}
                        onChange={(e) => setField("homeValue", e.target.value)}
                        error={err("homeValue")}
                      />
                    </div>
                  )}
                </div>

                {/* ── Refinance-only: current mortgage & second lien ── */}
                {isRefi && (
                  <div className="mt-6 border-t pt-6">
                    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel optional>{t("loanDetails.mortgageBalance")}</FieldLabel>
                        <MoneyField
                          placeholder={t("loanDetails.mortgageBalancePlaceholder")}
                          value={data.mortgageBalance}
                          onChange={(e) => setField("mortgageBalance", e.target.value)}
                        />
                      </div>
                      <div>
                        <FieldLabel optional>{t("loanDetails.mortgageRate")}</FieldLabel>
                        <TextField
                          inputMode="decimal"
                          placeholder={t("loanDetails.mortgageRatePlaceholder")}
                          value={data.mortgageRate}
                          onChange={(e) => setField("mortgageRate", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mb-3 text-[15px] font-semibold text-foreground">
                      {t("loanDetails.secondLienQuestion")}
                    </div>
                    <div className="flex max-w-xs gap-3">
                      <ChoiceButton
                        label={t("loanDetails.yes")}
                        selected={data.hasSecondLien === true}
                        onSelect={() => setField("hasSecondLien", true)}
                      />
                      <ChoiceButton
                        label={t("loanDetails.no")}
                        selected={data.hasSecondLien === false}
                        onSelect={() => setField("hasSecondLien", false)}
                      />
                    </div>

                    {data.hasSecondLien === true && (
                      <div className="mt-4">
                        <FieldLabel>{t("loanDetails.helocLimit")}</FieldLabel>
                        <MoneyField
                          placeholder={t("loanDetails.helocLimitPlaceholder")}
                          value={data.helocLimit}
                          onChange={(e) => setField("helocLimit", e.target.value)}
                        />
                        <div className="mt-4">
                          <Checkbox
                            checked={data.combineIntoNewLoan}
                            onToggle={() =>
                              setField("combineIntoNewLoan", !data.combineIntoNewLoan)
                            }
                          >
                            {t("loanDetails.combineIntoNewLoan")}
                          </Checkbox>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScreenShell>
            )}

            {/* ── Personal ── */}
            {screen === "personal" && (
              <ScreenShell
                title={isCo ? t("personal.titleCo") : t("personal.titlePrimary")}
                subtitle={isCo ? t("personal.subtitleCo") : t("personal.subtitlePrimary")}
              >
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel required>{t("personal.firstName")}</FieldLabel>
                    <TextField
                      value={active.firstName}
                      onChange={(e) => setActive("firstName", e.target.value)}
                      error={err("firstName")}
                    />
                  </div>
                  <div>
                    <FieldLabel required>{t("personal.lastName")}</FieldLabel>
                    <TextField
                      value={active.lastName}
                      onChange={(e) => setActive("lastName", e.target.value)}
                      error={err("lastName")}
                    />
                  </div>
                </div>
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel required>{t("personal.email")}</FieldLabel>
                    <TextField
                      type="email"
                      placeholder={t("personal.emailPlaceholder")}
                      value={active.email}
                      onChange={(e) => setActive("email", e.target.value)}
                      error={err("email")}
                    />
                  </div>
                  <div>
                    <FieldLabel required>{t("personal.cellPhone")}</FieldLabel>
                    <TextField
                      type="tel"
                      placeholder={t("personal.cellPhonePlaceholder")}
                      value={active.cellPhone}
                      onChange={(e) => setActive("cellPhone", formatUsPhone(e.target.value))}
                      error={err("cellPhone")}
                    />
                  </div>
                </div>
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <FieldLabel required>{t("personal.dob")}</FieldLabel>
                    <DateField
                      placeholder={t("personal.dobPlaceholder")}
                      value={active.dob}
                      onChange={(v) => setActive("dob", v)}
                      error={err("dob")}
                    />
                  </div>
                  <div>
                    <FieldLabel>{t("personal.maritalStatus")}</FieldLabel>
                    <SelectField
                      value={active.maritalStatus}
                      onValueChange={(v) => setActive("maritalStatus", v)}
                      options={tOptions(MARITAL_OPTIONS, "marital")}
                      placeholder={t("field.selectPlaceholder")}
                    />
                  </div>
                  <div>
                    <FieldLabel>{t("personal.dependents")}</FieldLabel>
                    <TextField
                      inputMode="numeric"
                      placeholder={t("personal.dependentsPlaceholder")}
                      value={active.dependents}
                      onChange={(e) => setActive("dependents", e.target.value)}
                    />
                  </div>
                </div>
                <div className="mb-7 max-w-xs">
                  <FieldLabel>{t("personal.citizenship")}</FieldLabel>
                  <SelectField
                    value={active.citizenship}
                    onValueChange={(v) => setActive("citizenship", v)}
                    options={tOptions(CITIZEN_OPTIONS, "citizen")}
                    placeholder={t("field.selectPlaceholder")}
                  />
                </div>

                {!isCo && (
                  <div className="border-t pt-6">
                    <div className="mb-3 text-[15px] font-semibold text-foreground">
                      {t("personal.coBorrowerQuestion")}
                    </div>
                    <div className="flex max-w-xs gap-3">
                      <ChoiceButton
                        label={t("personal.yes")}
                        selected={data.hasCoBorrower === true}
                        onSelect={() => setField("hasCoBorrower", true)}
                      />
                      <ChoiceButton
                        label={t("personal.noJustMe")}
                        selected={data.hasCoBorrower === false}
                        onSelect={() => setField("hasCoBorrower", false)}
                      />
                    </div>
                    <FieldError message={err("hasCoBorrower")} />
                    {data.hasCoBorrower === true && (
                      <div className="mt-3.5 flex max-w-xl items-start gap-2.5 rounded-xl border border-accent bg-accent px-4 py-3.5">
                        <InfoIcon className="mt-0.5 size-[18px] shrink-0 text-accent-foreground" />
                        <div className="text-[13.5px] leading-relaxed text-accent-foreground">
                          {t("personal.coBorrowerInfo")}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScreenShell>
            )}

            {/* ── Employment ── */}
            {screen === "employment" && (
              <ScreenShell
                title={isCo ? t("employment.titleCo") : t("employment.titlePrimary")}
                subtitle={isCo ? t("employment.subtitleCo") : t("employment.subtitlePrimary")}
              >
                {/* Work-history coverage — one job or several, toward 2 years. */}
                <div className="mb-5 w-full rounded-xl border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-accent">
                      <BriefcaseIcon className="size-4.5 text-accent-foreground" strokeWidth={1.7} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-foreground">
                        {t("employment.coverageTitle")}
                      </div>
                      <div className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                        {t("employment.coverageDesc")}
                      </div>
                    </div>
                    {historyCovered ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-bold whitespace-nowrap text-success">
                        <CheckIcon className="size-[15px]" strokeWidth={2.4} />
                        {t("employment.coverageDone")}
                      </span>
                    ) : (
                      <span className="text-[13.5px] font-bold whitespace-nowrap text-accent-foreground">
                        {t("employment.coverageOf", { label: coverageLabel(coveredMonths) })}
                      </span>
                    )}
                  </div>
                  <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                      style={{ width: `${coveragePct}%` }}
                    />
                  </div>
                  {!historyCovered && (
                    <div className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      {t("employment.coverageHint")}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  {activeEmployments.items.map((row, i) => (
                    <div key={i} className="rounded-xl border p-5">
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {row.current ? (
                            <span className="rounded-md bg-success/12 px-2.25 py-1 text-[11px] font-bold tracking-wide text-success uppercase">
                              {t("employment.currentJob")}
                            </span>
                          ) : (
                            <span className="rounded-md bg-muted px-2.25 py-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                              {t("employment.previousJob")}
                            </span>
                          )}
                          {row.startDate && (
                            <span className="text-[13px] text-muted-foreground">
                              {formatMonthYear(row.startDate)} –{" "}
                              {row.current
                                ? t("employment.present")
                                : formatMonthYear(row.endDate) || "…"}
                            </span>
                          )}
                        </div>
                        {activeEmployments.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => activeEmployments.remove(i)}
                            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-destructive"
                          >
                            <Trash2Icon className="size-[15px]" />
                            {t("actions.remove")}
                          </button>
                        )}
                      </div>
                      <div className="mb-4">
                        <FieldLabel>{t("employment.status")}</FieldLabel>
                        <SelectField
                          value={row.status}
                          onValueChange={(v) => activeEmployments.update(i, { status: v })}
                          options={EMPLOYMENT_STATUS_OPTIONS}
                        />
                      </div>
                      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <FieldLabel required>{t("employment.employerName")}</FieldLabel>
                          <TextField
                            placeholder={t("employment.employerNamePlaceholder")}
                            value={row.employer}
                            onChange={(e) =>
                              activeEmployments.update(i, { employer: e.target.value })
                            }
                            error={lerr(`emp:${i}:employer`)}
                          />
                        </div>
                        <div>
                          <FieldLabel>{t("employment.position")}</FieldLabel>
                          <TextField
                            placeholder={t("employment.positionPlaceholder")}
                            value={row.position}
                            onChange={(e) =>
                              activeEmployments.update(i, { position: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
                        <div>
                          <FieldLabel>{t("employment.country")}</FieldLabel>
                          <SelectField
                            value={row.country}
                            onValueChange={(v) => activeEmployments.update(i, { country: v })}
                            options={COUNTRY_OPTIONS}
                          />
                        </div>
                        <div>
                          <FieldLabel>{t("employment.companyAddress")}</FieldLabel>
                          <TextField
                            placeholder={t("employment.companyAddressPlaceholder")}
                            value={row.companyAddress}
                            onChange={(e) =>
                              activeEmployments.update(i, { companyAddress: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <FieldLabel optional>{t("employment.aptUnit")}</FieldLabel>
                          <TextField
                            placeholder={t("employment.aptUnitPlaceholder")}
                            value={row.aptUnit}
                            onChange={(e) =>
                              activeEmployments.update(i, { aptUnit: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <FieldLabel>{t("employment.zip")}</FieldLabel>
                          <TextField
                            inputMode="numeric"
                            placeholder={t("employment.zipPlaceholder")}
                            value={row.zip}
                            onChange={(e) => activeEmployments.update(i, { zip: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <FieldLabel required>{t("employment.startDate")}</FieldLabel>
                          <TextField
                            placeholder={t("employment.startDatePlaceholder")}
                            value={row.startDate}
                            onChange={(e) =>
                              activeEmployments.update(i, { startDate: e.target.value })
                            }
                            error={lerr(`emp:${i}:startDate`)}
                          />
                        </div>
                        <div>
                          <FieldLabel>{t("employment.endDate")}</FieldLabel>
                          {row.current ? (
                            <div className="flex h-13 items-center rounded-lg border-[1.5px] border-muted bg-muted px-4 text-[15px] text-muted-foreground">
                              {t("employment.present")}
                            </div>
                          ) : (
                            <TextField
                              placeholder={t("employment.endDatePlaceholder")}
                              value={row.endDate}
                              onChange={(e) =>
                                activeEmployments.update(i, { endDate: e.target.value })
                              }
                            />
                          )}
                        </div>
                      </div>
                      <div className="mb-4">
                        <FieldLabel required>{t("employment.monthlyIncome")}</FieldLabel>
                        <TextField
                          inputMode="numeric"
                          placeholder={t("employment.monthlyIncomePlaceholder")}
                          value={row.monthlyIncome}
                          onChange={(e) =>
                            activeEmployments.update(i, {
                              monthlyIncome: groupDigits(e.target.value),
                            })
                          }
                          error={lerr(`emp:${i}:monthlyIncome`)}
                        />
                      </div>
                      <Checkbox
                        checked={row.current}
                        onToggle={() => activeEmployments.update(i, { current: !row.current })}
                      >
                        {t("employment.currentlyWorksHere")}
                      </Checkbox>
                      <div className="mt-5 border-t pt-4.5">
                        <div className="mb-3 text-[13px] font-bold text-foreground">
                          {t("employment.checkAllThatApply")}
                        </div>
                        <div className="flex flex-col gap-3">
                          <Checkbox
                            align="start"
                            checked={row.related}
                            onToggle={() => activeEmployments.update(i, { related: !row.related })}
                          >
                            {t("employment.relatedParty")}
                          </Checkbox>
                          <Checkbox
                            align="start"
                            checked={row.foreign}
                            onToggle={() => activeEmployments.update(i, { foreign: !row.foreign })}
                          >
                            {t("employment.foreignIncome")}
                          </Checkbox>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Coverage is tracked in the card at the top; only prompt for
                      previous jobs while the current job alone is under 2 years. */}
                  {showAddPreviousJob && (
                    <button
                      type="button"
                      onClick={() => activeEmployments.add({ ...BLANK_EMPLOYMENT })}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-semibold text-foreground/70 transition-colors hover:border-primary hover:text-accent-foreground"
                    >
                      <PlusIcon className="size-[17px] shrink-0" />
                      {t("employment.addPreviousJob")}
                    </button>
                  )}
                </div>

                {/* ── Income from other sources ── */}
                <div className="mt-8 border-t pt-7">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {t("employment.otherIncomeTitle")}
                  </h3>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {t("employment.otherIncomeSubtitle")}
                  </p>
                  <div className="mt-4 flex flex-col gap-3">
                    {activeOtherIncome.items.map((row, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-1 items-end gap-3.5 rounded-xl border p-4 sm:grid-cols-[1fr_220px_auto]"
                      >
                        <div>
                          <FieldLabel>{t("employment.incomeSource")}</FieldLabel>
                          <SelectField
                            value={row.source}
                            onValueChange={(v) => activeOtherIncome.update(i, { source: v })}
                            options={INCOME_SOURCE_OPTIONS}
                            placeholder={t("field.selectPlaceholder")}
                            error={lerr(`oi:${i}:source`)}
                          />
                        </div>
                        <div>
                          <FieldLabel>{t("employment.monthlyAmount")}</FieldLabel>
                          <TextField
                            inputMode="numeric"
                            placeholder={t("employment.monthlyAmountPlaceholder")}
                            value={row.amount}
                            onChange={(e) =>
                              activeOtherIncome.update(i, { amount: groupDigits(e.target.value) })
                            }
                            error={lerr(`oi:${i}:amount`)}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-11 text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                          onClick={() => activeOtherIncome.remove(i)}
                        >
                          <Trash2Icon className="size-[17px]" />
                        </Button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => activeOtherIncome.add({ ...BLANK_OTHER_INCOME })}
                      className="flex h-15 w-full items-center justify-between rounded-xl border border-dashed px-5 transition-colors hover:border-primary"
                    >
                      <span className="text-[15px] font-bold text-foreground">
                        {t("employment.addIncome")}
                      </span>
                      <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground/70">
                        <PlusIcon className="size-4.5" />
                      </span>
                    </button>
                  </div>
                </div>
              </ScreenShell>
            )}

            {/* ── Demographic ── */}
            {screen === "demographic" && (
              <ScreenShell
                title={isCo ? t("demographic.titleCo") : t("demographic.titlePrimary")}
                subtitle={t("demographic.subtitle")}
              >
                <div className="flex flex-col gap-6">
                  <DemoGroup
                    label={t("demographic.ethnicity")}
                    options={ETHNICITY}
                    labelFor={(o) => t(`options.ethnicity.${o}`)}
                    value={active.ethnicity}
                    onSelect={(v) => setActive("ethnicity", v)}
                    error={err("ethnicity")}
                  />
                  <DemoGroup
                    label={t("demographic.race")}
                    options={RACE}
                    labelFor={(o) => t(`options.race.${o}`)}
                    value={active.race}
                    onSelect={(v) => setActive("race", v)}
                    error={err("race")}
                  />
                  <DemoGroup
                    label={t("demographic.sex")}
                    options={GENDER}
                    labelFor={(o) => t(`options.gender.${o}`)}
                    value={active.gender}
                    onSelect={(v) => setActive("gender", v)}
                    error={err("gender")}
                  />
                </div>
              </ScreenShell>
            )}

            {/* ── Real estate & assets ── */}
            {screen === "assets" && (
              <ScreenShell title={t("assets.title")} subtitle={t("assets.subtitle")}>
                <div className="mb-3.5 text-sm font-bold text-foreground">
                  {t("assets.accountsAndFunds")}
                </div>
                <div className="flex flex-col gap-3.5">
                  {assets.items.map((row, i) => (
                    <div
                      key={i}
                      className="relative grid grid-cols-1 gap-4 rounded-xl border p-5"
                    >
                      <div>
                        <FieldLabel>{t("assets.accountType")}</FieldLabel>
                        <SelectField
                          value={row.assetType}
                          onValueChange={(v) => assets.update(i, { assetType: v })}
                          options={tOptions(ASSET_TYPE_OPTIONS, "assetType")}
                          placeholder={t("field.selectPlaceholder")}
                        />
                      </div>
                      <div>
                        <FieldLabel required>{t("assets.institution")}</FieldLabel>
                        <TextField
                          placeholder={t("assets.institutionPlaceholder")}
                          value={row.institution}
                          onChange={(e) => assets.update(i, { institution: e.target.value })}
                          error={lerr(`asset:${i}:institution`)}
                        />
                      </div>
                      <div>
                        <FieldLabel required>{t("assets.balance")}</FieldLabel>
                        <TextField
                          inputMode="numeric"
                          placeholder={t("assets.balancePlaceholder")}
                          value={row.balance}
                          onChange={(e) => assets.update(i, { balance: groupDigits(e.target.value) })}
                          error={lerr(`asset:${i}:balance`)}
                        />
                      </div>
                      {assets.items.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-3 right-3 size-9 text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                          onClick={() => assets.remove(i)}
                        >
                          <Trash2Icon className="size-[17px]" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      assets.add({ assetType: "Savings account", institution: "", balance: "" })
                    }
                    className="inline-flex items-center gap-2 self-start py-1 text-sm font-semibold text-accent-foreground"
                  >
                    <PlusIcon className="size-4" />
                    {t("assets.addAccount")}
                  </button>
                </div>

                <div className="mt-6 border-t pt-6">
                  <div className="mb-3 text-[15px] font-semibold text-foreground">
                    {t("assets.otherRealEstateQuestion")}
                  </div>
                  <div className="flex max-w-xs gap-3">
                    <ChoiceButton
                      label={t("assets.yes")}
                      selected={data.ownsRealEstate === true}
                      onSelect={() => {
                        setField("ownsRealEstate", true);
                        if (realEstate.items.length === 0)
                          realEstate.add({
                            address: "",
                            value: "",
                            mortgageBalance: "",
                            reStatus: "Retained",
                          });
                      }}
                    />
                    <ChoiceButton
                      label={t("assets.no")}
                      selected={data.ownsRealEstate === false}
                      onSelect={() => setField("ownsRealEstate", false)}
                    />
                  </div>
                  <FieldError message={lerr("ownsRealEstate")} />

                  {data.ownsRealEstate === true && (
                    <div className="mt-4 flex flex-col gap-3.5">
                      {realEstate.items.map((row, i) => (
                        <div key={i} className="rounded-xl border p-5">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="text-[13.5px] font-bold text-foreground">
                              {t("assets.property", { index: i + 1 })}
                            </div>
                            <button
                              type="button"
                              onClick={() => realEstate.remove(i)}
                              className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-destructive"
                            >
                              <Trash2Icon className="size-[14px]" />
                              {t("actions.remove")}
                            </button>
                          </div>
                          <div className="mb-4">
                            <FieldLabel required>{t("assets.propertyAddress")}</FieldLabel>
                            <TextField
                              value={row.address}
                              onChange={(e) => realEstate.update(i, { address: e.target.value })}
                              error={lerr(`re:${i}:address`)}
                            />
                          </div>
                          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                            <div>
                              <FieldLabel required>{t("assets.marketValue")}</FieldLabel>
                              <TextField
                                inputMode="numeric"
                                value={row.value}
                                onChange={(e) =>
                                  realEstate.update(i, { value: groupDigits(e.target.value) })
                                }
                                error={lerr(`re:${i}:value`)}
                              />
                            </div>
                            <div>
                              <FieldLabel>{t("assets.mortgageBalance")}</FieldLabel>
                              <TextField
                                inputMode="numeric"
                                value={row.mortgageBalance}
                                onChange={(e) =>
                                  realEstate.update(i, {
                                    mortgageBalance: groupDigits(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div>
                              <FieldLabel>{t("assets.status")}</FieldLabel>
                              <SelectField
                                value={row.reStatus}
                                onValueChange={(v) => realEstate.update(i, { reStatus: v })}
                                options={tOptions(RE_STATUS_OPTIONS, "reStatus")}
                                placeholder={t("field.selectPlaceholder")}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          realEstate.add({
                            address: "",
                            value: "",
                            mortgageBalance: "",
                            reStatus: "Retained",
                          })
                        }
                        className="inline-flex items-center gap-2 self-start py-1 text-sm font-semibold text-accent-foreground"
                      >
                        <PlusIcon className="size-4" />
                        {t("assets.addProperty")}
                      </button>
                    </div>
                  )}
                </div>
              </ScreenShell>
            )}

            {/* ── Liabilities ── */}
            {screen === "liabilities" && (
              <ScreenShell title={t("liabilities.title")} subtitle={t("liabilities.subtitle")}>
                <div className="flex flex-col gap-3.5">
                  {liabilities.items.map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 gap-3.5 rounded-xl border p-5"
                    >
                      <div>
                        <FieldLabel>{t("liabilities.type")}</FieldLabel>
                        <SelectField
                          value={row.liabType}
                          onValueChange={(v) => liabilities.update(i, { liabType: v })}
                          options={tOptions(LIAB_TYPE_OPTIONS, "liabType")}
                          placeholder={t("field.selectPlaceholder")}
                        />
                      </div>
                      <div>
                        <FieldLabel required>{t("liabilities.creditor")}</FieldLabel>
                        <TextField
                          value={row.creditor}
                          onChange={(e) => liabilities.update(i, { creditor: e.target.value })}
                          error={lerr(`liab:${i}:creditor`)}
                        />
                      </div>
                      <div>
                        <FieldLabel required>{t("liabilities.balance")}</FieldLabel>
                        <TextField
                          inputMode="numeric"
                          value={row.balance}
                          onChange={(e) =>
                            liabilities.update(i, { balance: groupDigits(e.target.value) })
                          }
                          error={lerr(`liab:${i}:balance`)}
                        />
                      </div>
                      <div>
                        <FieldLabel required>{t("liabilities.monthly")}</FieldLabel>
                        <TextField
                          inputMode="numeric"
                          value={row.payment}
                          onChange={(e) =>
                            liabilities.update(i, { payment: groupDigits(e.target.value) })
                          }
                          error={lerr(`liab:${i}:payment`)}
                        />
                      </div>
                      {liabilities.items.length > 1 ? (
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-11 text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                          onClick={() => liabilities.remove(i)}
                        >
                          <Trash2Icon className="size-[17px]" />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      liabilities.add({
                        liabType: "Credit card",
                        creditor: "",
                        balance: "",
                        payment: "",
                      })
                    }
                    className="inline-flex items-center gap-2 self-start py-1 text-sm font-semibold text-accent-foreground"
                  >
                    <PlusIcon className="size-4" />
                    {t("liabilities.addLiability")}
                  </button>
                </div>
              </ScreenShell>
            )}

            {/* ── Review ── */}
            {screen === "review" && (
              <ScreenShell title={t("review.title")} subtitle={t("review.subtitle")}>
                <div className="flex flex-col gap-3.5">
                  {buildReviewSections({
                    data,
                    coData,
                    purpose,
                    employments: employments.items,
                    coEmployments: coEmployments.items,
                    assets: assets.items,
                    realEstate: realEstate.items,
                    liabilities: liabilities.items,
                    pages,
                    goGroup,
                    goPage,
                    t,
                  }).map((rs) => (
                    <div key={rs.title} className="rounded-xl border p-5">
                      <div className="mb-3.5 flex items-center justify-between">
                        <div className="text-[15px] font-bold text-foreground">{rs.title}</div>
                        <button
                          type="button"
                          onClick={rs.edit}
                          className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-accent-foreground"
                        >
                          <PencilIcon className="size-[14px]" />
                          {t("actions.edit")}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                        {rs.rows.map((r, ri) => (
                          <div key={ri}>
                            <div className="mb-0.5 text-xs text-muted-foreground">{r.k}</div>
                            <div className="text-[14.5px] font-medium text-foreground">{r.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScreenShell>
            )}

            {/* ── Footer ── */}
            <div className="mt-9 flex items-center border-t pt-6">
              {idx > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 rounded-md border-[1.5px] px-6 text-[15px]"
                  onClick={() => goPage(idx - 1)}
                >
                  <ArrowLeftIcon className="size-4" />
                  {t("actions.back")}
                </Button>
              )}
              <div className="ml-auto flex items-center gap-5">
                <Button size="lg" className="gap-2 px-6" onClick={onContinue}>
                  {continueLabel}
                  <ArrowRightIcon className="size-4.25" strokeWidth={2.1} />
                </Button>
              </div>
            </div>
          </main>
        </div>

        <AppFooterPortal />
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function ScreenShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-[27px] font-bold tracking-tight text-foreground">{title}</h2>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

/** Square checkbox toggle matching the application form styling. */
function Checkbox({
  checked,
  onToggle,
  children,
  align = "center",
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  align?: "center" | "start";
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn("flex gap-2.75 text-left", align === "start" ? "items-start" : "items-center")}
    >
      <span
        className={cn(
          "flex size-[22px] shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors",
          align === "start" && "mt-px",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card",
        )}
      >
        {checked && <CheckIcon className="size-3.5" strokeWidth={3} />}
      </span>
      <span
        className={cn(
          "text-foreground/80",
          align === "start" ? "text-[13.5px] leading-relaxed" : "text-sm",
        )}
      >
        {children}
      </span>
    </button>
  );
}

function DemoGroup({
  label,
  options,
  labelFor,
  value,
  onSelect,
  error,
}: {
  label: string;
  options: string[];
  labelFor: (option: string) => string;
  value: string;
  onSelect: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <div className="mb-3 text-sm font-bold text-foreground">{label}</div>
      <div className="flex flex-col gap-2.5">
        {options.map((o) => (
          <RadioCard
            key={o}
            label={labelFor(o)}
            align="start"
            selected={value === o}
            onSelect={() => onSelect(o)}
          />
        ))}
      </div>
      <FieldError message={error} />
    </div>
  );
}

// ── Review section builder ──────────────────────────────────────

type ReviewRow = { k: string; v: string };
type ReviewSection = { title: string; edit: () => void; rows: ReviewRow[] };

function buildReviewSections(ctx: {
  data: ApplicationData;
  coData: PersonalInfo;
  purpose: LoanPurpose;
  employments: Employment[];
  coEmployments: Employment[];
  assets: Asset[];
  realEstate: RealEstate[];
  liabilities: Liability[];
  pages: Page[];
  goGroup: (group: number) => void;
  goPage: (index: number) => void;
  t: TFunction<"application">;
}): ReviewSection[] {
  const { data: d, coData: co, t } = ctx;
  const isRefi = ctx.purpose === "refi";
  const notProvided = t("notProvided");
  const nameOf = (o: PersonalInfo) =>
    o.firstName || o.lastName ? `${o.firstName} ${o.lastName}`.trim() : notProvided;
  const occLabel = d.occupancy ? t(`options.occupancy.${d.occupancy}`) : notProvided;
  const propLabel = d.propertyType ? t(`options.propertyType.${d.propertyType}`) : notProvided;
  const emp0 = ctx.employments[0] ?? ({} as Employment);
  const coEmp0 = ctx.coEmployments[0] ?? ({} as Employment);

  const sections: ReviewSection[] = [
    {
      title: t("review.sections.loanInfo"),
      edit: () => ctx.goGroup(0),
      rows: [
        {
          k: t("review.rows.property"),
          v: d.addressLine1
            ? `${d.addressLine1}${d.unit ? `, ${d.unit}` : ""}, ${d.city} ${d.state} ${d.zip}`
            : notProvided,
        },
        { k: t("review.rows.propertyType"), v: propLabel },
        { k: t("review.rows.occupancy"), v: occLabel },
        { k: t("review.rows.loanType"), v: d.loanType || notProvided },
        { k: t("review.rows.loanTerm"), v: d.loanTerm || notProvided },
        { k: t("review.rows.loanAmount"), v: money(d.loanAmount, notProvided) },
        // Purchase reviews the sale price; refinance reviews the home value and
        // the current mortgage balance instead.
        ...(isRefi
          ? [
              { k: t("review.rows.homeValue"), v: money(d.homeValue, notProvided) },
              { k: t("review.rows.mortgageBalance"), v: money(d.mortgageBalance, notProvided) },
            ]
          : [{ k: t("review.rows.purchasePrice"), v: money(d.purchasePrice, notProvided) }]),
      ],
    },
    {
      title: t("review.sections.borrowerInfo"),
      edit: () => ctx.goGroup(1),
      rows: [
        { k: t("review.rows.name"), v: nameOf(d) },
        { k: t("review.rows.email"), v: d.email || notProvided },
        { k: t("review.rows.cellPhone"), v: d.cellPhone || notProvided },
        { k: t("review.rows.employer"), v: emp0.employer || notProvided },
        {
          k: t("review.rows.monthlyIncome"),
          v: emp0.monthlyIncome
            ? t("review.values.monthlyIncomePerMonth", {
                amount: money(emp0.monthlyIncome, notProvided),
              })
            : notProvided,
        },
      ],
    },
  ];

  if (d.hasCoBorrower === true) {
    const coIdx = ctx.pages.findIndex((p) => p.screen === "personal" && p.role === "co");
    sections.push({
      title: t("review.sections.coBorrower"),
      edit: () => ctx.goPage(coIdx),
      rows: [
        { k: t("review.rows.name"), v: nameOf(co) },
        { k: t("review.rows.email"), v: co.email || notProvided },
        { k: t("review.rows.employer"), v: coEmp0.employer || notProvided },
      ],
    });
  }

  sections.push({
    title: t("review.sections.realEstateAssets"),
    edit: () => ctx.goGroup(2),
    rows: [
      {
        k: t("review.rows.accountsAndFunds"),
        v: t("review.values.accounts", { count: ctx.assets.length }),
      },
      {
        k: t("review.rows.otherRealEstate"),
        v:
          d.ownsRealEstate === true
            ? t("review.values.properties", { count: ctx.realEstate.length })
            : t("review.values.none"),
      },
    ],
  });
  sections.push({
    title: t("review.sections.liabilities"),
    edit: () => ctx.goGroup(3),
    rows: [
      {
        k: t("review.rows.liabilities"),
        v: t("review.values.items", { count: ctx.liabilities.length }),
      },
    ],
  });

  return sections;
}

// useSearchParams() requires a Suspense boundary during prerender.
export default function ApplicationPage() {
  return (
    <React.Suspense fallback={null}>
      <ApplicationForm />
    </React.Suspense>
  );
}
