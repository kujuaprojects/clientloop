import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { postJob, sproutgigsConfigured } from "@/lib/sproutgigs";
import { makeTrackingToken } from "@/lib/attribution";

export const runtime = "nodejs";

export async function GET() {
  const { rows } = await pool.query("SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 50");
  return NextResponse.json({ campaigns: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { title, subreddit, style, budget, payPerTask, goalUrl, countries, redditPostUrl } = body as {
    title: string; subreddit: string; style: string;
    budget: number; payPerTask: number; goalUrl: string; countries?: string[]; redditPostUrl?: string;
  };

  if (!title || !subreddit || !budget || !payPerTask || !goalUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!Number.isFinite(Number(budget)) || Number(budget) <= 0 || !Number.isFinite(Number(payPerTask)) || Number(payPerTask) <= 0) {
    return NextResponse.json({ error: "Budget and worker reward must be positive numbers" }, { status: 400 });
  }

  let destination: URL;
  try {
    destination = new URL(goalUrl);
    if (!["http:", "https:"].includes(destination.protocol)) throw new Error("bad protocol");
  } catch {
    return NextResponse.json({ error: "Destination must be a valid http(s) URL" }, { status: 400 });
  }

  const trackingToken = makeTrackingToken();
  const refPrefix = subreddit.replace(/[^a-z0-9]/gi, "").slice(0, 12).toLowerCase() || "campaign";
  const origin = process.env.APP_URL || req.nextUrl.origin;
  const trackedUrl = `${origin.replace(/\/$/, "")}/r/${trackingToken}`;
const dryRun = true;
  const job = dryRun ? null : await postJob({
    title: String(title).slice(0, 120),
    instructions:
      `Open the campaign page below and complete only the action described on that page. ` +
      `Do not use VPNs, automation, duplicate accounts, or artificial social engagement.\n\n${trackedUrl}`,
    amountPerTask: Number(payPerTask),
    totalBudget: Number(budget),
    workerUrl: trackedUrl,
    countries,
  });

  const sgJobId = job?.job_id ?? null;
  const status = dryRun
  ? "prepared"
  : sproutgigsConfigured()
    ? "pending_review"
    : "demo";

  const { rows } = await pool.query(
    `INSERT INTO campaigns
      (title, subreddit, style, budget, pay_per_task, status, ref_prefix, tracking_token, destination_url, sg_job_id, reddit_post_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [title, subreddit, style, budget, payPerTask, status, refPrefix, trackingToken, destination.toString(), sgJobId, redditPostUrl || null]
  );

  await pool.query(
    `INSERT INTO events (campaign_id, type, ref, meta) VALUES ($1,'campaign_created',$2,$3)`,
    [rows[0].id, trackingToken, JSON.stringify({ sgJobId, trackedUrl, demo: Boolean(job?.demo) })]
  );

  return NextResponse.json({ campaign: rows[0], trackedUrl }, { status: 201 });
}
