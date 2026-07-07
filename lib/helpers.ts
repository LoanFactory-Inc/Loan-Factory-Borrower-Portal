import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Group the digits of a money string with thousands separators, e.g.
 * "300000" → "300,000". Keeps at most one decimal point and drops any other
 * non-numeric characters, so it's safe to run on raw keystrokes.
 */
export function groupDigits(value: string): string {
  if (!value) return "";
  const cleaned = value.replace(/[^\d.]/g, "");
  const [intPart, ...rest] = cleaned.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // Preserve a trailing decimal the user is mid-typing (e.g. "12.").
  return rest.length ? `${grouped}.${rest.join("").slice(0, 2)}` : grouped;
}

/**
 * Format a US phone number progressively as it's typed:
 * "" → "", "512" → "(512", "5125550142" → "(512) 555-0142". Extra digits
 * beyond 10 are dropped.
 */
export function formatUsPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function formatDate(epochSeconds: number): string {
  if (!epochSeconds) return "-";
  return new Date(epochSeconds * 1000).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Convert a "YYYY-MM-DD" date string to a Unix timestamp in seconds (0 if empty/invalid). */
export function toTimestamp(date: string): number {
  if (!date) return 0;
  const ms = new Date(date).getTime();
  return Number.isNaN(ms) ? 0 : Math.floor(ms / 1000);
}

export function formatDateTime(epochSeconds: number): string {
  if (!epochSeconds) return "-";
  return new Date(epochSeconds * 1000).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Permission is 2^n
export function enableBit(total: number, permission: number) {
  return (total & permission) === permission;
}

// Convert a snake_case string to uppercase, space-separated text
export function formatSnakeCaseToText(originValue: string) {
  try {
    if (!originValue.includes("_")) return originValue;
    const result = originValue
      .split("_")
      .map((item) => item.charAt(0).toLocaleUpperCase() + item.slice(1));
    return result.join(" ").trim();
  } catch {
    return originValue;
  }
}

export function trimSpaceValues<T extends Record<string, unknown>>(values: T): T {
  const out = {} as Record<string, unknown>;
  for (const [key, raw] of Object.entries(values)) {
    out[key] = typeof raw === "string" ? raw.trim() : raw;
  }
  return out as T;
}

/** Generate a RFC 9562 UUID version 7 (48-bit timestamp + random). */
export function uuidV7() {
  const ts = Date.now();
  const bytes = new Uint8Array(16);
  bytes[0] = Math.floor(ts / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(ts / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(ts / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(ts / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(ts / 2 ** 8) & 0xff;
  bytes[5] = ts & 0xff;
  crypto.getRandomValues(bytes.subarray(6));
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  );
}
