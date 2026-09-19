import Link from "next/link";
import { ArrowRight, Rocket } from "lucide-react";
import StatCard from "@/components/stat-card";
import Funnel from "@/components/funnel";
import Sparkline from "@/components/sparkline";
import Badge from "@/components/badge";
import { getOverviewStats, getWeeklyBookings, listCampaigns } from "@/lib/queries";
import { usd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const [stats, weekly, campaigns] = await Promise.all([
    getOverviewStats(), getWeeklyBookings(), listCampaigns(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, Keith</h1>
          <p className="mt-1 text-sm text-zinc-500">Measured acquisition from first visit to paying client.</p>
        </div>
        <Link href="/dashboard/launch" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700">
          <Rocket size={15} /> New campaign
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <StatCard
    label="Tracked spend"
    value={stats.spent}
    money
    hint={`${stats.campaigns} tracked campaigns`}
  />

  <StatCard
    label="Revenue attributed"
    value={stats.revenue}
    money
    hint={
      stats.roas != null
        ? `${stats.roas.toFixed(2)}x return on spend`
        : "Waiting for revenue events"
    }
  />

  <StatCard
    label="Clients won"
    value={stats.clients}
    accent
    hint={`${stats.attended} calls attended`}
  />

  <StatCard
    label="Client acquisition cost"
    value={stats.cac}
    money
    hint={`${stats.bookings} calls booked`}
  />
</div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-card lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Calls booked per week</h2>
            <Link href="/dashboard/analytics" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">Full analytics <ArrowRight size={12} /></Link>
          </div>
          <Sparkline data={weekly} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-card lg:col-span-2">
          <h2 className="mb-4 text-[15px] font-semibold">Measured funnel</h2>
          <Funnel visits={stats.visits} leads={stats.leads} bookingStarts={stats.bookingStarts} bookings={stats.bookings} attended={stats.attended} clients={stats.clients} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-[15px] font-semibold">Recent campaigns</h2>
          <Link href="/dashboard/campaigns" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">View all <ArrowRight size={12} /></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-6 py-3 font-medium">Campaign</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 text-right font-medium">Spend</th><th className="px-6 py-3 text-right font-medium">Calls</th><th className="px-6 py-3 text-right font-medium">Clients</th><th className="px-6 py-3 text-right font-medium">Revenue</th>
            </tr></thead>
            <tbody>
              {campaigns.slice(0, 5).map((c) => <tr key={c.id} className="border-t border-zinc-100">
                <td className="px-6 py-3.5"><p className="font-medium text-zinc-900">{c.title}</p><p className="text-xs text-zinc-400">r/{c.subreddit} · {c.style}</p></td>
                <td className="px-6 py-3.5"><Badge status={c.status} /></td>
                <td className="px-6 py-3.5 text-right tabular-nums">{usd(c.spend)}</td>
                <td className="px-6 py-3.5 text-right tabular-nums">{c.bookings}</td>
                <td className="px-6 py-3.5 text-right tabular-nums font-medium">{c.clients}</td>
                <td className="px-6 py-3.5 text-right tabular-nums">{usd(c.revenue)}</td>
              </tr>)}
              {campaigns.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-zinc-400">No campaigns yet — launch your first one.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
