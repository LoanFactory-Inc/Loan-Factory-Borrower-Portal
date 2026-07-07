"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/spinner";
import { useAppSelector } from "@/store/hooks";

export default function HomePage() {
  const router = useRouter();
  const isLoggedIn = useAppSelector((state) => Boolean(state.auth.apiToken));
  const hasApplication = useAppSelector((state) => state.application.applications.length > 0);

  React.useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    router.replace(hasApplication ? "/my-loans" : "/get-started");
  }, [isLoggedIn, hasApplication, router]);

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  );
}
