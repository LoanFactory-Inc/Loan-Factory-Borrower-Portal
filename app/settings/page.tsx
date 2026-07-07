"use client";

import * as React from "react";
import { BellIcon, LockIcon, Settings2Icon, UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApplicationHeader } from "@/app/application/components/app-header";

type Section = "profile" | "security" | "notifications" | "preferences";

const NAV: { key: Section; icon: React.ElementType }[] = [
  { key: "profile", icon: UserIcon },
  { key: "security", icon: LockIcon },
  { key: "notifications", icon: BellIcon },
  { key: "preferences", icon: Settings2Icon },
];

const NOTIF_KEYS = ["loanUpdates", "docRequests", "esign", "rateAlerts", "marketing"] as const;
type NotifKey = (typeof NOTIF_KEYS)[number];

export default function SettingsPage() {
  const { t } = useTranslation("settings");
  const [section, setSection] = React.useState<Section>("profile");

  return (
    <div className="flex h-svh flex-col bg-page">
      <ApplicationHeader />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-295 px-4 py-10 sm:px-7">
          {/* Page header */}
          <div className="mb-6.5">
            <h1 className="text-[26px] font-bold tracking-tight text-foreground">
              {t("page.title")}
            </h1>
            <p className="mt-1.75 text-sm text-muted-foreground">{t("page.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 items-start gap-7 md:grid-cols-[236px_1fr]">
            {/* ── Sidebar card ── */}
            <aside className="sticky top-6 hidden rounded-2xl border bg-card p-3.5 md:block">
              <div className="mb-2.5 flex items-center gap-3 border-b px-2 pb-4">
                <span className="flex size-10.5 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  AV
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-foreground">Alex Vu</div>
                  <div className="truncate text-xs text-muted-foreground">alex.vu@email.com</div>
                </div>
              </div>
              <nav className="flex flex-col gap-0.75">
                {NAV.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSection(key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                      section === key
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4.5" strokeWidth={1.7} />
                    {t(`nav.${key}`)}
                  </button>
                ))}
              </nav>
            </aside>

            {/* ── Content ── */}
            <div className="min-w-0">
              {/* Mobile section tabs (sidebar is hidden below md) */}
              <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 md:hidden">
                {NAV.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSection(key)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors",
                      section === key
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.8} />
                    {t(`nav.${key}`)}
                  </button>
                ))}
              </div>

              {section === "profile" && <ProfileSection />}
              {section === "security" && <SecuritySection />}
              {section === "notifications" && <NotificationsSection />}
              {section === "preferences" && <PreferencesSection />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Cards & fields ─────────────────────────────────────────────
function SettingsCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border bg-card", className)}>{children}</div>;
}

function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b px-7 py-6">
      <div className="text-base font-bold text-foreground">{title}</div>
      <div className="mt-0.75 text-[13.5px] text-muted-foreground">{subtitle}</div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.75 text-[12.5px] font-semibold text-foreground/80">{label}</Label>
      {children}
    </div>
  );
}

const fieldInput = "h-10.5 rounded-lg border-input text-sm";

// ── Profile ────────────────────────────────────────────────────
function ProfileSection() {
  const { t } = useTranslation("settings");
  return (
    <SettingsCard className="overflow-hidden">
      <CardHeader title={t("meta.profile.title")} subtitle={t("meta.profile.subtitle")} />

      <div className="p-7">
        <div className="mb-6 flex items-center gap-4.5 border-b pb-5.5">
          <span className="flex size-15 shrink-0 items-center justify-center rounded-full bg-primary text-[22px] font-bold text-primary-foreground">
            AV
          </span>
          <div className="flex gap-2.5">
            <Button size="sm" className="h-9.5 rounded-lg px-4 text-[13.5px]">
              {t("profile.uploadPhoto")}
            </Button>
            <Button variant="outline" size="sm" className="h-9.5 rounded-lg px-4 text-[13.5px]">
              {t("profile.remove")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("profile.firstName")}>
            <Input defaultValue="Alex" className={fieldInput} />
          </Field>
          <Field label={t("profile.lastName")}>
            <Input defaultValue="Vu" className={fieldInput} />
          </Field>
          <Field label={t("profile.email")}>
            <Input type="email" defaultValue="alex.vu@email.com" className={fieldInput} />
          </Field>
          <Field label={t("profile.phone")}>
            <Input type="tel" defaultValue="(415) 555-0182" className={fieldInput} />
          </Field>
          <Field label={t("profile.mailingAddress")} className="sm:col-span-2">
            <Input
              defaultValue="128 California Incline, Los Angeles, CA 90001"
              className={fieldInput}
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-2.5 border-t bg-muted/40 px-7 py-4">
        <Button variant="outline" className="h-10 rounded-lg px-4 text-[13.5px]">
          {t("profile.cancel")}
        </Button>
        <Button className="h-10 rounded-lg px-5 text-[13.5px]">{t("profile.save")}</Button>
      </div>
    </SettingsCard>
  );
}

// ── Security ───────────────────────────────────────────────────
function SecurityRow({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-7 py-5 not-last:border-b">
      <div className="max-w-105">
        <div className="text-[14.5px] font-semibold text-foreground">{title}</div>
        <div className="mt-0.75 text-[13px] leading-relaxed text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function SecuritySection() {
  const { t } = useTranslation("settings");
  const [twoFa, setTwoFa] = React.useState(false);
  return (
    <SettingsCard className="overflow-hidden">
      <CardHeader title={t("meta.security.title")} subtitle={t("meta.security.subtitle")} />
      <SecurityRow title={t("security.passwordTitle")} desc={t("security.passwordDesc")}>
        <Button variant="outline" size="sm" className="h-9.5 rounded-lg px-4 text-[13.5px]">
          {t("security.changePassword")}
        </Button>
      </SecurityRow>
      <SecurityRow title={t("security.twoFaTitle")} desc={t("security.twoFaDesc")}>
        <Switch checked={twoFa} onCheckedChange={setTwoFa} />
      </SecurityRow>
      <SecurityRow title={t("security.sessionsTitle")} desc={t("security.sessionsDesc")}>
        <Button
          variant="outline"
          size="sm"
          className="h-9.5 rounded-lg px-4 text-[13.5px] hover:border-destructive/40 hover:text-destructive"
        >
          {t("security.signOutOthers")}
        </Button>
      </SecurityRow>
    </SettingsCard>
  );
}

// ── Notifications ──────────────────────────────────────────────
function NotificationsSection() {
  const { t } = useTranslation("settings");
  const [enabled, setEnabled] = React.useState<Record<NotifKey, boolean>>({
    loanUpdates: true,
    docRequests: true,
    esign: true,
    rateAlerts: true,
    marketing: false,
  });
  return (
    <SettingsCard className="overflow-hidden">
      <CardHeader
        title={t("meta.notifications.title")}
        subtitle={t("meta.notifications.subtitle")}
      />
      <div className="px-7">
        {NOTIF_KEYS.map((key) => (
          <div
            key={key}
            className="flex flex-wrap items-center justify-between gap-4 py-4.5 not-last:border-b"
          >
            <div className="max-w-115">
              <div className="text-[14.5px] font-semibold text-foreground">
                {t(`notifications.${key}.label`)}
              </div>
              <div className="mt-0.75 text-[13px] leading-relaxed text-muted-foreground">
                {t(`notifications.${key}.desc`)}
              </div>
            </div>
            <Switch
              checked={enabled[key]}
              onCheckedChange={(v) => setEnabled((prev) => ({ ...prev, [key]: v }))}
            />
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

// ── Preferences ────────────────────────────────────────────────
function PrefSelect({ options, defaultValue }: { options: string[]; defaultValue: string }) {
  return (
    <Select defaultValue={defaultValue}>
      <SelectTrigger className="h-10.5! w-full rounded-lg text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PreferencesSection() {
  const { t } = useTranslation("settings");
  return (
    <div className="flex flex-col gap-5">
      <SettingsCard className="overflow-hidden">
        <CardHeader
          title={t("meta.preferences.title")}
          subtitle={t("meta.preferences.subtitle")}
        />
        <div className="grid grid-cols-1 gap-4 p-7 sm:grid-cols-2">
          <Field label={t("preferences.language")}>
            <PrefSelect options={["English (US)", "Tiếng Việt"]} defaultValue="English (US)" />
          </Field>
          <Field label={t("preferences.timeZone")}>
            <PrefSelect
              options={[
                "Pacific Time (PT)",
                "Mountain Time (MT)",
                "Central Time (CT)",
                "Eastern Time (ET)",
              ]}
              defaultValue="Pacific Time (PT)"
            />
          </Field>
          <Field label={t("preferences.currency")}>
            <PrefSelect options={["USD ($)"]} defaultValue="USD ($)" />
          </Field>
          <Field label={t("preferences.dateFormat")}>
            <PrefSelect options={["MM/DD/YYYY", "DD/MM/YYYY"]} defaultValue="MM/DD/YYYY" />
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard className="flex flex-wrap items-start justify-between gap-4 border-destructive/40 p-6.5">
        <div className="max-w-110">
          <div className="text-[15px] font-bold text-destructive">
            {t("preferences.closeTitle")}
          </div>
          <div className="mt-1.25 text-[13.5px] leading-relaxed text-muted-foreground">
            {t("preferences.closeDesc")}
          </div>
        </div>
        <Button
          variant="outline"
          className="h-10 rounded-lg border-destructive/40 px-4 text-[13.5px] text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {t("preferences.closeAccount")}
        </Button>
      </SettingsCard>
    </div>
  );
}
