import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/helpers";
import illustration from "@/public/Waiting-pana.svg";

/**
 * Placeholder shown on portal sections that are not built yet. Renders the
 * "waiting" illustration above a title and description so unimplemented pages
 * read as intentionally coming soon rather than broken.
 */
export function ComingSoon({
  title,
  description,
  action,
  className,
  imageClassName,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      <Image
        src={illustration}
        alt=""
        aria-hidden
        unoptimized
        className={cn("mb-6 h-72 w-auto max-w-full select-none", imageClassName)}
      />
      <div className="text-[15.5px] font-bold text-foreground">{title}</div>
      {description && (
        <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
