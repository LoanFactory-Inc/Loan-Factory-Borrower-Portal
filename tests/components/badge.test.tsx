import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Running</Badge>);
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("applies the variant data attribute", () => {
    render(<Badge variant="destructive">Outage</Badge>);
    expect(screen.getByText("Outage")).toHaveAttribute("data-variant", "destructive");
  });
});
