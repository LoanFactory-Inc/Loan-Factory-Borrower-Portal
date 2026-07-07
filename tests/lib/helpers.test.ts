import { describe, expect, it } from "vitest";

import {
  cn,
  enableBit,
  formatDate,
  formatDateTime,
  formatSnakeCaseToText,
  toTimestamp,
  trimSpaceValues,
  uuidV7,
} from "@/lib/helpers";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("enableBit", () => {
  it("returns true when the permission bit is set", () => {
    expect(enableBit(0b1010, 0b0010)).toBe(true);
    expect(enableBit(16, 16)).toBe(true);
  });

  it("returns false when the permission bit is not set", () => {
    expect(enableBit(0b1010, 0b0100)).toBe(false);
    expect(enableBit(0, 16)).toBe(false);
  });

  it("treats a 0 permission as always allowed", () => {
    expect(enableBit(0, 0)).toBe(true);
    expect(enableBit(123, 0)).toBe(true);
  });

  it("requires every bit of a multi-bit permission", () => {
    expect(enableBit(0b0110, 0b0110)).toBe(true);
    expect(enableBit(0b0100, 0b0110)).toBe(false);
  });
});

describe("formatDate", () => {
  it("returns '-' for 0 / falsy", () => {
    expect(formatDate(0)).toBe("-");
  });

  it("formats an epoch (seconds) into a day-month-year string", () => {
    // 2021-07-01T12:00:00Z — midday avoids timezone date rollover.
    const out = formatDate(1625140800);
    expect(out).toMatch(/2021/);
    expect(out).toMatch(/Jul/);
  });
});

describe("formatDateTime", () => {
  it("returns '-' for 0 / falsy", () => {
    expect(formatDateTime(0)).toBe("-");
  });

  it("includes the date and a time component", () => {
    const out = formatDateTime(1625140800);
    expect(out).toMatch(/2021/);
    expect(out).toMatch(/\d{2}:\d{2}/);
  });
});

describe("toTimestamp", () => {
  it("returns 0 for an empty string", () => {
    expect(toTimestamp("")).toBe(0);
  });

  it("returns 0 for an invalid date", () => {
    expect(toTimestamp("not-a-date")).toBe(0);
    expect(toTimestamp("2026-13-40")).toBe(0);
  });

  it("converts a YYYY-MM-DD date to Unix seconds (UTC)", () => {
    expect(toTimestamp("1970-01-01")).toBe(0);
    expect(toTimestamp("2000-01-01")).toBe(946684800);
    expect(toTimestamp("2021-01-01")).toBe(1609459200);
  });

  it("returns whole seconds (milliseconds floored)", () => {
    const ts = toTimestamp("2026-06-25");
    expect(Number.isInteger(ts)).toBe(true);
    expect(ts).toBe(Math.floor(Date.parse("2026-06-25") / 1000));
  });
});

describe("formatSnakeCaseToText", () => {
  it("replaces underscores with spaces and capitalizes each word", () => {
    expect(formatSnakeCaseToText("test_test")).toBe("Test Test");
    expect(formatSnakeCaseToText("add_and_remove_members")).toBe("Add And Remove Members");
  });

  it("trims spaces from leading/trailing underscores", () => {
    expect(formatSnakeCaseToText("test_test_")).toBe("Test Test");
    expect(formatSnakeCaseToText("_test")).toBe("Test");
  });

  it("returns the original value when there is no underscore", () => {
    expect(formatSnakeCaseToText("testtest")).toBe("testtest");
    expect(formatSnakeCaseToText("")).toBe("");
  });

  it("upper-cases only the first letter, keeping the rest as-is", () => {
    expect(formatSnakeCaseToText("TEST_case")).toBe("TEST Case");
  });

  it("keeps inner double spaces for consecutive underscores", () => {
    expect(formatSnakeCaseToText("a__b")).toBe("A  B");
  });
});

describe("trimSpaceValues", () => {
  it("trims leading and trailing whitespace from string values", () => {
    expect(
      trimSpaceValues({ name: "  Alice  ", email: "a@b.com ", note: "\n hello \t" }),
    ).toEqual({ name: "Alice", email: "a@b.com", note: "hello" });
  });

  it("leaves non-string values unchanged and does not trim nested strings", () => {
    const input = { age: 30, active: true, tags: ["  a  "], meta: { x: " y " }, empty: null };
    expect(trimSpaceValues(input)).toEqual(input);
  });

  it("returns an empty object for an empty input", () => {
    expect(trimSpaceValues({})).toEqual({});
  });

  it("does not mutate the original object", () => {
    const input = { name: " bob " };
    const result = trimSpaceValues(input);
    expect(input.name).toBe(" bob ");
    expect(result).not.toBe(input);
    expect(result.name).toBe("bob");
  });
});

describe("uuidV7", () => {
  it("produces a valid v7 UUID", () => {
    expect(uuidV7()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("produces unique values", () => {
    expect(uuidV7()).not.toBe(uuidV7());
  });
});
