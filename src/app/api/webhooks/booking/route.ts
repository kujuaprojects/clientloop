import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cleanEventType, verifySharedSecret } from "@/lib/webhooks";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!verifySharedSecret(req, "BOOKING_WEBHOOK_SECRET")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const ref = String(body.ref || req.nextUrl.searchParams.get("ref") || "").trim();
  const visitorId = String(body.visitorId || body.clid || req.nextUrl.searchParams.get("clid") || "").trim() || null;
  const email = String(body.email || req.nextUrl.searchParams.get("email") || "").trim() || null;
  const type = cleanEventType(body.type || req.nextUrl.searchParams.get("type") || "booking");
  const externalId = String(body.externalId || body.id || req.nextUrl.searchParams.get("external_id") || "").trim() || null;
  const amount = body.amount == null ? null : Number(body.amount);
  const currency = body.currency ? String(body.currency).toUpperCase().slice(0, 3) : null;

  if (!ref || !type) return NextResponse.json({ error: "ref and valid type required" }, { status: 400 });

  const { rows } = await pool.query(
    "SELECT id FROM campaigns WHERE tracking_token = $1 LIMIT 1",
    [ref]
  );
  if (!rows.length) return NextResponse.json({ error: "Unknown campaign" }, { status: 404 });

  try {
    await pool.query(
      `INSERT INTO events (campaign_id, type, ref, visitor_id, external_id, amount, currency, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        rows[0].id,
        type,
        ref,
        visitorId,
        externalId,
        Number.isFinite(amount) ? amount : null,
        currency,
        JSON.stringify({ email, provider: body.provider || null, rawStatus: body.status || null }),
      ]
    );
  } catch (err: any) {
    if (err?.code !== "23505") throw err;
  }

  return NextResponse.json({ received: true });
}
