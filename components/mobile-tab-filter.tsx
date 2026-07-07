"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export interface MobileTabFilterItem {
  value: string;
  label: React.ReactNode;
}

/**
 * Mobile-only tab switcher (URL `?tab=` based) for use inside the DataTable
 * filter sheet, where the top TabsList is hidden.
 */
export function MobileTabFilter({
  items,
  paramKey = "tab",
  defaultValue,
}: {
  items: MobileTabFilterItem[];
  paramKey?: string;
  defaultValue?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(paramKey) ?? defaultValue ?? items[0]?.value;

  const setTab = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramKey, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex w-full flex-col gap-1 md:hidden">
      <span className="text-xs font-medium">Tab</span>
      {items.map((item) => (
        <Button
          key={item.value}
          variant={active === item.value ? "secondary" : "ghost"}
          className="justify-start"
          onClick={() => setTab(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
