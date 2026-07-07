"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { LoanFactoryWordmark } from "@/components/loan-factory-wordmark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAppSelector } from "@/store/hooks";
import { LoginForm } from "@/app/login/components/login-form";
import { BrandPanel } from "@/app/login/components/brand-panel";

export default function LoginPage() {
  const hasAdmin = useAppSelector((state) => state.config.haveAccountAdmin);
  const { t } = useTranslation(["auth", "common"]);

  return (
    <div className="flex min-h-svh w-full">
      <BrandPanel />

      <div className="flex min-h-svh flex-1 flex-col bg-page">
        <div className="flex justify-end px-8 py-6">
          <LanguageSwitcher variant="pill" />
        </div>

        <div className="flex flex-1 items-center justify-center px-8 pb-10">
          <div className="w-full max-w-100">
            <LoanFactoryWordmark className="mb-9 h-7" />

            <h2 className="text-[27px] font-bold tracking-tight text-foreground">
              {t("login.welcomeBack")}
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground">{t("login.subtitle")}</p>

            <LoginForm />

            {hasAdmin && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {t("login.noAccount")}{" "}
                <Link
                  href="/register"
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {t("login.register")}
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Copyright footer hidden per request; restore this block to bring it back. */}
      </div>
    </div>
  );
}
