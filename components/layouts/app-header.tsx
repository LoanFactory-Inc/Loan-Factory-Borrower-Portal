"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LoanFactoryWordmark } from "@/components/loan-factory-wordmark";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProfileMenu } from "./profile-menu";
import { LanguageMenu } from "./language-menu";
// import { NotificationMenu } from "./notification-menu"; // temporarily hidden
import { cn } from "@/lib/helpers";

type NavItem = { labelKey: string; href: string };

// Documents now live inside the My loans page, so "My loans" is always the
// default lead nav — no separate Documents item, and no application-state gate.
const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.myLoans", href: "/my-loans" },
  { labelKey: "nav.rateAlerts", href: "/rate-alerts" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ApplicationHeader() {
  const pathname = usePathname();
  const { t } = useTranslation("common");
  const [scrolled, setScrolled] = React.useState(false);
  // The application flow is a focused, distraction-free screen — hide the
  // header's navigation menus while the borrower is filling it out.
  const isApplicationFlow = pathname === "/application";

  React.useEffect(() => {
    // Scrolling can happen either on the window (pages that grow past the
    // viewport) or inside an inner `overflow-y-auto` container (the portal
    // shells). `scroll` doesn't bubble, so we listen in the capture phase to
    // catch it from any element and read the offset from whatever scrolled.
    const onScroll = (e: Event) => {
      const target = e.target;
      const top = target instanceof HTMLElement ? target.scrollTop : window.scrollY;
      setScrolled(top > 8);
    };
    onScroll(new Event("scroll"));
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  const navItems = NAV_ITEMS;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 shrink-0 transition-colors duration-300",
        scrolled
          ? "border-b border-border/50 bg-card/70 shadow-sm backdrop-blur-lg backdrop-saturate-150 supports-backdrop-filter:bg-card/45"
          : "border-b border-transparent bg-card",
      )}
    >
      <div className="mx-auto flex h-16 max-w-295 items-center gap-3 px-4 sm:gap-5 sm:px-7">
        {/* Mobile nav */}
        {!isApplicationFlow && (
        <Sheet>
          <SheetTrigger
            aria-label={t("menu.open")}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-accent md:hidden"
          >
            <MenuIcon className="size-5" strokeWidth={1.9} />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">{t("menu.label")}</SheetTitle>
            <div className="flex h-16 items-center border-b px-5">
              <LoanFactoryWordmark className="h-6" />
            </div>
            <nav className="flex flex-col gap-0.5 p-3">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "rounded-lg px-3.5 py-3 text-sm font-semibold transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {t(item.labelKey)}
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        )}

        <Link href={"/my-loans"} className="shrink-0">
          <LoanFactoryWordmark className="h-6" />
        </Link>

        {/* Desktop nav */}
        {!isApplicationFlow && (
          <nav className="ml-3 hidden items-center gap-6 md:flex">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-semibold whitespace-nowrap transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <LanguageMenu />
          {/* Notification bell temporarily hidden
          <NotificationMenu />
          */}
          <span aria-hidden className="mx-1 h-5.5 w-px bg-border" />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
