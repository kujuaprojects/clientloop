import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getTrendingPosts, redditConfigured } from "@/lib/reddit";
import { fmt } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STYLE_BADGE: Record<string, string> = {
  "Personal story": "bg-violet-50 text-violet-700 ring-violet-200",
  "Hard-won list": "bg-sky-50 text-sky-700 ring-sky-200",
  "Ask-me-anything": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Contrarian take": "bg-rose-50 text-rose-700 ring-rose-200",
  "Data / case study": "bg-amber-50 text-amber-700 ring-amber-200",
};

export default async function RadarPage() {
  const posts = await getTrendingPosts();
  const isLive = redditConfigured();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trend radar</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Top posts across your niche this week — steal the style, not the content.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {isLive ? "Live from Reddit" : "Demo data"}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-6 py-3.5 font-medium">Post</th>
              <th className="px-6 py-3.5 font-medium">Detected style</th>
              <th className="px-6 py-3.5 text-right font-medium">Upvotes</th>
              <th className="px-6 py-3.5 text-right font-medium">Comments</th>
              <th className="px-6 py-3.5 text-right font-medium">Heat</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p, i) => (
              <tr key={i} className="border-t border-zinc-100 transition-colors hover:bg-zinc-50/60">
                <td className="max-w-md px-6 py-4">
                  <a href={p.url} target="_blank" rel="noreferrer" className="group flex items-start gap-2">
                    <span className="font-medium leading-6 text-zinc-900 group-hover:text-brand-700">
                      {p.title}
                    </span>
                    <ExternalLink size={13} className="mt-1.5 shrink-0 text-zinc-300 group-hover:text-brand-500" />
                  </a>
                  <span className="text-xs text-zinc-400">r/{p.subreddit}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLE_BADGE[p.style] ?? STYLE_BADGE["Personal story"]}`}>
                    {p.style}
                  </span>
                </td>
                <td className="px-6 py-4 text-right tabular-nums text-zinc-700">{fmt(p.score)}</td>
                <td className="px-6 py-4 text-right tabular-nums text-zinc-700">{fmt(p.numComments)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="ml-auto h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                      style={{ width: `${Math.min((p.score / (posts[0]?.score || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
