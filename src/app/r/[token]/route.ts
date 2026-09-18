import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { appendTrackingParams, makeVisitorId } from "@/lib/attribution";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const { rows } = await pool.query(
    `SELECT id, tracking_token, destination_url
     FROM campaigns WHERE tracking_token = $1 LIMIT 1`,
    [params.token]
  );

  if (!rows.length || !rows[0].destination_url) {
    return NextResponse.json({ error: "Unknown campaign" }, { status: 404 });
  }

  const visitorId = makeVisitorId();
  const campaign = rows[0];
  await pool.query(
    `INSERT INTO events (campaign_id, type, ref, visitor_id, meta)
     VALUES ($1, 'visit', $2, $3, $4)`,
    [
      campaign.id,
      campaign.tracking_token,
      visitorId,
      JSON.stringify({
        userAgent: req.headers.get("user-agent"),
        referer: req.headers.get("referer"),
      }),
    ]
  );

  const destination = appendTrackingParams(campaign.destination_url, campaign.tracking_token, visitorId);
  const res = NextResponse.redirect(destination, 302);
  res.cookies.set("clientloop_clid", visitorId, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
