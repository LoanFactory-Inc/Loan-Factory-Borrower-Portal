import { Skeleton } from "@/components/ui/skeleton";

/** A stack of skeleton "rows" used as a loading placeholder for list/card content. */
export function SkeletonRows({ rows = 2, className }: { rows?: number; className?: string }) {
  return (
    <div className={className ?? "flex flex-col gap-2"}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-md border bg-background p-2.5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
