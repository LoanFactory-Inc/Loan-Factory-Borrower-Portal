"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type RowAction = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
};

/**
 * Row actions: inline icon buttons on desktop, labeled buttons on mobile (for
 * the card footer).
 */
export function RowActions({ actions }: { actions: RowAction[] }) {
  return (
    <>
      <div className="hidden items-center justify-start gap-1 md:flex">
        {actions.map((a) => (
          <Tooltip key={a.key}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={a.label} onClick={a.onClick}>
                {a.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{a.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-start gap-1 md:hidden">
        {actions.map((a) => (
          <Button
            key={a.key}
            variant="ghost"
            size="sm"
            onClick={a.onClick}
            className="gap-1.5 font-normal"
          >
            {a.icon}
            {a.label}
          </Button>
        ))}
      </div>
    </>
  );
}
