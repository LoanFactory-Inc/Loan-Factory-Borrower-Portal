"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";

/**
 * Minimal portal footer: a single centered copyright line on a card-colored
 * bar with a top border. Rendered at the bottom of every signed-in page.
 */
export function AppFooterPortal() {
  const { t } = useTranslation("common");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t bg-card px-7.5 py-4.5">
      <p className="text-center text-[12.5px] text-muted-foreground">
        {t("footer.copyright", { year })}
      </p>
    </footer>
  );
}
