"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn, groupDigits } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Option } from "../constants";

/** Field label with optional required marker / "(optional)" hint. */
export function FieldLabel({
  children,
  required,
  optional,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className={cn("mb-2 text-[13px] font-semibold text-foreground", className)}
    >
      {children}
      {required && <span className="text-destructive">*</span>}
      {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
    </Label>
  );
}

/** Radio-style selectable card used for property type and demographic questions. */
export function RadioCard({
  label,
  selected,
  onSelect,
  align = "center",
}: {
  label: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  align?: "center" | "start";
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full gap-3 rounded-lg border-[1.5px] px-4 py-3.75 text-left transition-colors",
        align === "center" ? "items-center" : "items-start",
        selected
          ? "border-primary bg-accent"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          align === "start" && "mt-0.5",
          selected ? "border-primary" : "border-input",
        )}
      >
        <span
          className={cn(
            "size-2.5 rounded-full transition-colors",
            selected ? "bg-primary" : "bg-transparent",
          )}
        />
      </span>
      <span className="text-[14.5px] font-medium text-foreground">{label}</span>
    </button>
  );
}

/** Inline validation message shown beneath a field. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[12.5px] font-medium text-destructive">{message}</p>;
}

/** Ring/border applied to a field in the error state. */
const errorRing =
  "border-destructive/70 focus-visible:border-destructive focus-visible:ring-destructive/30";

/** Standard text input sized to match the application form fields. */
export function TextField({
  className,
  error,
  ...props
}: React.ComponentProps<typeof Input> & { error?: string }) {
  return (
    <>
      <Input
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-13 rounded-lg border-[1.5px] px-4 text-[15px]",
          error && errorRing,
          className,
        )}
        {...props}
      />
      <FieldError message={error} />
    </>
  );
}

/**
 * Text input with a leading "$" that auto-groups digits with thousands
 * separators as the user types (e.g. 300000 → 300,000). The grouped string is
 * what flows back through `onChange`, so callers store the display value
 * directly; validation strips separators before parsing.
 */
export function MoneyField({
  className,
  error,
  value,
  onChange,
  ...props
}: React.ComponentProps<typeof Input> & { error?: string }) {
  const display = groupDigits(String(value ?? ""));
  return (
    <>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[15px] font-semibold text-muted-foreground">
          $
        </span>
        <Input
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-13 rounded-lg border-[1.5px] pr-4 pl-8.5 text-[15px]",
            error && errorRing,
            className,
          )}
          inputMode="numeric"
          value={display}
          onChange={(e) => {
            e.target.value = groupDigits(e.target.value);
            onChange?.(e);
          }}
          {...props}
        />
      </div>
      <FieldError message={error} />
    </>
  );
}

const DATE_FORMAT = "MM/dd/yyyy";

/**
 * Date input the borrower can either type into freely (MM/DD/YYYY) or fill by
 * clicking the calendar icon and picking a day. Typed and picked values stay in
 * sync through the same `onChange`.
 */
export function DateField({
  value,
  onChange,
  placeholder,
  error,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  id?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const parsed = value ? parse(value, DATE_FORMAT, new Date()) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <>
      <div className="relative">
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          inputMode="numeric"
          onChange={(e) => onChange(e.target.value)}
          className={cn("h-13 rounded-lg border-[1.5px] pr-12 pl-4 text-[15px]", error && errorRing)}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Open calendar"
              className="absolute top-1/2 right-2 -translate-y-1/2 flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <CalendarIcon className="size-4.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" collisionPadding={16}>
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected}
              captionLayout="dropdown"
              startMonth={new Date(1920, 0)}
              endMonth={new Date()}
              onSelect={(date) => {
                if (date) onChange(format(date, DATE_FORMAT));
                setOpen(false);
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <FieldError message={error} />
    </>
  );
}

/** Select bound to a controlled string value; empty string shows the placeholder. */
export function SelectField({
  value,
  onValueChange,
  placeholder,
  options,
  id,
  className,
  error,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: Option[];
  id?: string;
  className?: string;
  error?: string;
}) {
  const { t } = useTranslation("common");
  return (
    <>
      <Select value={value || undefined} onValueChange={onValueChange}>
        <SelectTrigger
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-13! w-full rounded-lg border-[1.5px] text-[15px]",
            error && errorRing,
            className,
          )}
        >
          <SelectValue placeholder={placeholder ?? t("form.select")} />
        </SelectTrigger>
        {/* popper + align start → dropdown opens below the trigger instead of
            overlaying it (the default item-aligned mode covers the input). */}
        <SelectContent position="popper" align="start" className="w-(--radix-select-trigger-width)">
          {options.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              // Neutral grey highlight instead of the default orange accent.
              className="focus:bg-secondary focus:text-foreground not-data-[variant=destructive]:focus:**:text-foreground"
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError message={error} />
    </>
  );
}

/** Pill-style single choice (occupancy). */
export function Pill({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-11 items-center rounded-full border px-5 text-sm font-semibold transition-colors",
        selected
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border bg-muted text-foreground/70 hover:bg-secondary",
      )}
    >
      {label}
    </button>
  );
}

/** Two-option Yes/No style selector. */
export function ChoiceButton({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "h-12 flex-1 rounded-lg border-[1.5px] text-sm font-semibold",
        selected
          ? "border-primary bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground"
          : "border-border bg-card text-foreground/70 hover:bg-muted",
      )}
    >
      {label}
    </Button>
  );
}
