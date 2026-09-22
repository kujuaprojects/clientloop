import ApproveCampaignButton from "@/components/approve-campaign-button";
import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import Badge from "@/components/badge";
import { usd, fmt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { rows } = await pool.query(
    `
    SELECT
      id,
      title,
      subreddit,
      style,
      budget,
      actual_spend,
      status,
      tracking_token,
      destination_url,
      sg_job_id,
      created_at
    FROM campaigns
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  if (!rows.length) notFound();

  const campaign = rows[0];

  const { rows: eventRows } = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE type = 'visit')::int AS visits,
      COUNT(*) FILTER (WHERE type = 'lead')::int AS leads,
      COUNT(*) FILTER (WHERE type = 'booking_started')::int AS booking_starts,
      COUNT(*) FILTER (WHERE type = 'booking')::int AS bookings,
      COUNT(*) FILTER (WHERE type = 'attended')::int AS attended,
      COUNT(*) FILTER (WHERE type = 'client_won')::int AS clients,
      COALESCE(SUM(amount) FILTER (WHERE type = 'revenue'), 0)::numeric AS revenue
    FROM events
    WHERE campaign_id = $1
    `,
    [id]
  );

  const stats = eventRows[0];

  const appUrl = process.env.APP_URL || "";
  const trackedUrl = `${appUrl.replace(/\/$/, "")}/r/${campaign.tracking_token}`;

  const spend =
    campaign.status === "prepared"
      ? 0
      : Number(campaign.actual_spend) > 0
        ? Number(campaign.actual_spend)
        : Number(campaign.budget);

  const clients = Number(stats.clients || 0);
  const revenue = Number(stats.revenue || 0);
  const cac = clients > 0 ? spend / clients : null;
  const roas = spend > 0 ? revenue / spend : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/campaigns"
            className="text-sm text-brand-600 hover:text-brand-700"
          >
            ← Back to campaigns
          </Link>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {campaign.title}
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            r/{campaign.subreddit} · {campaign.style}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
  <Badge status={campaign.status} />

  {campaign.status === "prepared" ? (
    <ApproveCampaignButton campaignId={campaign.id} />
  ) : null}
</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Actual spend</p>
          <p className="mt-2 text-2xl font-semibold">{usd(spend)}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Revenue</p>
          <p className="mt-2 text-2xl font-semibold">{usd(revenue)}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Clients won</p>
          <p className="mt-2 text-2xl font-semibold">{clients}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">ROAS</p>
          <p className="mt-2 text-2xl font-semibold">
            {roas == null ? "—" : `${roas.toFixed(2)}×`}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold">Tracking</h2>

        <div className="mt-4 space-y-4 text-sm">
          <div>
            <p className="text-zinc-500">Tracking URL</p>
            <a
              href={trackedUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all text-brand-600 hover:underline"
            >
              {trackedUrl}
            </a>
          </div>

          <div>
            <p className="text-zinc-500">Destination</p>
            <p className="mt-1 break-all">{campaign.destination_url}</p>
          </div>

          <div>
            <p className="text-zinc-500">SproutGigs job ID</p>
            <p className="mt-1">{campaign.sg_job_id || "Not submitted"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold">Measured funnel</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-zinc-500">Visits</p>
            <p className="mt-1 text-xl font-semibold">{fmt(stats.visits)}</p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">Leads</p>
            <p className="mt-1 text-xl font-semibold">{fmt(stats.leads)}</p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">Booking starts</p>
            <p className="mt-1 text-xl font-semibold">
              {fmt(stats.booking_starts)}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">Calls booked</p>
            <p className="mt-1 text-xl font-semibold">{fmt(stats.bookings)}</p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">Calls attended</p>
            <p className="mt-1 text-xl font-semibold">{fmt(stats.attended)}</p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">Clients won</p>
            <p className="mt-1 text-xl font-semibold">{clients}</p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">CAC</p>
            <p className="mt-1 text-xl font-semibold">
              {cac == null ? "—" : usd(cac)}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-500">Revenue</p>
            <p className="mt-1 text-xl font-semibold">{usd(revenue)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}