"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ApplicationHeader } from "@/app/application/components/app-header";
import illustration from "@/public/404-illustration.svg";

export default function NotFound() {
  const router = useRouter();
  const { t } = useTranslation("common");

  return (
    <div className="flex min-h-svh flex-col bg-page">
      <ApplicationHeader />

      <main className="flex flex-1 items-center justify-center px-6 py-12 pb-22">
        <div className="flex w-full max-w-140 flex-col items-center text-center">
          {/* illustration */}
          <Image
            src={illustration}
            alt=""
            aria-hidden
            priority
            unoptimized
            className="mb-3 h-auto w-full max-w-120"
          />

          <h1 className="mt-4.5 text-[34px] leading-[1.15] font-bold tracking-tight text-foreground">
            {t("notFound.title")}
          </h1>
          <p className="mt-3.5 max-w-110 text-[15.5px] leading-relaxed text-muted-foreground">
            {t("notFound.description")}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <InteractiveHoverButton
              onClick={() => router.push("/my-loans")}
              className="h-11.5 rounded-lg border-primary/25 bg-card px-5.5 text-sm text-foreground shadow-xs"
            >
              {t("notFound.backToLoans")}
            </InteractiveHoverButton>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11.5 rounded-lg px-5.5 text-sm"
            >
              <Link href="/quote">{t("notFound.getQuote")}</Link>
            </Button>
          </div>

          <p className="mt-6 text-[13.5px] text-muted-foreground">
            {t("notFound.contactPrefix")}{" "}
            <Link href="#" className="font-semibold text-primary hover:underline">
              {t("notFound.contactLink")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
