"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/spinner";
import { useAppSelector } from "@/store/hooks";

const AUTH_ROUTES = ["/login", "/register"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.apiToken);

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  // Chưa login → về /login. Đã login mà đang ở trang auth → về "/" để
  // app/page.tsx điều hướng tiếp (get-started nếu chưa có application, my-loans nếu đã có).
  const needsRedirect = (!token && !isAuthRoute) || (!!token && isAuthRoute);

  React.useEffect(() => {
    if (!token && !isAuthRoute) {
      router.replace("/login");
    } else if (token && isAuthRoute) {
      router.replace("/");
    }
  }, [token, isAuthRoute, router]);

  if (needsRedirect) {
    return (
      <div className="flex min-h-svh flex-1 items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return <main className="min-h-svh flex-1">{children}</main>;
}
