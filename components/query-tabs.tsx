"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface QueryTabItem {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  triggerClassName?: string;
}

interface QueryTabsProps {
  items: QueryTabItem[];
  paramKey?: string;
  defaultValue?: string;
  className?: string;
  listClassName?: string;
}

export function QueryTabs({
  items,
  paramKey = "tab",
  defaultValue,
  className,
  listClassName,
}: QueryTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fallback = defaultValue ?? items[0]?.value;
  const values = React.useMemo(() => items.map((i) => i.value), [items]);
  const param = searchParams.get(paramKey);
  const activeTab = param && values.includes(param) ? param : fallback;

  const setTabParam = React.useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(paramKey, value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, paramKey],
  );

  React.useEffect(() => {
    if (param !== activeTab && activeTab) {
      setTabParam(activeTab);
    }
  }, [param, activeTab, setTabParam]);

  const handleTabChange = (value: string) => {
    setTabParam(value);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className={className}>
      <TabsList className={listClassName}>
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value} className={item.triggerClassName}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
