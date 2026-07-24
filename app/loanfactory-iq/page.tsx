"use client";

import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/components/coming-soon";
import { PortalShell } from "@/components/layouts/portal-page";

export default function LoanFactoryIqPage() {
  const { t } = useTranslation("common");

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-295 px-4 sm:px-7 py-9">
        <ComingSoon
          className="mt-10 rounded-2xl border border-dashed bg-card py-16"
          title={t("loanfactoryIq.placeholderTitle")}
          description={t("loanfactoryIq.placeholderDescription")}
        />
      </div>
    </PortalShell>
  );
}
