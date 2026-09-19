import Badge from "@/components/badge";
import { listCampaigns } from "@/lib/queries";
import { usd, fmt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await listCampaigns();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1><p className="mt-1 text-sm text-zinc-500">See which acquisition source creates clients, not just traffic.</p></div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-card">
        <table className="w-full min-w-[1050px] text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
            <th className="px-6 py-3.5 font-medium">Campaign</th><th className="px-6 py-3.5 font-medium">Status</th><th className="px-6 py-3.5 text-right font-medium">Spend</th><th className="px-6 py-3.5 text-right font-medium">Visits</th><th className="px-6 py-3.5 text-right font-medium">Leads</th><th className="px-6 py-3.5 text-right font-medium">Calls</th><th className="px-6 py-3.5 text-right font-medium">Clients</th><th className="px-6 py-3.5 text-right font-medium">Revenue</th><th className="px-6 py-3.5 text-right font-medium">CAC</th><th className="px-6 py-3.5 text-right font-medium">ROAS</th>
          </tr></thead>
          <tbody>{campaigns.map((c) => <tr key={c.id} className="border-t border-zinc-100 hover:bg-zinc-50/60">
            <td className="px-6 py-4"><p className="font-medium text-zinc-900">{c.title}</p><p className="text-xs text-zinc-400">r/{c.subreddit} · {c.style}</p></td>
            <td className="px-6 py-4"><Badge status={c.status} /></td>
            <td className="px-6 py-4 text-right tabular-nums">
  {usd(c.status === "prepared" ? 0 : c.spend)}
</td>
            <td className="px-6 py-4 text-right tabular-nums">{fmt(c.visits)}</td>
            <td className="px-6 py-4 text-right tabular-nums">{fmt(c.leads)}</td>
            <td className="px-6 py-4 text-right tabular-nums">{c.bookings}</td>
            <td className="px-6 py-4 text-right tabular-nums font-medium">{c.clients}</td>
            <td className="px-6 py-4 text-right tabular-nums">{usd(c.revenue)}</td>
            <td className="px-6 py-4 text-right tabular-nums">{c.cac != null ? usd(c.cac) : "—"}</td>
            <td className="px-6 py-4 text-right tabular-nums">{c.roas != null ? `${c.roas.toFixed(2)}×` : "—"}</td>
          </tr>)}{campaigns.length === 0 && <tr><td colSpan={10} className="px-6 py-12 text-center text-zinc-400">No campaigns yet.</td></tr>}</tbody>
        </table>
      </div>
    </div>
  );
}
