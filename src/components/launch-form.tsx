"use client";
import { useState } from "react";
import { Rocket, CheckCircle2, Loader2, Link2, BarChart3 } from "lucide-react";
import { fmt, usd } from "@/lib/utils";

const STYLES = ["Personal story", "Hard-won list", "Ask-me-anything", "Contrarian take", "Data / case study"];
const SUBS = [
  { name: "selfimprovement", size: "4.9M" },
  { name: "getdisciplined", size: "1.8M" },
  { name: "lifeadvice", size: "1.1M" },
  { name: "entrepreneur", size: "4.4M" },
];

export default function LaunchForm({ bookingUrl }: { bookingUrl: string }) {
  const [title, setTitle] = useState("");
  const [sub, setSub] = useState(SUBS[0]);
  const [style, setStyle] = useState(0);
  const [budget, setBudget] = useState(40);
  const [pay, setPay] = useState(0.15);
  const [redditPostUrl, setRedditPostUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: string; trackedUrl: string } | null>(null);
  const fundedTasks = Math.floor(budget / pay);

  async function launch() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled campaign",
          subreddit: sub.name,
          style: STYLES[style],
          budget,
          payPerTask: pay,
          goalUrl: bookingUrl,
          redditPostUrl: redditPostUrl || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not launch campaign");
      setDone({ id: json.campaign.id, trackedUrl: json.trackedUrl });
    } catch (e: any) {
      setError(e?.message || "Could not launch campaign");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50/60 px-6 py-14 text-center">
        <CheckCircle2 size={40} className="text-emerald-600" />
        <h2 className="mt-4 text-xl font-semibold tracking-tight">Campaign launched</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-600">
          ClientLoop created a unique first-party tracking route. Every real visitor who passes through it is recorded before being forwarded to your booking page.
        </p>
        <div className="mt-4 max-w-xl break-all rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-xs text-zinc-600">
          {done.trackedUrl}
        </div>
        <button onClick={() => setDone(null)} className="mt-6 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
          Launch another
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-card lg:col-span-3">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-600">Campaign name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Burnout AMA — week of Sept 22" className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-600">Target subreddit</label>
          <div className="grid grid-cols-2 gap-2">
            {SUBS.map((s) => <button key={s.name} onClick={() => setSub(s)} className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${sub.name === s.name ? "border-brand-500 bg-brand-50 font-medium text-brand-700 ring-2 ring-brand-100" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}>r/{s.name}<span className="block text-xs text-zinc-400">{s.size} members</span></button>)}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-600">Post style</label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s, i) => <button key={s} onClick={() => setStyle(i)} className={`rounded-full border px-3.5 py-1.5 text-[13px] transition ${style === i ? "border-zinc-900 bg-zinc-900 font-medium text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>{s}</button>)}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-600">Reddit post URL <span className="font-normal text-zinc-400">optional</span></label>
          <input value={redditPostUrl} onChange={(e) => setRedditPostUrl(e.target.value)} placeholder="https://www.reddit.com/r/..." className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500" />
        </div>

        <div>
          <div className="mb-1.5 flex justify-between"><label className="text-[13px] font-medium text-zinc-600">Micro-job budget</label><span className="text-sm font-semibold tabular-nums">{usd(budget, 0)}</span></div>
          <input type="range" min={10} max={120} step={5} value={budget} onChange={(e) => setBudget(+e.target.value)} className="w-full accent-brand-600" />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-600">Worker reward per task</label>
          <select value={pay} onChange={(e) => setPay(+e.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500">
            <option value={0.1}>$0.10 — traffic visit</option>
            <option value={0.15}>$0.15 — visit + email signup</option>
            <option value={0.25}>$0.25 — booking-intent task</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-600">Destination</label>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 font-mono text-xs text-zinc-600">{bookingUrl}</div>
          <p className="mt-1.5 text-xs text-zinc-400">A unique ClientLoop tracking URL is generated at launch and forwards visitors here with ref + clid attribution.</p>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button onClick={launch} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-pop transition hover:bg-brand-700 disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}{busy ? "Creating campaign…" : "Launch campaign"}
        </button>
      </div>

      <div className="h-fit space-y-5 rounded-xl border border-zinc-200 bg-zinc-900 p-6 text-white shadow-card lg:col-span-2">
        <div><p className="text-[13px] font-medium text-zinc-400">Campaign funding</p><p className="mt-2 text-3xl font-semibold tabular-nums">{fmt(fundedTasks)}</p><p className="text-xs text-zinc-500">maximum funded tasks before platform fees / unused balance</p></div>
        <div className="border-t border-zinc-800 pt-5">
          <div className="flex gap-3"><Link2 size={17} className="mt-0.5 text-brand-400" /><div><p className="text-sm font-semibold">First-party tracking</p><p className="mt-1 text-xs leading-5 text-zinc-400">ClientLoop records visits itself instead of estimating them from worker events.</p></div></div>
          <div className="mt-4 flex gap-3"><BarChart3 size={17} className="mt-0.5 text-emerald-400" /><div><p className="text-sm font-semibold">Measured downstream value</p><p className="mt-1 text-xs leading-5 text-zinc-400">Lead, booking start, booking, attendance, client win, and revenue can all map back to this campaign.</p></div></div>
        </div>
        <p className="border-t border-zinc-800 pt-4 text-xs leading-5 text-zinc-500">ClientLoop will build reliable benchmarks from actual campaign history. It will not manufacture projected bookings before enough real data exists.</p>
      </div>
    </div>
  );
}
