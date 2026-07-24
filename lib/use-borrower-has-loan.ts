"use client";

import * as React from "react";

import { useAppSelector } from "@/store/hooks";
import { listBorrowerLoans } from "@/app/my-loans/services";
import {
  getApplicationDetail,
  getApplicationSections,
} from "@/app/application/services/borrower-application";
import { isApplicationComplete, stepSignalsFrom } from "@/app/application/sections";

/** A backend transaction id (UUID); local drafts use a `TR-#####` id (no backend detail). */
const TX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether an in-progress loan has every required section filled — the backend
 * splits the 1003 core (detail) from its sub-resources (sections), so both are
 * read. Best-effort: any failure reads as "not complete".
 */
async function isTransactionComplete(txId: string): Promise<boolean> {
  if (!TX_UUID.test(txId)) return false;
  try {
    const [detail, sections] = await Promise.all([
      getApplicationDetail(txId),
      getApplicationSections(txId, { skipErrorToast: true }).catch(() => null),
    ]);
    return isApplicationComplete(
      stepSignalsFrom(detail as unknown as Record<string, unknown>, sections),
    );
  } catch {
    return false;
  }
}

// Module-level cache so the backend loan list is fetched at most once per page
// load and shared across every consumer (header, root redirect, my-loans).
let remoteState: "idle" | "loading" | "done" = "idle";
let remoteHasLoan = false;
let remoteErrored = false;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((fn) => fn());
}

function ensureRemoteFetch() {
  if (remoteState !== "idle") return;
  remoteState = "loading";
  listBorrowerLoans()
    .then(async (loans) => {
      // A submitted application always counts. An in-progress draft counts too
      // once every required section is filled — Documents then becomes the
      // borrower's next action, so the nav should surface.
      if (loans.some((l) => l.status === "submitted")) {
        remoteHasLoan = true;
        return;
      }
      const latest = loans[0]; // listBorrowerLoans sorts most-recent-first
      remoteHasLoan = latest ? await isTransactionComplete(latest.id) : false;
    })
    .catch(() => {
      remoteErrored = true;
    })
    .finally(() => {
      remoteState = "done";
      notify();
    });
}

/**
 * Whether the signed-in borrower has a completed application. The backend is
 * the source of truth (mirrors the existence check on My loans): once the probe
 * resolves, its answer wins so a stale local store can't keep phantom UI (e.g.
 * the Documents nav) around after the borrower has no loan. The local store is
 * used only while the probe is in flight, or as a fallback if it errors.
 * `ready` stays false until the probe resolves so callers avoid deciding early.
 */
export function useBorrowerHasLoan(): { hasLoan: boolean; ready: boolean } {
  // A completed application = one that has been submitted (all steps done).
  const localHas = useAppSelector((s) =>
    s.application.applications.some((a) => a.status === "submitted"),
  );
  const hasToken = useAppSelector((s) => Boolean(s.auth.apiToken));
  const [, force] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    if (!hasToken) return;
    const fn = () => force();
    subscribers.add(fn);
    ensureRemoteFetch();
    return () => {
      subscribers.delete(fn);
    };
  }, [hasToken]);

  const done = remoteState === "done";
  const hasLoan = !hasToken
    ? false
    : !done
      ? localHas // still probing — optimistic for a known local loan
      : remoteErrored
        ? localHas // backend unreachable — trust the local store
        : remoteHasLoan; // backend authoritative
  const ready = !hasToken || done;
  return { hasLoan, ready };
}
