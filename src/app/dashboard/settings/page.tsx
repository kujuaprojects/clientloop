import { CheckCircle2, XCircle } from "lucide-react";
import { sproutgigsConfigured } from "@/lib/sproutgigs";
import { redditConfigured } from "@/lib/reddit";

export const dynamic = "force-dynamic";

function Row({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4 first:border-t-0"><div><p className="text-sm font-medium text-zinc-900">{label}</p><p className="mt-0.5 text-xs text-zinc-500">{detail}</p></div>{ok ? <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600"><CheckCircle2 size={16} /> Connected</span> : <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400"><XCircle size={16} /> Not set</span>}</div>;
}

export default function SettingsPage() {
  const appUrl = process.env.APP_URL || "https://your-clientloop-domain.com";
  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Settings</h1><p className="mt-1 text-sm text-zinc-500">Connection and attribution status.</p></div>
      <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white shadow-card">
        <Row label="SproutGigs API" ok={sproutgigsConfigured()} detail="Creates and synchronizes micro-job campaigns." />
        <Row label="Reddit API" ok={redditConfigured()} detail="Powers the trend radar. Demo data is used without keys." />
        <Row label="Booking destination" ok={Boolean(process.env.BOOKING_URL)} detail={`Currently: ${process.env.BOOKING_URL || "not set"}`} />
        <Row label="Database" ok={Boolean(process.env.DATABASE_URL)} detail="Stores the campaign + event attribution ledger." />
        <Row label="Booking webhook security" ok={Boolean(process.env.BOOKING_WEBHOOK_SECRET)} detail="Required in production to reject forged conversion events." />
        <Row label="Dashboard protection" ok={Boolean(process.env.DASHBOARD_USER && process.env.DASHBOARD_PASSWORD)} detail="HTTP Basic protection for dashboard and campaign creation." />
      </div>

      <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-5 text-sm leading-6 text-zinc-600">
        <p className="font-semibold text-zinc-900">Destination-page events</p>
        <p className="mt-1">Preserve the <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">ref</code> and <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">clid</code> query parameters. Send <b>lead</b> and <b>booking_started</b> events to:</p>
        <code className="mt-2 block overflow-x-auto rounded-lg bg-white p-3 font-mono text-xs text-brand-700 ring-1 ring-brand-100">POST {appUrl}/api/track</code>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5 text-sm leading-6 text-zinc-600">
        <p className="font-semibold text-zinc-900">Booking, attendance, clients and revenue</p>
        <p className="mt-1">Your CRM / booking automation should POST to <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">/api/webhooks/booking</code> with the same campaign ref. Supported event types: <b>booking</b>, <b>attended</b>, <b>client_won</b>, and <b>revenue</b>. Revenue events include <code className="font-mono text-xs">amount</code> and <code className="font-mono text-xs">currency</code>.</p>
      </div>
    </div>
  );
}
