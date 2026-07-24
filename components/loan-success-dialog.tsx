"use client";

import * as React from "react";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Celebratory success modal shown on My loans right after a borrower creates or
 * edits an application. A full-viewport confetti canvas fires a couple of bursts
 * behind the dialog. `mode` picks the create vs. edit copy.
 */
export function LoanSuccessDialog({
  mode,
  onClose,
  onSendDocuments,
}: {
  mode: "created" | "edited";
  /** Plain dismiss (Esc / click-outside). */
  onClose: () => void;
  /** Primary CTA — dismiss the modal and jump to the document-collection step. */
  onSendDocuments: () => void;
}) {
  const { t } = useTranslation("myLoans");
  const confettiRef = React.useRef<ConfettiRef>(null);

  React.useEffect(() => {
    confettiRef.current?.fire({ spread: 80, startVelocity: 42, origin: { y: 0.35 } });
    const a = window.setTimeout(
      () => confettiRef.current?.fire({ spread: 120, startVelocity: 55, particleCount: 120, origin: { y: 0.3 } }),
      260,
    );
    const b = window.setTimeout(
      () => confettiRef.current?.fire({ spread: 60, startVelocity: 35, particleCount: 60, origin: { y: 0.4 } }),
      560,
    );
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  return (
    <>
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-70 size-full"
      />
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          size="sm"
          showCloseButton={false}
          className="gap-0 overflow-hidden p-0"
        >
          {/* soft brand wash behind the icon */}
          <div className="relative flex flex-col items-center px-8 pt-10 pb-8 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-success/12 to-transparent"
            />

            {/* layered icon: blur glow + pinging ring + gradient badge */}
            <div className="relative mb-5">
              <span
                aria-hidden
                className="absolute -inset-4 rounded-full bg-success/20 blur-2xl"
              />
              <span
                aria-hidden
                className="absolute inset-0 animate-ping rounded-full bg-success/25 animation-duration-[1.8s]"
              />
              <span className="relative flex size-16 items-center justify-center rounded-full bg-linear-to-br from-success to-success/75 shadow-lg shadow-success/35 ring-8 ring-success/10">
                <CheckIcon className="size-8 text-white" strokeWidth={2.8} />
              </span>
            </div>

            <DialogTitle className="text-[22px] font-bold tracking-tight text-foreground">
              {t(`celebrate.${mode}.title`)}
            </DialogTitle>
            <DialogDescription className="mx-auto mt-2 max-w-xs text-[14.5px] leading-relaxed text-muted-foreground">
              {t(`celebrate.${mode}.description`)}
            </DialogDescription>

            <Button
              onClick={onSendDocuments}
              size="lg"
              className="mt-7 h-12 w-full gap-2 rounded-xl text-[15px] font-semibold shadow-lg shadow-primary/25"
            >
              {t("celebrate.cta")}
              <ArrowRightIcon className="size-4" strokeWidth={2.2} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
