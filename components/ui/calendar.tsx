"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/helpers";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: cn(defaults.months, "relative flex flex-col gap-4 sm:flex-row"),
        month: cn(defaults.month, "flex flex-col gap-4"),
        month_caption: cn(defaults.month_caption, "flex h-9 items-center justify-center px-9"),
        caption_label: cn(
          defaults.caption_label,
          "flex items-center gap-1 text-sm font-medium [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
        ),
        dropdowns: cn(defaults.dropdowns, "flex items-center justify-center gap-1.5 text-sm font-medium"),
        dropdown_root: cn(
          defaults.dropdown_root,
          "relative inline-flex items-center rounded-md border border-input px-2 py-1 transition-colors hover:bg-accent",
        ),
        dropdown: cn(defaults.dropdown, "absolute inset-0 cursor-pointer opacity-0"),
        nav: cn(defaults.nav, "absolute inset-x-0 top-0 flex items-center justify-between px-1"),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 p-0 opacity-60 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 p-0 opacity-60 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: cn(defaults.weekdays, "flex"),
        weekday: cn(defaults.weekday, "w-9 text-[0.8rem] font-normal text-muted-foreground"),
        week: cn(defaults.week, "mt-2 flex w-full"),
        day: cn(
          defaults.day,
          "relative size-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 rounded-md p-0 font-normal aria-selected:opacity-100",
        ),
        range_start: cn(defaults.range_start, "rounded-l-md bg-accent"),
        range_middle: cn(
          defaults.range_middle,
          "rounded-none bg-accent! text-accent-foreground!",
        ),
        range_end: cn(defaults.range_end, "rounded-r-md bg-accent"),
        selected: cn(
          defaults.selected,
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        ),
        today: cn(defaults.today, "[&>button]:bg-accent [&>button]:text-accent-foreground"),
        outside: cn(defaults.outside, "text-muted-foreground opacity-50"),
        disabled: cn(defaults.disabled, "text-muted-foreground opacity-50"),
        hidden: cn(defaults.hidden, "invisible"),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass, ...chevronProps }) => {
          const Comp =
            orientation === "left"
              ? ChevronLeftIcon
              : orientation === "right"
                ? ChevronRightIcon
                : orientation === "up"
                  ? ChevronUpIcon
                  : ChevronDownIcon;
          return <Comp className={cn("size-4", chevronClass)} {...chevronProps} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
