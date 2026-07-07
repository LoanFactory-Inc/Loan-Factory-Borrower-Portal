import * as React from "react";

import { ChatWidget } from "@/components/chat-widget";
import { EmptyState } from "@/components/empty-state";
import { AppFooterPortal } from "@/app/application/components/app-footer-portal";
import { ApplicationHeader } from "@/app/application/components/app-header";

/**
 * Shared chrome for the signed-in borrower screens (header + footer + page
 * background). The access guard lives in app/page.tsx, so this only provides
 * layout. The footer lives inside the scroll area (after the content) so it
 * sits at the end of the page; `flex-1` on the content keeps it pinned to the
 * bottom on short pages.
 */
export function PortalShell({
  children,
  hideChat = false,
}: {
  children: React.ReactNode;
  /** Hide the floating chat widget (e.g. before an application exists). */
  hideChat?: boolean;
}) {
  return (
    <div className="flex h-svh flex-col bg-page">
      <ApplicationHeader />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1">{children}</div>
        <AppFooterPortal />
      </div>
      {!hideChat && <ChatWidget />}
    </div>
  );
}

/** Consistent page heading for portal screens. */
export function PortalPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Simple empty / coming-soon state for portal sections. */
export function PortalPlaceholder({
  title,
  description,
}: {
  /** Accepted for call-site compatibility; the shared illustration is shown instead. */
  icon?: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <EmptyState
      className="mt-10 rounded-2xl border border-dashed bg-card py-16"
      title={title}
      description={description}
    />
  );
}
