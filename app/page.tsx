"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/spinner";
import { useAppSelector } from "@/store/hooks";

export default function HomePage() {
  const router = useRouter();
  const isLoggedIn = useAppSelector((state) => Boolean(state.auth.apiToken));

  React.useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    // My loans is the single home for a signed-in borrower — it carries the
    // get-started hero, the in-progress card, and (once submitted) the loan
    // summary plus document collection all in one place.
    router.replace("/my-loans");
  }, [isLoggedIn, router]);

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  );
}
