"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronDownIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { cn } from "@/lib/helpers";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth } from "@/store/slices/auth-slice";
import { clearAuthCookie } from "@/store/auth-token";

const LANGUAGES: Record<SupportedLanguage, { flag: string; name: string }> = {
  en: { flag: "🇺🇸", name: "English" },
  vi: { flag: "🇻🇳", name: "Tiếng Việt" },
};

// Profiles the account can switch between. Cosmetic for now — the borrower
// portal has no multi-role backend, so selection lives in local state only.
const PROFILE_ROLES = ["loanOfficer", "borrower", "realtor", "accountExecutive"] as const;

/** Derive up-to-two-letter initials for the avatar bubble. */
function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileMenu() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation("common");
  const profile = useAppSelector((state) => state.auth.profile);

  const name = profile?.user_name || "Alex Vu";
  const email = profile?.email_id || "alex.vu@email.com";
  const roleName = profile?.role_name?.trim();
  const initials = initialsOf(name);

  const currentLang = (
    SUPPORTED_LANGUAGES.includes(i18n.resolvedLanguage as SupportedLanguage)
      ? i18n.resolvedLanguage
      : "en"
  ) as SupportedLanguage;

  const [activeRole, setActiveRole] = React.useState<(typeof PROFILE_ROLES)[number]>("borrower");
  const [rolesExpanded, setRolesExpanded] = React.useState(false);

  const logout = () => {
    dispatch(clearAuth());
    clearAuthCookie();
    router.replace("/login");
  };

  const itemClass =
    "gap-2.75 rounded-lg px-2.5 py-2.5 text-[13.5px] font-semibold text-foreground/85 [&_svg]:text-muted-foreground focus:bg-secondary! focus:text-foreground! focus:**:text-foreground!";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("account.label")}
        className="inline-flex h-9 items-center gap-1.5 rounded-full py-0.5 pr-2 pl-0.5 outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-accent aria-expanded:bg-muted"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {initials}
        </span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={16} className="w-76 overflow-hidden p-0">
        {/* user card */}
        <div className="flex items-center gap-3 border-b bg-muted/40 p-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
            {initials}
          </span>
          <div className="min-w-0">
            {roleName && (
              <div className="truncate text-[10.5px] font-bold tracking-wide text-primary uppercase">
                {roleName}
              </div>
            )}
            <div className="truncate text-[15px] font-bold text-foreground">{name}</div>
            <div className="truncate text-[12.5px] text-muted-foreground">{email}</div>
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-success/12 px-1.75 py-0.5 text-[11px] font-bold tracking-wide text-success uppercase">
              <span className="size-1.5 rounded-full bg-success" />
              {t("account.verified")}
            </span>
          </div>
        </div>

        {/* switch profile — shows the current role; "Expand" reveals the full
            list to switch. Kept as non-menu-item rows so switching doesn't
            close the menu. Cosmetic for now (local state only). */}
        <div className="p-2">
          <div className="px-2.5 pt-1 pb-2 text-[10.5px] font-bold tracking-wide text-muted-foreground/70 uppercase">
            {t("account.switchProfile")}
          </div>

          {/* current role + expand toggle */}
          <button
            type="button"
            aria-expanded={rolesExpanded}
            onClick={() => setRolesExpanded((v) => !v)}
            className="flex w-full items-center gap-2.75 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold text-foreground/85 transition-colors hover:bg-secondary"
          >
            <UserIcon className="size-3.75" strokeWidth={1.8} />
            <span className="flex-1 text-left">{t(`account.roles.${activeRole}`)}</span>
            <ChevronDownIcon
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-200",
                rolesExpanded && "rotate-180",
              )}
            />
          </button>

          {/* switchable roles */}
          {rolesExpanded && (
            <div className="mt-0.5 flex flex-col gap-0.5">
              {PROFILE_ROLES.map((role) => {
                const on = activeRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveRole(role)}
                    className={cn(
                      "flex w-full items-center gap-2.75 rounded-lg py-2 pr-2.5 pl-11.75 text-[13px] font-semibold transition-colors",
                      on ? "text-primary" : "text-foreground/85 hover:bg-secondary",
                    )}
                  >
                    <span className="flex-1 text-left">{t(`account.roles.${role}`)}</span>
                    {on && <CheckIcon className="size-4 text-primary" strokeWidth={2.4} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="mx-0 my-0" />

        {/* links */}
        <div className="p-2">
          <DropdownMenuItem asChild className={itemClass}>
            <Link href="/settings">
              <SettingsIcon className="size-4.25" strokeWidth={1.7} />
              {t("account.settings")}
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="mx-0 my-0" />

        {/* preferences — kept as non-menu-item rows so switching doesn't close the menu */}
        <div className="flex flex-col gap-1 p-2">
          <div className="flex items-center justify-between rounded-lg px-2.5 py-1">
            <span className="text-[13.5px] font-semibold text-foreground/85">
              {t("account.theme")}
            </span>
            <ThemeToggleButton className="size-8 hover:bg-secondary" />
          </div>
          <div className="px-2.5 py-1">
            <div className="mb-1.75 text-[13.5px] font-semibold text-foreground/85">
              {t("account.language")}
            </div>
            <div className="flex gap-1.5">
              {SUPPORTED_LANGUAGES.map((lng) => {
                const on = currentLang === lng;
                return (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => void i18n.changeLanguage(lng)}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.75 text-[12.5px] font-semibold transition-colors",
                      on
                        ? "border-primary bg-accent/40 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <span className="text-[14px] leading-none">{LANGUAGES[lng].flag}</span>
                    {LANGUAGES[lng].name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="mx-0 my-0" />

        <div className="p-2">
          <DropdownMenuItem
            onClick={logout}
            className="gap-2.75 rounded-lg px-2.5 py-2.5 text-[13.5px] font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive [&_svg]:text-destructive"
          >
            <LogOutIcon className="size-4.25" strokeWidth={1.7} />
            {t("account.signOut")}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
