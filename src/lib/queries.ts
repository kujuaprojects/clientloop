import pool from "./db";
import { getTrendingPosts } from "./reddit";
import type { TrendingPost } from "./reddit";

export interface Campaign {
  id: string;
  title: string;
  subreddit: string;
  style: string;
  budget: string;
  pay_per_task: string;
  status: string;
  ref_prefix: string;
  tracking_token: string | null;
  destination_url: string | null;
  sg_job_id: string | null;
  reddit_post_url: string | null;
  actual_spend: string;
  created_at: string;
  visits: number;
  leads: number;
  booking_starts: number;
  bookings: number;
  attended: number;
  clients: number;
  revenue: number;
  spend: number;
  cost_per_booking: number | null;
  cac: number | null;
  roas: number | null;
}

const METRIC_SELECT = `
  COUNT(e.*) FILTER (WHERE e.type = 'visit')::int AS visits,
  COUNT(e.*) FILTER (WHERE e.type = 'lead')::int AS leads,
  COUNT(e.*) FILTER (WHERE e.type = 'booking_started')::int AS booking_starts,
  COUNT(e.*) FILTER (WHERE e.type = 'booking')::int AS bookings,
  COUNT(e.*) FILTER (WHERE e.type = 'attended')::int AS attended,
  COUNT(e.*) FILTER (WHERE e.type = 'client_won')::int AS clients,
  COALESCE(SUM(e.amount) FILTER (WHERE e.type = 'revenue'), 0)::numeric AS revenue
`;

export async function listCampaigns(): Promise<Campaign[]> {
  const { rows } = await pool.query(
    `SELECT c.*, ${METRIC_SELECT}
     FROM campaigns c LEFT JOIN events e ON e.campaign_id = c.id
     GROUP BY c.id ORDER BY c.created_at DESC`
  );

  return rows.map((r) => {
    const spend = Number(r.actual_spend) > 0 ? Number(r.actual_spend) : Number(r.budget);
    const bookings = Number(r.bookings || 0);
    const clients = Number(r.clients || 0);
    const revenue = Number(r.revenue || 0);
    return {
      ...r,
      visits: Number(r.visits || 0),
      leads: Number(r.leads || 0),
      booking_starts: Number(r.booking_starts || 0),
      bookings,
      attended: Number(r.attended || 0),
      clients,
      revenue,
      spend,
      cost_per_booking: bookings > 0 ? spend / bookings : null,
      cac: clients > 0 ? spend / clients : null,
      roas: spend > 0 ? revenue / spend : null,
    };
  });
}

export async function getOverviewStats() {
  const { rows } = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN actual_spend > 0 THEN actual_spend ELSE budget END), 0)::numeric AS spent,
      COUNT(*) FILTER (WHERE status != 'draft')::int AS campaigns
    FROM campaigns
  `);
  const ev = await pool.query(`
    SELECT type, COUNT(*)::int AS n,
           COALESCE(SUM(amount), 0)::numeric AS amount
    FROM events GROUP BY type
  `);
  const counts = Object.fromEntries(ev.rows.map((r) => [r.type, Number(r.n)]));
  const amounts = Object.fromEntries(ev.rows.map((r) => [r.type, Number(r.amount)]));
  const spent = Number(rows[0].spent);
  const bookings = counts.booking ?? 0;
  const clients = counts.client_won ?? 0;
  const revenue = amounts.revenue ?? 0;

  return {
    spent,
    campaigns: Number(rows[0].campaigns),
    visits: counts.visit ?? 0,
    leads: counts.lead ?? 0,
    bookingStarts: counts.booking_started ?? 0,
    bookings,
    attended: counts.attended ?? 0,
    clients,
    revenue,
    costPerBooking: bookings > 0 ? spent / bookings : null,
    cac: clients > 0 ? spent / clients : null,
    roas: spent > 0 ? revenue / spent : null,
    visitToBooking: (counts.visit ?? 0) > 0 ? bookings / counts.visit : null,
    bookingToClient: bookings > 0 ? clients / bookings : null,
  };
}

export async function getWeeklyBookings(): Promise<number[]> {
  const { rows } = await pool.query(`
    WITH weeks AS (
      SELECT generate_series(
        date_trunc('week', now()) - interval '11 weeks',
        date_trunc('week', now()),
        interval '1 week'
      ) AS wk
    )
    SELECT w.wk, COUNT(e.id)::int AS n
    FROM weeks w
    LEFT JOIN events e
      ON e.type = 'booking'
     AND e.created_at >= w.wk
     AND e.created_at < w.wk + interval '1 week'
    GROUP BY w.wk ORDER BY w.wk
  `);
  return rows.map((r) => Number(r.n));
}

export async function getTrendsCached(): Promise<TrendingPost[]> {
  return getTrendingPosts();
}
