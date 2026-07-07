import { cn } from "@/lib/helpers";

type Tone = "blue" | "green" | "amber" | "red" | "gray";

const TONE_CLASS: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  green: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  gray: "bg-muted text-muted-foreground",
};

const DOT_CLASS: Record<Tone, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  gray: "bg-muted-foreground",
};

const STATUS_TONE: Record<string, Tone> = {
  new: "blue",
  processing: "blue",
  "in transit": "blue",
  active: "green",
  completed: "green",
  delivered: "green",
  paid: "green",
  yes: "green",
  read: "green",
  pending: "amber",
  trialing: "amber",
  shipped: "amber",
  "out of delivery": "amber",
  replied: "amber",
  delayed: "red",
  "past due": "red",
  cancelled: "red",
  canceled: "red",
  failed: "red",
  unread: "red",
  inactive: "gray",
  closed: "gray",
  no: "gray",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONE[status.toLowerCase()] ?? "gray";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT_CLASS[tone])} />
      <span className="capitalize">{status}</span>
    </span>
  );
}
