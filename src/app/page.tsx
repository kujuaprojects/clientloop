import Link from "next/link";
import { RefreshCcw, ArrowRight, Radar, Rocket, BarChart3, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: Radar,
    title: "Trend radar",
    body: "Live scan of the top coaching subreddits. See which post styles are winning this week and borrow them with one click.",
  },
  {
    icon: Rocket,
    title: "One-click launch",
    body: "Draft a post, set a budget, and ClientLoop creates the tracked SproutGig micro job — scheduled to fire 30 minutes after your post goes live.",
  },
  {
    icon: BarChart3,
    title: "True cost per call",
    body: "Every worker carries a tracked ref. Bookings flow back through webhooks so you know exactly which campaign paid for which call.",
  },
  {
    icon: ShieldCheck,
    title: "Compliant by design",
    body: "Workers visit your real booking page — never fake engagement on Reddit. Your account stays safe on both platforms.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <RefreshCcw size={16} />
          </div>
          <span className="text-[17px] font-semibold tracking-tight">ClientLoop</span>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Open dashboard
        </Link>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.14),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-20 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-medium text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            The Reddit → SproutGig → bookings engine for coaches
          </div>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-zinc-900">
            Post once on Reddit.<br />
            <span className="bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Book calls while you sleep.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-7 text-zinc-600">
            ClientLoop finds trending coaching conversations, helps you write in the
            styles that win, funds tracked micro-jobs that send real people to your
            booking page — and attributes every call to the campaign that caused it.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/dashboard/launch"
              className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-pop transition hover:bg-brand-700"
            >
              Launch your first campaign
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-300 px-6 py-3.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              See the dashboard
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            From the desk of Keith Muoki · Life coaching, local & international
          </p>
        </div>
      </section>

      <section className="border-t border-zinc-100 bg-zinc-50/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-card">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon size={19} strokeWidth={2.2} />
              </div>
              <h3 className="text-[15px] font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-zinc-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight">The loop, in three steps</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            ["01", "Radar surfaces a winning angle", "Trend radar shows which story frameworks are topping r/selfimprovement, r/getdisciplined and r/entrepreneur this week."],
            ["02", "You post; ClientLoop funds the traffic", "Your Reddit post goes live under your own name. ClientLoop spins up a SproutGig job that pays real workers to visit and book a free discovery call."],
            ["03", "Calls land, attribution closes the loop", "Webhooks tie every booking back to its campaign, so your cost-per-call drops every week you run it."],
          ].map(([n, t, b]) => (
            <div key={n} className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-brand-50/40 p-7">
              <span className="text-sm font-semibold text-brand-600">{n}</span>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{t}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-100 py-10 text-center text-sm text-zinc-400">
        ClientLoop · Built by Keith Muoki · Grow with the loop
      </footer>
    </div>
  );
}
