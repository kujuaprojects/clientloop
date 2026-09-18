import { fmt } from "@/lib/utils";

export default function Funnel({
  visits, leads, bookingStarts, bookings, attended, clients,
}: {
  visits: number;
  leads: number;
  bookingStarts: number;
  bookings: number;
  attended: number;
  clients: number;
}) {
  const stages = [
    { label: "Tracked visits", value: visits },
    { label: "Leads", value: leads },
    { label: "Booking starts", value: bookingStarts },
    { label: "Calls booked", value: bookings },
    { label: "Calls attended", value: attended },
    { label: "Clients won", value: clients },
  ];
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <div className="space-y-2.5">
      {stages.map((s, i) => (
        <div key={s.label}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-medium text-zinc-600">{s.label}</span>
            <span className="tabular-nums text-zinc-500">{fmt(s.value)}</span>
          </div>
          <div className="h-8 w-full overflow-hidden rounded-md bg-zinc-100">
            <div
              className={
                i === stages.length - 1
                  ? "h-full rounded-md bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : "h-full rounded-md bg-gradient-to-r from-brand-600 to-brand-400"
              }
              style={{ width: `${Math.max((s.value / max) * 100, s.value > 0 ? 6 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
