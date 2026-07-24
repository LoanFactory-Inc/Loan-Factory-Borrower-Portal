"use client";

import * as React from "react";
import Link from "next/link";
import {
  BellIcon,
  CheckCircle2Icon,
  FileTextIcon,
  PenLineIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/helpers";

type Notification = {
  id: string;
  icon: React.ReactNode;
  titleKey: string;
  bodyKey: string;
  timeKey: string;
  href: string;
  unread: boolean;
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "document",
    icon: <FileTextIcon className="size-4.25" strokeWidth={1.8} />,
    titleKey: "notifications.items.document.title",
    bodyKey: "notifications.items.document.body",
    timeKey: "notifications.items.document.time",
    href: "/my-loans",
    unread: true,
  },
  {
    id: "review",
    icon: <CheckCircle2Icon className="size-4.25" strokeWidth={1.8} />,
    titleKey: "notifications.items.review.title",
    bodyKey: "notifications.items.review.body",
    timeKey: "notifications.items.review.time",
    href: "/my-loans",
    unread: true,
  },
  {
    id: "signature",
    icon: <PenLineIcon className="size-4.25" strokeWidth={1.8} />,
    titleKey: "notifications.items.signature.title",
    bodyKey: "notifications.items.signature.body",
    timeKey: "notifications.items.signature.time",
    href: "/my-loans",
    unread: false,
  },
  {
    id: "rate",
    icon: <TrendingUpIcon className="size-4.25" strokeWidth={1.8} />,
    titleKey: "notifications.items.rate.title",
    bodyKey: "notifications.items.rate.body",
    timeKey: "notifications.items.rate.time",
    href: "/rate-alerts",
    unread: false,
  },
];

export function NotificationMenu() {
  const { t } = useTranslation("common");
  const [notifications, setNotifications] =
    React.useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const isEmpty = notifications.length === 0;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("notifications.label")}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-accent aria-expanded:bg-muted"
      >
        <BellIcon className="size-4.5" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-card" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={16}
        className="w-89 overflow-hidden rounded-2xl p-0"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b px-4.5 py-3.5">
          <div className="flex items-center gap-2.25">
            <span className="text-[15px] font-bold text-foreground">
              {t("notifications.title")}
            </span>
            {unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[12.5px] font-semibold text-primary transition-opacity hover:opacity-80"
            >
              {t("notifications.markAll")}
            </button>
          )}
        </div>

        {/* list */}
        <div className="max-h-93 divide-y divide-border/40 overflow-y-auto">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className="flex items-start gap-3 px-4.5 py-3.5 transition-colors hover:bg-muted"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-secondary text-muted-foreground">
                {n.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      "text-[13.5px] text-foreground",
                      n.unread ? "font-bold" : "font-semibold",
                    )}
                  >
                    {t(n.titleKey)}
                  </div>
                  {n.unread && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                  {t(n.bodyKey)}
                </p>
                <div className="mt-1.5 text-[11.5px] font-medium text-muted-foreground/70">
                  {t(n.timeKey)}
                </div>
              </div>
            </Link>
          ))}

          {isEmpty && (
            <div className="px-5 py-10 text-center">
              <div className="text-[14px] font-bold text-foreground">
                {t("notifications.empty.title")}
              </div>
              <div className="mt-1 text-[12.5px] text-muted-foreground">
                {t("notifications.empty.subtitle")}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="border-t px-4.5 py-3 text-center">
          <Link
            href="/my-loans"
            className="text-[13px] font-semibold text-primary hover:underline"
          >
            {t("notifications.viewAll")}
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
