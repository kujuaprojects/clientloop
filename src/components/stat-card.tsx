import { cn, fmt, usd } from "@/lib/utils";

export default function StatCard({
  label, value, money, hint, accent,
}: {
  label: string; value: number | null; money?: boolean; hint?: string; accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-card">
      <p className="text-[13px] font-medium text-zinc-500">{label}</p>
      <p className={cn(
        "mt-1.5 text-[28px] font-semibold leading-8 tracking-tight",
        accent ? "text-emerald-600" : "text-zinc-900"
      )}>
        {value === null ? "—" : money ? usd(value) : fmt(value)}
      </p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
