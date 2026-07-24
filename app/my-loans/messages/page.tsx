"use client";

import { MessageSquareIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PortalPlaceholder, PortalShell } from "@/components/layouts/portal-page";

export default function LoanMessagesPage() {
  const { t } = useTranslation("myLoans");

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-295 px-4 sm:px-7 py-9">
        <PortalPlaceholder
          icon={<MessageSquareIcon className="size-6" />}
          title={t("messages.placeholderTitle")}
          description={t("messages.placeholderDescription")}
        />
      </div>
    </PortalShell>
  );
}
