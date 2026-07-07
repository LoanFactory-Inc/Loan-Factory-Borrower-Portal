"use client";

import * as React from "react";
import { CheckIcon, UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/helpers";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { GROUPS } from "../constants";

export type SubItem = { label: string; active: boolean; pageIndex: number };

/** A run of sub-items, optionally headed by a role label ("You" / "Co-borrower"). */
export type SubGroup = { heading: string | null; items: SubItem[] };

export type RailStep = {
  group: number;
  status: "done" | "current" | "todo";
  subGroups: SubGroup[];
};

type ProgressRailProps = {
  steps: RailStep[];
  pct: number;
  sectionsDone: number;
  totalGroups: number;
  onGoGroup: (group: number) => void;
  onGoPage: (pageIndex: number) => void;
};

export function ProgressRail({
  steps,
  pct,
  sectionsDone,
  totalGroups,
  onGoGroup,
  onGoPage,
}: ProgressRailProps) {
  const { t } = useTranslation("application");

  return (
    <aside className="sticky top-6 rounded-2xl border bg-card p-6 shadow-xs">
      <div className="mb-4 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {t("rail.yourApplication")}
      </div>

      <div className="mb-6 flex items-center gap-4">
        <AnimatedCircularProgressBar
          value={pct}
          gaugePrimaryColor="var(--primary)"
          gaugeSecondaryColor="var(--muted)"
          className="size-[76px] shrink-0 text-lg font-bold text-foreground"
        />
        <div>
          <div className="text-[15px] leading-tight font-bold text-foreground">
            {t("rail.sectionsOf", { done: sectionsDone, total: totalGroups })}
          </div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            {t("rail.sectionsComplete")}
          </div>
        </div>
      </div>

      <div>
        {steps.map((step, i) => {
          const group = GROUPS[step.group];
          const isLast = i === steps.length - 1;
          const totalItems = step.subGroups.reduce((n, sg) => n + sg.items.length, 0);
          const hasHeadings = step.subGroups.some((sg) => sg.heading);
          const showSub = step.status === "current" && (totalItems > 1 || hasHeadings);

          return (
            <div key={step.group} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onGoGroup(step.group)}
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-colors",
                    step.status === "done" && "bg-success/15 text-success",
                    step.status === "current" &&
                      "bg-primary text-primary-foreground ring-4 ring-accent",
                    step.status === "todo" && "bg-muted text-muted-foreground",
                  )}
                >
                  {step.status === "done" ? (
                    <CheckIcon className="size-4" strokeWidth={3} />
                  ) : (
                    step.group + 1
                  )}
                </button>
                {!isLast && (
                  <div
                    className={cn(
                      "my-1.5 min-h-[22px] w-0.5 flex-1 rounded-full",
                      step.status === "done" ? "bg-success/40" : "bg-border",
                    )}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-4">
                <button
                  type="button"
                  onClick={() => onGoGroup(step.group)}
                  className={cn(
                    "text-left text-sm leading-tight font-semibold transition-colors",
                    step.status === "current" && "font-bold text-primary",
                    step.status === "done" && "text-foreground",
                    step.status === "todo" && "text-muted-foreground",
                  )}
                >
                  {t(`groups.${group.key}.label`)}
                </button>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t(`groups.${group.key}.meta`)}
                </div>

                {showSub && (
                  <div className="mt-3 flex flex-col gap-3.5">
                    {step.subGroups.map((sg, gi) =>
                      sg.heading ? (
                        <div key={gi}>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-accent">
                              <UserIcon className="size-3 text-accent-foreground" />
                            </span>
                            <span className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                              {sg.heading}
                            </span>
                          </div>
                          <div className="ml-2.25 flex flex-col gap-1.75 border-l-2 border-muted pl-2.75">
                            {sg.items.map((sub) => (
                              <SubButton key={sub.pageIndex} sub={sub} onGoPage={onGoPage} />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div key={gi} className="flex flex-col gap-1.5">
                          {sg.items.map((sub) => (
                            <SubButton key={sub.pageIndex} sub={sub} onGoPage={onGoPage} />
                          ))}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function SubButton({
  sub,
  onGoPage,
}: {
  sub: SubItem;
  onGoPage: (pageIndex: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onGoPage(sub.pageIndex)}
      className={cn(
        "flex items-center gap-2.25 py-0.5 text-left text-[13px] transition-colors",
        sub.active
          ? "font-bold text-accent-foreground"
          : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          sub.active ? "bg-primary" : "bg-input",
        )}
      />
      {sub.label}
    </button>
  );
}
