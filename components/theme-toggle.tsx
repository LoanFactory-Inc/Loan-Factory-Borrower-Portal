"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/helpers";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch: render a placeholder until mounted.
  if (!mounted) {
    return <span className={cn("inline-block size-4", className)} aria-hidden />;
  }

  const theme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <AnimatedThemeToggler
      theme={theme}
      onThemeChange={(next) => setTheme(next)}
      variant="circle"
      className={cn("[&_svg]:size-[18px]", className)}
    />
  );
}
