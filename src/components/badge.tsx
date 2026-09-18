import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  demo: "bg-amber-50 text-amber-700 ring-amber-200",
  pending_approval: "bg-sky-50 text-sky-700 ring-sky-200",
  pending_review: "bg-sky-50 text-sky-700 ring-sky-200",
  finished: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  declined: "bg-red-50 text-red-700 ring-red-200",
  blocked: "bg-red-50 text-red-700 ring-red-200",
  running: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  paused: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  draft: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  ended: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export default function Badge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
      STYLES[status] ?? STYLES.draft
    )}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
