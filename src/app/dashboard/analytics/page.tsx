import StatCard from "@/components/stat-card";
import Funnel from "@/components/funnel";
import Sparkline from "@/components/sparkline";
import { getOverviewStats, getWeeklyBookings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [stats, weekly] = await Promise.all([getOverviewStats(), getWeeklyBookings()]);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Analytics</h1><p className="mt-1 text-sm text-zinc-500">No projection math here. These are recorded acquisition events.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={stats.revenue} money hint={stats.roas != null ? `${stats.roas.toFixed(2)}× ROAS` : "No revenue yet"} />
        <StatCard label="Calls booked" value={stats.bookings} hint={`${stats.attended} attended`} />
        <StatCard label="Clients won" value={stats.clients} accent hint={stats.bookingToClient != null ? `${(stats.bookingToClient * 100).toFixed(1)}% booking → client` : "conversion pending"} />
        <StatCard label="CAC" value={stats.cac} money hint={stats.costPerBooking != null ? `$${stats.costPerBooking.toFixed(2)} per booked call` : "waiting for bookings"} />
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-card"><h2 className="mb-4 text-[15px] font-semibold">Calls booked per week</h2><Sparkline data={weekly} /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-card"><h2 className="mb-4 text-[15px] font-semibold">Acquisition funnel</h2><Funnel visits={stats.visits} leads={stats.leads} bookingStarts={stats.bookingStarts} bookings={stats.bookings} attended={stats.attended} clients={stats.clients} /></div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-card"><h2 className="mb-4 text-[15px] font-semibold">What ClientLoop now measures</h2>
          <ul className="space-y-3 text-sm leading-6 text-zinc-600">
            <li><b className="font-semibold text-zinc-900">Visit</b> — recorded by ClientLoop before the visitor reaches your booking page.</li>
            <li><b className="font-semibold text-zinc-900">Lead</b> — an identified prospect captured on the destination page.</li>
            <li><b className="font-semibold text-zinc-900">Booking start</b> — the visitor entered the booking flow.</li>
            <li><b className="font-semibold text-zinc-900">Booked / attended</b> — real scheduling outcomes supplied by your booking webhook.</li>
            <li><b className="font-semibold text-zinc-900">Client won + revenue</b> — downstream conversion and money attributed back to the original campaign.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
