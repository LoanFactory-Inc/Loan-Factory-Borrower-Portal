"use client";

import * as React from "react";
import { SendIcon, SparklesIcon, UploadIcon, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AnimatedBeam } from "@/components/ui/animated-beam";

type Step = { icon: LucideIcon; key: string };

const STEPS: Step[] = [
  { icon: UploadIcon, key: "step1" },
  { icon: SparklesIcon, key: "step2" },
  { icon: SendIcon, key: "step3" },
];

export function HowItWorks() {
  const { t } = useTranslation("loanPurpose");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const node1 = React.useRef<HTMLDivElement>(null);
  const node2 = React.useRef<HTMLDivElement>(null);
  const node3 = React.useRef<HTMLDivElement>(null);
  const nodeRefs = [node1, node2, node3];

  return (
    <section className="mt-16">
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold tracking-wide text-accent-foreground">
          <SparklesIcon className="size-3.5" />
          {t("howItWorks.badge")}
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          {t("howItWorks.heading")}
        </h2>
      </div>

      <div
        ref={containerRef}
        className="relative mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3"
      >
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex flex-col items-center text-center">
              <div
                ref={nodeRefs[i]}
                className="z-10 flex size-16 items-center justify-center rounded-2xl border bg-card shadow-sm"
              >
                <Icon className="size-7 text-primary" strokeWidth={1.7} />
              </div>
              <div className="mt-4 text-[11px] font-bold tracking-wide text-accent-foreground uppercase">
                {t(`howItWorks.steps.${s.key}.label`)}
              </div>
              <div className="mt-1 text-[15px] font-bold text-foreground">
                {t(`howItWorks.steps.${s.key}.title`)}
              </div>
              <p className="mt-1.5 max-w-[240px] text-[13.5px] leading-relaxed text-muted-foreground">
                {t(`howItWorks.steps.${s.key}.desc`)}
              </p>
            </div>
          );
        })}

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={node1}
          toRef={node2}
          pathColor="#e8e9f1"
          pathWidth={2}
          pathOpacity={1}
          gradientStartColor="#F37026"
          gradientStopColor="#FBB97C"
          duration={3}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={node2}
          toRef={node3}
          pathColor="#e8e9f1"
          pathWidth={2}
          pathOpacity={1}
          gradientStartColor="#F37026"
          gradientStopColor="#FBB97C"
          duration={3}
          delay={0.6}
        />
      </div>
    </section>
  );
}
