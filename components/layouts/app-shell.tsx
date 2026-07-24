"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/spinner";
import { ChatWidget } from "@/components/chat-widget";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getMe } from "@/app/login/services";
import { setCurrentUser } from "@/store/slices/auth-slice";
import { markPortalEntered } from "@/lib/portal-entry";

const AUTH_ROUTES = ["/login", "/register"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.apiToken);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  // Mark the portal as entered once the shell mounts. This runs AFTER the
  // initial page's own mount effect (children fire first), so a landing page
  // can still tell it's the fresh entry; every later nav sees "entered".
  React.useEffect(() => {
    markPortalEntered();
  }, []);

  // Once authenticated, resolve the current user from the backend so every
  // borrower call is scoped to their canonical id. Best-effort — the axios
  // interceptor falls back to the JWT-derived id until this lands.
  React.useEffect(() => {
    if (!token || currentUser) return;
    let alive = true;
    getMe()
      .then((user) => alive && dispatch(setCurrentUser(user)))
      .catch(() => {
        /* toasted centrally; interceptor falls back to the token id */
      });
    return () => {
      alive = false;
    };
  }, [token, currentUser, dispatch]);

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

  // The floating chat lives here (not per-page) so it appears on every
  // signed-in screen consistently. Hidden on the auth routes (login/register).
  const showChat = !!token && !isAuthRoute;

  return (
    <main className="min-h-svh flex-1">
      {children}
      {showChat && <ChatWidget />}
    </main>
  );
}
