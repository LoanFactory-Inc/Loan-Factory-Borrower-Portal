"use client";

import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/components/coming-soon";
import { PortalPageHeader, PortalShell } from "../components/portal-page";

export default function AiAssistantPage() {
  const { t } = useTranslation("common");

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-295 px-4 sm:px-7 py-9">
        <PortalPageHeader
          title={t("aiAssistant.title")}
          subtitle={t("aiAssistant.subtitle")}
        />
        <ComingSoon
          className="mt-10 rounded-2xl border border-dashed bg-card py-16"
          title={t("aiAssistant.placeholderTitle")}
          description={t("aiAssistant.placeholderDescription")}
        />
      </div>
    </PortalShell>
  );
}
