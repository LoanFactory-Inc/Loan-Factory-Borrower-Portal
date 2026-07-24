"use client";

import * as React from "react";

import { EmptyState } from "@/components/empty-state";
import { AppFooterPortal } from "./app-footer-portal";
import { ApplicationHeader } from "./app-header";

// True when we're already rendered inside a PortalShell (i.e. the portal route
// group's layout). Lets a page keep calling <PortalShell> as a no-op passthrough
// while the real chrome (header + footer + chat) is provided once by the layout.
const InPortalShell = React.createContext(false);

/**
 * Shared chrome for the signed-in borrower screens (header + footer + page
 * background). Rendered by each signed-in page's own `<PortalShell>` wrapper;
 * any nested `<PortalShell>` inside a page detects the context and renders its
 * children plainly, so the chrome is never duplicated. The footer lives inside
 * the scroll area (after the content) so it sits at the end of the page;
 * `flex-1` on the content keeps it pinned to the bottom on short pages. The
 * floating chat widget is rendered once by the app layout (AppShell), not here.
 */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const nested = React.useContext(InPortalShell);
  if (nested) return <>{children}</>;

  return (
    <InPortalShell.Provider value={true}>
      <div className="flex h-svh flex-col bg-page">
        <ApplicationHeader />
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1">{children}</div>
          <AppFooterPortal />
        </div>
      </div>
    </InPortalShell.Provider>
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
