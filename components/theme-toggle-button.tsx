"use client";

import { useTheme } from "next-themes";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/helpers";

/**
 * Header dark/light switch built on MagicUI's AnimatedThemeToggler, run in
 * controlled mode so `next-themes` owns persistence and the class attribute.
 * Before next-themes resolves (server + first client render) it reads as light,
 * so there's no hydration mismatch; the icon settles once mounted.
 */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <AnimatedThemeToggler
      variant="circle"
      theme={theme}
      onThemeChange={setTheme}
      aria-label="Toggle theme"
      className={cn(
        "flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-accent [&>svg]:size-4.5",
        className,
      )}
    />
  );
}
