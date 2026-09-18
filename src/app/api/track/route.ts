import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cleanEventType } from "@/lib/webhooks";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ref = String(body.ref || "").trim();
  const visitorId = String(body.visitorId || body.clid || "").trim() || null;
  const type = cleanEventType(body.type);

  if (!ref || !type || !["lead", "booking_started"].includes(type)) {
    return NextResponse.json({ error: "ref and a supported tracking type are required" }, { status: 400 });
  }

  const { rows } = await pool.query(
    "SELECT id FROM campaigns WHERE tracking_token = $1 LIMIT 1",
    [ref]
  );
  if (!rows.length) return NextResponse.json({ error: "Unknown campaign" }, { status: 404 });

  const externalId = body.externalId ? String(body.externalId) : null;
  try {
    await pool.query(
      `INSERT INTO events (campaign_id, type, ref, visitor_id, external_id, meta)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [rows[0].id, type, ref, visitorId, externalId, JSON.stringify(body.meta || {})]
    );
  } catch (err: any) {
    if (err?.code !== "23505") throw err;
  }

  return NextResponse.json({ received: true });
}
