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

  console.log("TRACK DEBUG ref:", JSON.stringify(ref));

const { rows } = await pool.query(
  "SELECT id FROM campaigns WHERE tracking_token = $1 LIMIT 1",
  [ref]
);

console.log("TRACK DEBUG rows:", rows);
console.log(
  "TRACK DEBUG ref bytes:",
  Buffer.from(ref, "utf8").toString("hex"),
  "length:",
  ref.length
);

const debugToken = await pool.query(
  `
  SELECT
    id,
    tracking_token,
    length(tracking_token) AS token_length,
    encode(convert_to(tracking_token, 'UTF8'), 'hex') AS token_hex
  FROM campaigns
  WHERE id = '41194ebc-0ed4-42f5-84e6-6cbe48086e76'
  LIMIT 1
  `
);

console.log("TRACK DEBUG stored token:", debugToken.rows);
const debugCampaigns = await pool.query(
  `
  SELECT id, tracking_token, status
  FROM campaigns
  ORDER BY created_at DESC
  LIMIT 5
  `
);

console.log("TRACK DEBUG recent campaigns:", debugCampaigns.rows);
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
