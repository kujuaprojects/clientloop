import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "attended",
  "client_won",
  "revenue",
]);

export async function POST(req: NextRequest) {
  const secret = process.env.OUTCOMES_API_SECRET;

  const suppliedSecret =
    req.headers.get("x-clientloop-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!secret || suppliedSecret !== secret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  const type = String(body.type || "").trim();
  const visitorId = String(body.visitor_id || "").trim() || null;
  const ref = String(body.ref || "").trim() || null;
  const externalId = String(body.external_id || "").trim() || null;

  const amount =
    body.amount !== undefined && body.amount !== null
      ? Number(body.amount)
      : null;

  const currency =
    String(body.currency || "").trim().toUpperCase() || null;

  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { error: "Unsupported outcome type" },
      { status: 400 }
    );
  }

  if (type === "revenue") {
    if (!Number.isFinite(amount) || amount === null || amount < 0) {
      return NextResponse.json(
        { error: "Valid revenue amount required" },
        { status: 400 }
      );
    }
  }

  if (!visitorId && !ref) {
    return NextResponse.json(
      { error: "visitor_id or ref is required" },
      { status: 400 }
    );
  }

  let campaignId: string | null = null;
  let resolvedRef: string | null = ref;

  if (visitorId) {
    const visit = await pool.query(
      `SELECT campaign_id, ref
       FROM events
       WHERE visitor_id = $1
         AND campaign_id IS NOT NULL
       ORDER BY created_at ASC
       LIMIT 1`,
      [visitorId]
    );

    if (visit.rows.length) {
      campaignId = visit.rows[0].campaign_id;
      resolvedRef = resolvedRef || visit.rows[0].ref;
    }
  }

  if (!campaignId && ref) {
    const campaign = await pool.query(
      `SELECT id, tracking_token
       FROM campaigns
       WHERE tracking_token = $1
       LIMIT 1`,
      [ref]
    );

    if (campaign.rows.length) {
      campaignId = campaign.rows[0].id;
      resolvedRef = campaign.rows[0].tracking_token;
    }
  }

  if (!campaignId) {
    return NextResponse.json(
      { error: "Campaign attribution not found" },
      { status: 404 }
    );
  }

  try {
    const result = await pool.query(
      `INSERT INTO events
       (
         campaign_id,
         type,
         ref,
         visitor_id,
         external_id,
         amount,
         currency,
         meta
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, type, campaign_id, visitor_id, amount, currency, created_at`,
      [
        campaignId,
        type,
        resolvedRef,
        visitorId,
        externalId,
        type === "revenue" ? amount : null,
        type === "revenue" ? currency || "USD" : null,
        JSON.stringify({
          source: "outcomes_api",
          note: body.note || null,
        }),
      ]
    );

    return NextResponse.json({
      ok: true,
      event: result.rows[0],
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      return NextResponse.json({
        ok: true,
        duplicate: true,
      });
    }

    throw err;
  }
}