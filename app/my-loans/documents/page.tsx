"use client";

import { FileTextIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PortalPageHeader, PortalPlaceholder, PortalShell } from "../../components/portal-page";

export default function LoanDocumentsPage() {
  const { t } = useTranslation("myLoans");

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-295 px-4 sm:px-7 py-9">
        <PortalPageHeader title={t("docsPage.title")} subtitle={t("docsPage.subtitle")} />
        <PortalPlaceholder
          icon={<FileTextIcon className="size-6" />}
          title={t("docsPage.placeholderTitle")}
          description={t("docsPage.placeholderDescription")}
        />
      </div>
    </PortalShell>
  );
}
